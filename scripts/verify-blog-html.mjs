import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { parse } from 'parse5';

const sourceRoot = resolve('src/pages/blog');
const outputRoot = resolve('dist');
const site = 'https://korntewin.github.io';
const base = '/intro-website';
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const hasClass = (node, name) => (attr(node, 'class') ?? '').split(/\s+/).includes(name);
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join(' ');
const normalize = (s) => s.replace(/\s+/g, ' ').trim();
function all(node) { return [node, ...(node.childNodes ?? []).flatMap(all)]; }
const rawText = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(rawText).join('');
// Include images in the text stream so moving a figure to the wrong paragraph fails.
const contentStream = (node) => node.tagName === 'img'
  ? `\n[image:${attr(node, 'src')}]\n`
  : node.tagName === 'br' ? '\n'
  : node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(contentStream).join('');
async function markdownFiles(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? markdownFiles(resolve(folder, entry.name))
    : entry.name.endsWith('.md') ? [resolve(folder, entry.name)] : []));
  return nested.flat();
}
function tableRows(markdown) {
  const lines = markdown.split(/\r?\n/), rows = [];
  let inTable = false;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(lines[i])) { inTable = true; continue; }
    if (!lines[i].startsWith('|')) { inTable = false; continue; }
    if (inTable) rows.push(lines[i].split('|').slice(1, -1).map((s) => normalize(s.replace(/[*`]/g, ''))));
  }
  return rows;
}

let articles = 0, imageCount = 0;
for (const filename of await markdownFiles(sourceRoot)) {
  const markdown = await readFile(filename, 'utf8');
  if (!markdown.includes('BlogLayout.astro')) continue;
  const slug = relative(sourceRoot, filename).replaceAll('\\', '/').replace(/\.md$/, '').replace(/\/index$/, '');
  const canonical = `${site}${base}/blog/${slug}/`;
  const html = await readFile(resolve(outputRoot, 'blog', slug, 'index.html'), 'utf8');
  const dom = parse(html), nodes = all(dom);
  const articleNodes = nodes.filter((n) => n.tagName === 'article');
  assert.equal(articleNodes.length, 1, `${slug}: exactly one article`);
  const article = articleNodes[0], descendants = all(article);
  const contentBodies = descendants.filter((n) => hasClass(n, 'e-content'));
  assert.equal(contentBodies.length, 1, `${slug}: h-entry exposes one full HTML content property`);
  const body = contentBodies[0], bodyNodes = all(body);
  assert.equal(body.parentNode, article, `${slug}: body belongs to this article`);
  assert.equal(attr(body, 'itemprop'), 'articleBody');
  const h1s = descendants.filter((n) => n.tagName === 'h1');
  assert.equal(h1s.length, 1, `${slug}: one article title`);
  assert.equal(h1s[0].parentNode, article, `${slug}: h1 is a direct article child`);
  assert.equal(attr(article, 'aria-labelledby'), attr(h1s[0], 'id'));
  assert.equal(nodes.filter((n) => n.tagName === 'h1').length, 1);
  assert(descendants.some((n) => n.tagName === 'time' && /^\d{4}-\d{2}-\d{2}$/.test(attr(n, 'datetime') ?? '')));
  const canonicalLinks = nodes.filter((n) => n.tagName === 'link' && attr(n, 'rel') === 'canonical');
  assert.equal(canonicalLinks.length, 1);
  assert.equal(attr(canonicalLinks[0], 'href'), canonical);
  assert(nodes.some((n) => n.tagName === 'meta' && attr(n, 'property') === 'og:type' && attr(n, 'content') === 'article'));
  assert(!descendants.some((n) => ['script', 'astro-island', 'table'].includes(n.tagName)), `${slug}: static article, no tables or islands`);

  const sourceImages = [...markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)];
  const images = descendants.filter((n) => n.tagName === 'img');
  assert.equal(images.length, sourceImages.length, `${slug}: image count preserved`);
  assert.deepEqual(images.map((n) => attr(n, 'src')), sourceImages.map((m) => m[1]), `${slug}: source image order preserved`);
  assert.equal(bodyNodes.filter((n) => n.tagName === 'img').length, images.length, `${slug}: all images are in extracted content`);
  assert(descendants.filter((n) => /^h[2-6]$/.test(n.tagName ?? '')).every((n) => bodyNodes.includes(n)), `${slug}: all story sections are in extracted content`);
  const cover = nodes.find((n) => n.tagName === 'meta' && attr(n, 'property') === 'og:image');
  if (markdown.includes('\ncoverImage:')) assert.equal(attr(cover, 'content'), attr(images[0], 'src'), `${slug}: cover metadata points at the actual cover`);
  assert.equal(descendants.filter((n) => n.tagName === 'figure').length, images.length);
  for (const image of images) {
    const src = attr(image, 'src'), url = new URL(src);
    assert.equal(url.protocol, 'https:');
    assert.equal(attr(image, 'loading'), 'eager');
    assert(attr(image, 'alt')?.trim(), 'image alt is preserved');
    assert(!image.attrs.some((a) => ['srcset', 'data-src', 'data-srcset'].includes(a.name)));
    const figure = image.parentNode;
    assert.equal(figure.tagName, 'figure');
    assert.equal(figure.parentNode, body, `${slug}: figure is a direct content child`);
    assert(figure.childNodes.some((n) => n.tagName === 'figcaption' && text(n).trim()));
    if (url.origin === site) {
      assert(url.pathname.startsWith(`${base}/blog/figures/`));
      assert(url.pathname.endsWith('.png'));
      const diskPath = resolve(outputRoot, decodeURIComponent(url.pathname.slice(base.length)).replace(/^\/+/, ''));
      assert(diskPath.startsWith(outputRoot + '/'));
      const bytes = await readFile(diskPath);
      assert(bytes.length > 24 && bytes.subarray(0, 8).equals(signature), `${src}: actual PNG bytes`);
      assert.equal(Number(attr(image, 'width')), bytes.readUInt32BE(16));
      assert.equal(Number(attr(image, 'height')), bytes.readUInt32BE(20));
    }
    imageCount += 1;
  }
  const rows = tableRows(markdown);
  const records = descendants.filter((n) => hasClass(n, 'comparison-record'));
  assert.equal(records.length, rows.length, `${slug}: all table rows rendered as paragraphs`);
  rows.forEach((cells, index) => {
    for (const cell of cells) assert(normalize(text(records[index])).includes(cell), `${slug}: missing cell ${cell}`);
  });

  const importHtml = await readFile(resolve(outputRoot, 'blog', slug, 'medium', 'index.html'), 'utf8');
  const importNodes = all(parse(importHtml));
  const importEntries = importNodes.filter((n) => hasClass(n, 'h-entry'));
  assert.equal(importEntries.length, 1, `${slug}: one import entry`);
  const importEntry = importEntries[0], importDescendants = all(importEntry);
  const importBodies = importDescendants.filter((n) => hasClass(n, 'e-content'));
  assert.equal(importBodies.length, 1, `${slug}: import exposes one full HTML content property`);
  const importBody = importBodies[0];
  assert.equal(normalize(contentStream(importBody)), normalize(contentStream(body)), `${slug}: full text and image positions survive export`);
  assert.equal(normalize(rawText(importEntry)), normalize(rawText(article)), `${slug}: title, date, summary, captions and prose survive export`);
  assert.deepEqual(importDescendants.filter((n) => n.tagName === 'pre').map(rawText), descendants.filter((n) => n.tagName === 'pre').map(rawText), `${slug}: code whitespace survives export`);
  const importImages = importDescendants.filter((n) => n.tagName === 'img');
  assert.deepEqual(importImages.map((n) => attr(n, 'src')), images.map((n) => attr(n, 'src')), `${slug}: export image order preserved`);
  for (const image of importImages) {
    assert.equal(image.parentNode.tagName, 'p', `${slug}: import images use plain paragraphs`);
    assert(attr(image, 'alt')?.trim());
    assert(Number(attr(image, 'width')) > 0 && Number(attr(image, 'height')) > 0);
  }
  assert(!importNodes.some((n) => ['script', 'astro-island', 'nav', 'figure', 'figcaption'].includes(n.tagName)), `${slug}: import has no interactive chrome or figure wrappers`);
  const importCanonicals = importNodes.filter((n) => n.tagName === 'link' && attr(n, 'rel') === 'canonical');
  assert.equal(importCanonicals.length, 1);
  assert.equal(attr(importCanonicals[0], 'href'), canonical, `${slug}: original URL stays canonical`);
  assert(importNodes.some((n) => n.tagName === 'meta' && attr(n, 'name') === 'robots' && attr(n, 'content').includes('noindex')), `${slug}: export is not indexed separately`);
  assert(nodes.some((n) => n.tagName === 'a' && attr(n, 'href') === canonical + 'medium/'), `${slug}: original article links to the import view`);
  articles += 1;
  console.log(`Verified ${slug}: complete e-content, ${images.length} figures, ${rows.length} comparison records, matching plain import view and canonical metadata.`);
}
assert(articles > 0, 'No blog pages were checked');
console.log(`Verified ${articles} article(s) and ${imageCount} PNG figures in generated HTML.`);
