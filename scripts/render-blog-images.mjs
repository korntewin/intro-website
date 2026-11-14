import { readdir, readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, basename, resolve } from 'node:path';
import sharp from 'sharp';
import { zipSync, strToU8 } from 'fflate';

const folder = fileURLToPath(new URL('../public/blog/figures/', import.meta.url));
const source = fileURLToPath(new URL('../src/pages/blog/', import.meta.url));
const baseUrl = 'https://korntewin.github.io/intro-website/blog/figures/';
export async function packageArticleImages({ sourceRoot = source, figureDir = folder, outputRoot = resolve('public/blog') } = {}) {
  const entries = await readdir(sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const slug = entry.name.slice(0, -3);
    const thai = await readFile(join(sourceRoot, entry.name), 'utf8');
    if (!thai.includes('BlogLayout.astro')) continue;
    const english = await readFile(join(sourceRoot, slug, 'en.md'), 'utf8');
    const images = (article) => [...article.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)].map((m) => m[1]).filter((url) => url.includes('/blog/figures/'));
    const urls = images(thai);
    if (!urls.length || JSON.stringify(urls) !== JSON.stringify(images(english))) throw new Error(`${slug}: TH and EN must reference the same figures in the same order.`);
    const zipEntries = { 'README.txt': strToU8(`Images for ${slug}, numbered in article order. Upload each PNG individually to your Medium draft.\n`) };
    for (const [index, url] of urls.entries()) {
      if (!url.startsWith(baseUrl) || !url.endsWith('.png')) throw new Error(`Invalid Medium image URL: ${url}`);
      const name = basename(new URL(url).pathname);
      const path = join(figureDir, name);
      await stat(path);
      const bytes = await readFile(path);
      if (!bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error(`Invalid PNG: ${name}`);
      zipEntries[String(index + 1).padStart(2, '0') + '-' + name] = bytes;
    }
    const zip = zipSync(zipEntries, { level: 0 });
    await mkdir(join(outputRoot, slug), { recursive: true });
    await writeFile(join(outputRoot, slug, 'medium-images.zip'), zip);
    if (slug === 'riir-rust-prediction-service') await writeFile(join(outputRoot, 'medium-images.zip'), zip);
    console.log(`Packaged ${urls.length} images for ${slug}`);
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = (await readdir(folder)).filter((f) => f.endsWith('.svg')).sort();
  if (!files.length) throw new Error('No SVG blog figures found');
  for (const file of files) {
    await sharp(await readFile(join(folder, file)), { density: 144 }).resize({ width: 1800 }).png({ compressionLevel: 9 }).toFile(join(folder, file.replace(/\.svg$/, '.png')));
  }
  await packageArticleImages();
}
