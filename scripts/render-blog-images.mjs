import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, basename } from 'node:path';
import sharp from 'sharp';
import { zipSync, strToU8 } from 'fflate';

const folder = fileURLToPath(new URL('../public/blog/figures/', import.meta.url));
const articleFiles = [
  fileURLToPath(new URL('../src/pages/blog/riir-rust-prediction-service.md', import.meta.url)),
  fileURLToPath(new URL('../src/pages/blog/riir-rust-prediction-service/en.md', import.meta.url)),
];
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

const imageLists = await Promise.all(articleFiles.map(async (file) => {
  const article = await readFile(file, 'utf8');
  return [...article.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)]
    .map((m) => m[1])
    .filter((url) => url.includes('/blog/figures/'));
}));
const [blogImages, englishImages] = imageLists;
if (!blogImages.length || JSON.stringify(blogImages) !== JSON.stringify(englishImages)) {
  throw new Error('TH and EN versions must reference the same figures in the same order.');
}
for (const url of blogImages) {
  if (!url.startsWith(baseUrl) || !url.endsWith('.png')) {
    throw new Error('For Medium import, blog images must use absolute HTTPS PNG URLs: ' + url);
  }
  await stat(join(folder, basename(new URL(url).pathname)));
}
console.log('Verified', blogImages.length, 'Medium-ready figure references in both TH and EN.');

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const zipEntries = {
  'README.txt': strToU8('ML Prediction Service blog images for Medium\n\nThe files are numbered in article reading order. Upload each PNG into the corresponding position in a Medium draft. Upload one at a time if you want to avoid Medium arranging them as a grid.\n\nSource: https://korntewin.github.io/intro-website/blog/riir-rust-prediction-service/\n'),
};
for (const [index, url] of blogImages.entries()) {
  const name = basename(new URL(url).pathname);
  const data = await readFile(join(folder, name));
  if (!data.subarray(0, 8).equals(signature)) {
    throw new Error('Invalid PNG header: ' + name);
  }
  const zipName = String(index + 1).padStart(2, '0') + '-' + name;
  zipEntries[zipName] = data;
}
const bundlePath = join(folder, '..', 'medium-images.zip');
await writeFile(bundlePath, zipSync(zipEntries, { level: 0 }));
console.log('Created Medium image pack with', blogImages.length, 'verified PNGs:', bundlePath);

