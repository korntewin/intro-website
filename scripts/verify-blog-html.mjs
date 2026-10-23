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
  assert.equal(descendants.filter((n) => n.tagName === 'figure').length, images.length);
  for (const image of images) {
    const src = attr(image, 'src'), url = new URL(src);
    assert.equal(url.protocol, 'https:');
    assert.equal(attr(image, 'loading'), 'eager');
    assert(attr(image, 'alt')?.trim(), 'image alt is preserved');
    assert(!image.attrs.some((a) => ['srcset', 'data-src', 'data-srcset'].includes(a.name)));
    const figure = image.parentNode;
    assert.equal(figure.tagName, 'figure');
    assert.equal(figure.parentNode, article, `${slug}: figure is a direct article child`);
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
  articles += 1;
  console.log(`Verified ${slug}: title inside article, ${images.length} direct figures, ${rows.length} comparison records, canonical metadata.`);
}
assert(articles > 0, 'No blog pages were checked');
console.log(`Verified ${articles} article(s) and ${imageCount} PNG figures in generated HTML.`);
