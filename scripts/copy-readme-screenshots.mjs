import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = '/Users/xiger78/.cursor/projects/Users-xiger78-work-reactNative/assets';

const mapping = {
  ko: {
    'ko-dashboard.png': 'dashboard.png',
    'ko-transactions.png': 'transactions.png',
    'ko-calendar.png': 'calendar.png',
    'ko-add-transaction.png': 'add-transaction.png',
    'ko-receipt-scan.png': 'receipt-scan.png',
    'ko-settings.png': 'settings.png',
  },
  ja: {
    'ja-dashboard.png': 'dashboard.png',
    'ja-transactions.png': 'transactions.png',
    'ja-calendar.png': 'calendar.png',
    'ja-add-transaction.png': 'add-transaction.png',
    'ja-receipt-scan.png': 'receipt-scan.png',
    'ja-settings.png': 'settings.png',
  },
};

for (const [lang, files] of Object.entries(mapping)) {
  const outDir = path.join(root, 'docs', 'screenshots', lang);
  fs.mkdirSync(outDir, { recursive: true });
  for (const [srcName, dstName] of Object.entries(files)) {
    const src = path.join(srcDir, srcName);
    const dst = path.join(outDir, dstName);
    if (!fs.existsSync(src)) {
      console.error(`Missing source: ${src}`);
      process.exit(1);
    }
    fs.copyFileSync(src, dst);
    console.log(`Copied ${dst}`);
  }
}

const manifest = {
  source: 'ui_mockup_images',
  generatedAt: new Date().toISOString(),
  languages: ['ko', 'ja'],
  screens: ['dashboard', 'transactions', 'calendar', 'add-transaction', 'receipt-scan', 'settings'],
};
fs.writeFileSync(
  path.join(root, 'docs', 'screenshots', 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);
console.log('Done.');
