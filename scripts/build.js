// Build orchestrator (spec 6.1): capture -> upload -> hugo --minify -> public/.
import 'dotenv/config';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { captureAll } from './capture.js';
import { uploadAll } from './upload.js';

const results = await captureAll(); // { updated, skipped, failed }
const { uploaded, failed: uploadFailed } = await uploadAll(results.updated);

for (const f of results.failed) {
  console.warn(`⚠️ WARNING: could not capture screenshot for ${f.slug}${f.page}: ${f.reason}`);
}
console.log(`Captured: ${results.updated.length}, uploaded: ${uploaded.length}, ` +
  `upload failures: ${uploadFailed.length}, capture errors: ${results.failed.length}`);

// Expose sites.yaml to Hugo templates via the data directory.
fs.mkdirSync('data', { recursive: true });
fs.copyFileSync('config/sites.yaml', 'data/sites.yaml');

// Hugo is expected on PATH; missing hugo aborts the build (spec 5.2).
execSync('hugo --minify', { stdio: 'inherit' });
console.log('Build complete: public/');
