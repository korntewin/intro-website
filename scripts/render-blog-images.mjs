import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, basename } from 'node:path';
import sharp from 'sharp';

const folder = fileURLToPath(new URL('../public/blog/figures/', import.meta.url));
const articleFile = fileURLToPath(new URL('../src/pages/blog/riir-rust-prediction-service.md', import.meta.url));
const baseUrl = 'https://korntewin.github.io/intro-website/blog/figures/';
const files = (await readdir(folder)).filter((f) => f.endsWith('.svg')).sort();
if (!files.length) throw new Error('No SVG blog figures found');

for (const file of files) {
  const svg = await readFile(join(folder, file));
  const png = join(folder, file.replace(/\.svg$/, '.png'));
  await sharp(svg, { density: 144 })
    .resize({ width: 1800, withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toFile(png);
  console.log('PNG generated:', basename(png));
}

const article = await readFile(articleFile, 'utf8');
const allImages = [...article.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)].map((m) => m[1]);
const blogImages = allImages.filter((url) => url.includes('/blog/figures/'));
for (const url of blogImages) {
  if (!url.startsWith(baseUrl) || !url.endsWith('.png')) {
    throw new Error('For Medium import, blog images must use absolute HTTPS PNG URLs: ' + url);
  }
  await stat(join(folder, basename(new URL(url).pathname)));
}
console.log('Verified', blogImages.length, 'Medium-ready blog image references.');
