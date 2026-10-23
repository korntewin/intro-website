import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import rehypeBlogHtml, { imageUrl } from '../scripts/rehype-blog-html.mjs';

const site = 'https://korntewin.github.io';
const base = '/intro-website';
const slug = 'riir-rust-prediction-service';
const expected = site + base + '/blog/figures/chart.png';
const text = (value) => ({ type: 'text', value });
const el = (tagName, children = [], properties = {}) => ({ type: 'element', tagName, properties, children });
const root = (...children) => ({ type: 'root', children });
const plain = (n) => n.type === 'text' ? n.value : (n.children ?? []).map(plain).join('');
const file = { path: '/repo/src/pages/blog/' + slug + '.md' };

for (const src of [expected, '/intro-website/blog/figures/chart.png', '/blog/figures/chart.png', '../figures/chart.png', '../figures/chart.svg']) {
  test('normalizes ' + src, () => assert.equal(imageUrl(src, { site, base, slug }).href, expected));
}
test('rejects data URLs, remote SVGs, HTTP and missing sources', () => {
  for (const src of ['', 'data:image/png;base64,AAAA', 'https://example.com/a.svg', 'http://example.com/a.png']) {
    assert.throws(() => imageUrl(src, { site, base, slug }));
  }
});
test('figures are static, captioned, eager and dimensioned; transformation is idempotent', (t) => {
  const publicDir = mkdtempSync(join(tmpdir(), 'blog-figures-'));
  t.after(() => rmSync(publicDir, { recursive: true, force: true }));
  mkdirSync(join(publicDir, 'blog/figures'), { recursive: true });
  const header = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(header);
  header.writeUInt32BE(1800, 16); header.writeUInt32BE(900, 20);
  writeFileSync(join(publicDir, 'blog/figures/chart.png'), header);
  const image = el('img', [], { src: '../figures/chart.svg', alt: 'Go vs Rust', loading: 'lazy', srcSet: '/wrong.png 2x', 'data-src': '/wrong.png' });
  const ast = root(el('p', [text('\n'), image, text('\n')]));
  const transform = rehypeBlogHtml({ site, base, publicDir });
  transform(ast, file);
  const figure = ast.children[0];
  assert.equal(figure.tagName, 'figure');
  assert.equal(figure.children[0], image);
  assert.equal(figure.children[1].tagName, 'figcaption');
  assert.equal(plain(figure.children[1]), 'Go vs Rust');
  assert.equal(image.properties.src, expected);
  assert.equal(image.properties.loading, 'eager');
  assert.equal(image.properties.width, 1800);
  assert.equal(image.properties.height, 900);
  assert.equal(image.properties.srcSet, undefined);
  assert.equal(image.properties['data-src'], undefined);
  const snapshot = structuredClone(ast);
  transform(ast, file);
  assert.deepEqual(ast, snapshot);
});
test('turns table rows into labeled paragraphs without losing markup or values', () => {
  const headers = ['Metric', 'Go (median / peak)', 'Rust (median / peak)', 'Improvement'];
  const cells = [el('strong', [text('P99 server latency')]), text('416 / 829 ms'), text('146 / 419 ms'), el('strong', [text('2.4x')])];
  const ast = root(el('table', [el('thead', [el('tr', headers.map((h) => el('th', [text(h)])))]), el('tbody', [el('tr', cells.map((c) => el('td', [c])))]) ]));
  rehypeBlogHtml({ site, base })(ast, file);
  assert.equal(ast.children.length, 1);
  assert.equal(ast.children[0].tagName, 'p');
  assert.deepEqual(ast.children[0].properties.className, ['comparison-record']);
  assert.match(plain(ast), /Go \(median \/ peak\): 416 \/ 829 ms/);
  assert.match(plain(ast), /Rust \(median \/ peak\): 146 \/ 419 ms/);
  assert.match(plain(ast), /Improvement: 2.4x/);
});
test('does not modify other site pages, code examples or prose text', () => {
  const ast = root(el('p', [text('ordinary prose')]), el('pre', [text('<img src="relative.png">')]));
  const snapshot = structuredClone(ast);
  rehypeBlogHtml({ site, base })(ast, file);
  assert.deepEqual(ast, snapshot);
  const unrelated = root(el('p', [el('img', [], { src: 'relative.svg' })]));
  const original = structuredClone(unrelated);
  rehypeBlogHtml({ site, base })(unrelated, { path: '/repo/src/pages/about.md' });
  assert.deepEqual(unrelated, original);
});
test('rejects tables without headers rather than silently losing data', () => {
  const ast = root(el('table', [el('tbody', [el('tr', [el('td', [text('important')])])])]));
  assert.throws(() => rehypeBlogHtml({ site, base })(ast, file), /need a header/);
});
