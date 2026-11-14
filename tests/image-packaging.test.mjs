import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
import { packageArticleImages } from '../scripts/render-blog-images.mjs';

const prefix = 'https://korntewin.github.io/intro-website/blog/figures/';
const img = (name) => `![caption](${prefix}${name}.png)`;

test('packages each bilingual article separately and preserves the old ZIP', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'article-packs-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceRoot = join(root, 'src'), figureDir = join(root, 'figures'), outputRoot = join(root, 'out');
  await mkdir(sourceRoot); await mkdir(figureDir); await mkdir(outputRoot);
  for (const [slug, names] of [['riir-rust-prediction-service', ['a', 'b']], ['sccache-rust-build-cache', ['c']]]) {
    await mkdir(join(sourceRoot, slug));
    const body = 'BlogLayout.astro\n' + names.map(img).join('\n');
    await writeFile(join(sourceRoot, slug + '.md'), body);
    await writeFile(join(sourceRoot, slug, 'en.md'), body);
    for (const name of names) await writeFile(join(figureDir, name + '.png'), Buffer.from([137,80,78,71,13,10,26,10,0]));
  }
  await packageArticleImages({ sourceRoot, figureDir, outputRoot });
  const oldPack = await readFile(join(outputRoot, 'medium-images.zip'));
  assert.deepEqual(oldPack, await readFile(join(outputRoot, 'riir-rust-prediction-service/medium-images.zip')));
  assert.deepEqual(Object.keys(unzipSync(oldPack)), ['README.txt', '01-a.png', '02-b.png']);
  assert.deepEqual(Object.keys(unzipSync(await readFile(join(outputRoot, 'sccache-rust-build-cache/medium-images.zip')))), ['README.txt', '01-c.png']);
  await writeFile(join(sourceRoot, 'sccache-rust-build-cache/en.md'), 'BlogLayout.astro\n' + img('a'));
  await assert.rejects(packageArticleImages({ sourceRoot, figureDir, outputRoot }), /TH and EN/);
});
