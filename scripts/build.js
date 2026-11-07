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
  const png = path.join(outDir, site.slug, `${page}.png`);
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

// Hugo is expected on PATH; missing hugo aborts the build (spec 5.2).
if (dryRun) {
  console.log('[dry-run] capture stubbed, S3 upload skipped');
}
execSync('hugo --minify', { stdio: 'inherit' });
console.log('Build complete: public/');
