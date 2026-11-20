// Build (sub-issue #16, replaces the Hugo-era orchestrator):
// capture screenshots -> generate static site -> public/.
// Capture/upload remain wired for the CI build (sub-issue #18); locally they
// degrade gracefully when Playwright/Chromium cannot run (spec 9 warn-and-continue).
import 'dotenv/config';
import fs from 'node:fs';
import { captureAll } from './capture.js';
import { uploadAll } from './upload.js';
import { generate } from './generate.js';

let captureNote = 'skipped';
let results = null;
if (process.env.SKIP_CAPTURE === '1') {
  captureNote = 'SKIP_CAPTURE=1';
} else {
  try {
    results = await captureAll(); // { updated, skipped, failed }
    await uploadAll(results.updated, { dryRun: true }); // S3 upload deferred; count-only dry run
    for (const f of results.failed) {
      console.warn(`⚠️ WARNING: could not capture screenshot for ${f.slug}${f.page}: ${f.reason}`);
    }
    captureNote = `${results.updated.length} captured, ${results.failed.length} failed`;
  } catch (err) {
    console.warn(`⚠️ WARNING: capture unavailable in this environment: ${err.message}`);
  }
}

// Static site generation from config/sites.yaml (source of truth).
const gen = await generate();
console.log(`Captured: ${captureNote}`);
console.log(`Generated ${gen.page} (${gen.tiles} tiles)`);
console.log('Build complete: public/');
