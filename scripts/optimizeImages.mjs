// One-off photo optimizer for the About page. Converts source photos to
// resized, web-friendly WebP in public/images/.
//
// Usage: node scripts/optimizeImages.mjs "<sourceDir>"

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Usage: node scripts/optimizeImages.mjs "<sourceDir>"');
  process.exit(1);
}

// [source file, output name, max width]
const PHOTOS = [
  ["Maureen.JPG", "maureen-portrait.webp", 800],
  ["Maureen's small group.jpeg", "maureen-small-group.webp", 1000],
  ["Maureen and Jesse.jpeg", "maureen-and-jesse.webp", 900],
  ["Maureen's housemates_Tamara_Milcah_Robin.JPEG", "maureen-housemates.webp", 1200],
];

const outDir = resolve("public", "images");
mkdirSync(outDir, { recursive: true });

for (const [src, out, width] of PHOTOS) {
  const outPath = resolve(outDir, out);
  const info = await sharp(resolve(sourceDir, src))
    .rotate() // honor EXIF orientation
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outPath);
  console.log(`${out}: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(0)} kB`);
}
