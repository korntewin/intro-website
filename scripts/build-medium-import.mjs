import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, serializeOuter } from 'parse5';

const namespaceURI = 'http://www.w3.org/1999/xhtml';
const attr = (node, name) => node.attrs?.find((entry) => entry.name === name)?.value;
const all = (node) => [node, ...(node.childNodes ?? []).flatMap(all)];
const hasClass = (node, name) => (attr(node, 'class') ?? '').split(/\s+/).includes(name);
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const safeTags = new Set(['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'img', 'em', 'strong', 'pre', 'code', 'blockquote', 'ul', 'ol', 'li', 'br', 'hr', 'time', 'sup', 'sub', 's', 'del']);
const omitTags = new Set(['script', 'style', 'template', 'noscript', 'iframe', 'object', 'embed', 'astro-island', 'svg', 'canvas', 'button', 'form', 'input', 'select', 'textarea', 'nav', 'footer']);
const semanticClasses = new Set(['h-entry', 'hentry', 'p-name', 'entry-title', 'p-summary', 'entry-summary', 'e-content', 'entry-content', 'dt-published', 'published', 'dt-updated', 'updated', 'u-url', 'u-author', 'p-author', 'h-card']);
const semanticProperties = new Set(['headline', 'description', 'articleBody', 'datePublished', 'dateModified', 'image', 'author', 'url', 'name']);

function element(tagName, attrs = [], childNodes = []) {
  const node = { nodeName: tagName, tagName, namespaceURI, attrs, childNodes, parentNode: null };
  for (const child of childNodes) child.parentNode = node;
  return node;
}

/** A separate, script-free view of the already-rendered article, not another copy of its source. */
export function createMediumImportHtml(source) {
  const document = parse(source), nodes = all(document);
  const articles = nodes.filter((node) => node.tagName === 'article');
  if (articles.length !== 1) throw new Error('Medium import view requires exactly one article.');
  const article = articles[0];
  const canonical = nodes.find((node) => node.tagName === 'link' && attr(node, 'rel') === 'canonical');
  if (!canonical || !attr(canonical, 'href')) throw new Error('Medium import view requires a canonical URL.');
  const canonicalUrl = new URL(attr(canonical, 'href'));
  if (canonicalUrl.protocol !== 'https:') throw new Error('Medium import view requires an absolute HTTPS canonical URL.');
  if (all(article).filter((node) => hasClass(node, 'e-content')).length !== 1) {
    throw new Error('Medium import view requires one complete e-content body.');
  }

  function clean(node) {
    if (node.nodeName === '#text') return [{ nodeName: '#text', value: node.value, parentNode: null }];
    if (!node.tagName || omitTags.has(node.tagName)) return [];
    if (node.tagName === 'figure') {
      return node.childNodes.flatMap((child) => {
        if (child.tagName === 'figcaption') {
          return [element('p', [], [element('em', [], child.childNodes.flatMap(clean))])];
        }
        return clean(child).map((cleaned) => cleaned.tagName === 'img' ? element('p', [], [cleaned]) : cleaned);
      });
    }
    const children = (node.childNodes ?? []).flatMap(clean);
    const tagName = node === article ? 'div' : node.tagName;
    if (!safeTags.has(tagName)) return children;
    const attrs = [];
    const add = (name, value) => { if (value !== undefined) attrs.push({ name, value }); };
    const classes = node === article ? ['h-entry', 'hentry']
      : (attr(node, 'class') ?? '').split(/\s+/).filter((name) => semanticClasses.has(name));
    if (classes.length) add('class', classes.join(' '));
    for (const name of ['id', 'aria-labelledby']) add(name, attr(node, name));
    if (attr(node, 'itemscope') !== undefined) add('itemscope', '');
    const itemtype = attr(node, 'itemtype');
    if (itemtype && /^https:\/\/schema\.org\/[A-Za-z]+$/.test(itemtype)) add('itemtype', itemtype);
    const properties = (attr(node, 'itemprop') ?? '').split(/\s+/).filter((name) => semanticProperties.has(name));
    if (properties.length) add('itemprop', properties.join(' '));
    if (tagName === 'time') add('datetime', attr(node, 'datetime'));
    if (tagName === 'ol' && /^-?\d+$/.test(attr(node, 'start') ?? '')) add('start', attr(node, 'start'));
    if (tagName === 'li' && /^-?\d+$/.test(attr(node, 'value') ?? '')) add('value', attr(node, 'value'));
    if (tagName === 'a' && attr(node, 'href') !== undefined) {
      const url = new URL(attr(node, 'href'), canonicalUrl);
      if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) return children;
      add('href', url.href);
      add('title', attr(node, 'title'));
    }
    if (tagName === 'img') {
      const source = attr(node, 'src');
      if (!source?.trim()) throw new Error('Medium import images need a real src.');
      const url = new URL(source, canonicalUrl);
      if (url.protocol !== 'https:' || !/\.(png|jpe?g|gif)$/i.test(url.pathname)) {
        throw new Error(`Medium import images need HTTPS raster URLs: ${url.href}`);
      }
      add('src', url.href);
      add('alt', attr(node, 'alt') ?? '');
      for (const name of ['width', 'height']) {
        if (/^[1-9]\d*$/.test(attr(node, name) ?? '')) add(name, attr(node, name));
      }
    }
    return [element(tagName, attrs, children)];
  }

  const root = clean(article)[0];
  const title = nodes.find((node) => node.tagName === 'title');
  const language = attr(nodes.find((node) => node.tagName === 'html'), 'lang') ?? 'en';
  const metadata = nodes.filter((node) => node.tagName === 'meta' && (
    ['description', 'author'].includes(attr(node, 'name')) ||
    ['og:type', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt', 'og:image:width', 'og:image:height', 'og:image:type', 'article:published_time', 'article:modified_time', 'article:author'].includes(attr(node, 'property'))
  )).map((node) => serializeOuter(element('meta', node.attrs.filter((a) => ['name', 'property', 'content'].includes(a.name)))));
  return `<!doctype html>
<html lang="${escape(language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,follow">
<title>${escape(title ? text(title) : text(all(article).find((node) => node.tagName === 'h1')))}</title>
<link rel="canonical" href="${escape(canonicalUrl.href)}">
${metadata.join('\n')}
<style>body{max-width:790px;margin:3rem auto;padding:0 1rem;font:18px/1.8 system-ui,sans-serif;color:#202124;background:#fff}h1,h2,h3{line-height:1.3}img{display:block;max-width:100%;height:auto}pre{overflow:auto;white-space:pre;padding:1rem;background:#f5f5f5}a{color:#1659a5}blockquote{margin-left:0;padding-left:1rem;border-left:3px solid #aaa}</style>
</head>
<body>
${serializeOuter(root)}
</body>
</html>
`;
}

async function markdownFiles(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? markdownFiles(resolve(folder, entry.name))
    : entry.name.endsWith('.md') ? [resolve(folder, entry.name)] : []));
  return files.flat();
}

export async function buildMediumImportPages({ sourceRoot = resolve('src/pages/blog'), outputRoot = resolve('dist') } = {}) {
  let count = 0;
  for (const filename of await markdownFiles(sourceRoot)) {
    if (!(await readFile(filename, 'utf8')).includes('BlogLayout.astro')) continue;
    const slug = relative(sourceRoot, filename).replaceAll('\\', '/').replace(/\.md$/, '').replace(/\/index$/, '');
    const source = await readFile(resolve(outputRoot, 'blog', slug, 'index.html'), 'utf8');
    const destination = resolve(outputRoot, 'blog', slug, 'medium', 'index.html');
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, createMediumImportHtml(source));
    count += 1;
    console.log(`Generated plain import view: /blog/${slug}/medium/`);
  }
  if (!count) throw new Error('No blog articles found for Medium import views.');
  return count;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildMediumImportPages();
}
