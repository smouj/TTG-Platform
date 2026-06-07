#!/usr/bin/env node
// remove-magenta.js — Chroma-key magenta background removal
// Usage: node remove-magenta.js <input.png> <output.png>
const sharp = require('sharp');
const fs = require('fs');

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node remove-magenta.js <input.png> <output.png>');
  process.exit(1);
}

async function removeMagenta(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const newData = Buffer.alloc(data.length);
  let removed = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 160 && b > 160 && g < 130) {
      newData[i] = 0; newData[i + 1] = 0; newData[i + 2] = 0;
      newData[i + 3] = 0;
      removed++;
    } else {
      newData[i] = r; newData[i + 1] = g; newData[i + 2] = b;
      newData[i + 3] = data[i + 3];
    }
  }

  const pct = ((removed / (width * height)) * 100).toFixed(1);
  await sharp(newData, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);

  const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(0);
  console.log(`✅ ${outputPath} (${sizeKB}KB, ${removed} magenta pixels removed = ${pct}%)`);
}

removeMagenta(input, output).catch(e => { console.error(e); process.exit(1); });
