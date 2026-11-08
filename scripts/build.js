// Build orchestrator (spec 6.1): capture -> upload -> hugo --minify -> public/.
// BUILD_DRY_RUN=1 stubs capture and skips real S3 upload (verification without creds).
import 'dotenv/config';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { captureAll } from './capture.js';
import { uploadAll } from './upload.js';

const dryRun = process.env.BUILD_DRY_RUN === '1';

const stubCapture = async (site, page, outDir) => {
  const path = await import('node:path');
  const fs = await import('node:fs/promises');
  const png = path.join(outDir, site.slug, `${page}.png`);
  await fs.mkdir(path.dirname(png), { recursive: true });
  // 1x1 transparent PNG placeholder so dry-run upload has a real file to read.
  await fs.writeFile(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
  return { png, gif: null };
};

const results = await captureAll({ captureFn: dryRun ? stubCapture : null }); // { updated, skipped, failed }
const { uploaded, failed: uploadFailed } = await uploadAll(results.updated, { dryRun });

for (const f of results.failed) {
  console.warn(`⚠️ WARNING: could not capture screenshot for ${f.slug}${f.page}: ${f.reason}`);
}
console.log(`Captured: ${results.updated.length}, uploaded: ${uploaded.length}, ` +
  `upload failures: ${uploadFailed.length}, capture errors: ${results.failed.length}`);

// Expose sites.yaml to Hugo templates via the data directory.
fs.mkdirSync('data', { recursive: true });
fs.copyFileSync('config/sites.yaml', 'data/sites.yaml');

// Hugo is expected on PATH (or tools/hugo); missing hugo aborts the build (spec 5.2).
const hugoBin = fs.existsSync('tools/hugo') ? './tools/hugo' : 'hugo';
if (dryRun) {
  console.log('[dry-run] capture stubbed, S3 upload skipped');
}
execSync(`${hugoBin} --minify`, { stdio: 'inherit' });
console.log('Build complete: public/');
