import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { createMediumImportHtml } from '../scripts/build-medium-import.mjs';

const canonical = 'https://korntewin.github.io/intro-website/blog/riir-rust-prediction-service/';
const attr = (node, name) => node.attrs?.find((entry) => entry.name === name)?.value;
const all = (node) => [node, ...(node.childNodes ?? []).flatMap(all)];
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
const fixture = (content) => `<!doctype html><html lang="th"><head><title>Go &amp; Rust</title><link rel="canonical" href="${canonical}"><meta name="description" content="Thai engineering"><meta property="og:image" content="https://korntewin.github.io/intro-website/blog/figures/cover.png"><link rel="stylesheet" href="/site.css"><script>bad()</script></head><body><nav>Navigation</nav><article class="reading h-entry hentry" aria-labelledby="title" itemscope itemtype="https://schema.org/BlogPosting"><h1 id="title" class="p-name entry-title">ภาษาไทย 🦀 Go &amp; Rust</h1><p><time class="dt-published" datetime="2026-10-23">2026-10-23</time></p><p class="intro p-summary">บทนำ</p><div class="e-content entry-content" itemprop="articleBody">${content}</div></article><footer>Site footer</footer></body></html>`;

test('plain view preserves all 14 images, captions and article text in order', () => {
  const figures = Array.from({ length: 14 }, (_, index) => `<p>Before ${index}</p><figure class="article-figure"><img src="../figures/chart-${index}.png" alt="Chart ${index}" width="1800" height="900" loading="lazy" data-src="wrong.svg"><figcaption>Caption <strong>${index}</strong></figcaption></figure><p>After ${index}</p>`).join('');
  const source = fixture(figures);
  const result = parse(createMediumImportHtml(source)), nodes = all(result);
  const images = nodes.filter((node) => node.tagName === 'img');
  assert.equal(images.length, 14);
  images.forEach((image, index) => {
    assert.equal(attr(image, 'src'), `https://korntewin.github.io/intro-website/blog/figures/chart-${index}.png`);
    assert.equal(attr(image, 'alt'), `Chart ${index}`);
    assert.equal(attr(image, 'width'), '1800');
    assert.equal(attr(image, 'height'), '900');
    assert.equal(image.parentNode.tagName, 'p');
    assert.equal(image.attrs.some((a) => ['loading', 'data-src', 'srcset'].includes(a.name)), false);
    const paragraph = image.parentNode, siblings = paragraph.parentNode.childNodes;
    const position = siblings.indexOf(paragraph);
    assert.equal(text(siblings[position - 1]), `Before ${index}`);
    assert.equal(text(siblings[position + 1]), `Caption ${index}`);
    assert.equal(siblings[position + 1].childNodes[0].tagName, 'em');
    assert.equal(text(siblings[position + 2]), `After ${index}`);
  });
  const originalArticle = all(parse(source)).find((node) => node.tagName === 'article');
  const exportedArticle = nodes.find((node) => (attr(node, 'class') ?? '').split(/\s+/).includes('h-entry'));
  assert.equal(text(exportedArticle), text(originalArticle));
  assert.equal(attr(nodes.find((node) => node.tagName === 'link'), 'href'), canonical);
  assert.equal(attr(nodes.find((node) => attr(node, 'name') === 'robots'), 'content'), 'noindex,follow');
  assert.equal(attr(nodes.find((node) => attr(node, 'property') === 'og:image'), 'content'), 'https://korntewin.github.io/intro-website/blog/figures/cover.png');
  assert(!nodes.some((node) => ['figure', 'figcaption', 'script', 'nav', 'footer', 'astro-island'].includes(node.tagName)));
});

test('code whitespace, formatted text, lists and canonical-relative links survive sanitization', () => {
  const html = createMediumImportHtml(fixture('<p>ไทย <em>text</em> &amp; <strong>values</strong> <a href="#rust">section</a></p><pre class="astro-code" style="color:red" data-astro-cid-a=""><code><span>fn main() {</span>\n  <span>let a = &lt;img&gt;;</span>\n}\n</code></pre><ol start="3"><li value="7">Seven</li></ol><a href="../other/">Other post</a><a href="javascript:bad()">Keep label</a><script>bad()</script><astro-island>Client content</astro-island>'));
  const nodes = all(parse(html));
  assert.equal(text(nodes.find((node) => node.tagName === 'pre')), 'fn main() {\n  let a = <img>;\n}\n');
  assert.equal(attr(nodes.find((node) => node.tagName === 'ol'), 'start'), '3');
  assert.equal(attr(nodes.find((node) => node.tagName === 'li'), 'value'), '7');
  assert.deepEqual(nodes.filter((node) => node.tagName === 'a').map((node) => attr(node, 'href')), [canonical + '#rust', 'https://korntewin.github.io/intro-website/blog/other/']);
  assert(!nodes.some((node) => node.tagName === 'span' || node.tagName === 'astro-island'));
  const body = nodes.find((node) => node.tagName === 'body');
  assert(all(body).every((node) => !(node.attrs ?? []).some((a) => a.name === 'style' || a.name.startsWith('data-astro'))));
  assert(text(body).includes('Keep label'));
  assert(!text(body).includes('Client content'));
});

test('rejects missing article bodies and unsafe or unsupported image sources', () => {
  assert.throws(() => createMediumImportHtml('<html><body>No article</body></html>'), /exactly one article/);
  assert.throws(() => createMediumImportHtml(fixture('<p>Text</p>').replace('class="e-content entry-content"', 'class="body"')), /e-content/);
  for (const src of ['', 'data:image/png;base64,AAA', 'http://example.com/a.png', 'https://example.com/a.svg', 'javascript:bad()']) {
    assert.throws(() => createMediumImportHtml(fixture(`<figure><img src="${src}"></figure>`)), /real src|HTTPS raster/);
  }
});
