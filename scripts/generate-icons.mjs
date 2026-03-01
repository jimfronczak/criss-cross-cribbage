/**
 * Generates PNG icons from public/icon.svg for PWA manifest.
 * Run: node scripts/generate-icons.mjs
 *
 * Uses sharp (install once: npm install -D sharp).
 * Outputs: public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png
 */
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error(
      'sharp is not installed. Run:  npm install -D sharp\n' +
      'Then re-run this script.'
    );
    process.exit(1);
  }

  const svg = await readFile(resolve(root, 'public/icon.svg'));

  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const { name, size } of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(resolve(root, 'public', name));
    console.log(`  ✓ public/${name}  (${size}×${size})`);
  }

  console.log('\nDone. Icons are ready for the PWA manifest.');
}

main();
