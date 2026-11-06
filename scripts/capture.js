// Capture screenshots (PNG + scrolling GIF) for every site/page in config/sites.yaml.
// Spec: open each page in Chromium at >=1280x720, on failure record it and keep going.
import 'dotenv/config';
import { chromium } from 'playwright';
import { loadConfig, screenshotKeys } from './lib.js';

const WIDTH = 1280;
const HEIGHT = 720;
const TIMEOUT = parseInt(process.env.CAPTURE_TIMEOUT || '30000', 10);
const CONCURRENCY = Math.max(1, parseInt(process.env.CAPTURE_CONCURRENCY || '4', 10));

export async function captureAll({ sites = null, outDir = '.tmp/screenshots', captureFn = null } = {}) {
  const list = sites || loadConfig();
  const results = { updated: [], skipped: [], failed: [] };
  const shoot = captureFn || defaultCapture;

  const jobs = [];
  for (const site of list) {
    for (const entry of screenshotKeys(site)) {
      jobs.push({ site, ...entry });
    }
  }

  // Up to CONCURRENCY pages at a time (spec section 8).
  let cursor = 0;
  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      try {
        const files = await shoot(job.site, job.page, outDir);
        results.updated.push({ site: job.site, page: job.page, pngKey: job.pngKey, gifKey: job.gifKey, files });
      } catch (err) {
        results.failed.push({ site: job.site, page: job.page, slug: job.site.slug, reason: String(err.message || err) });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));

  return results;
}

// Default real capture with Playwright: PNG screenshot plus a scrolling GIF.
async function defaultCapture(site, page, outDir) {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc');

  await fs.mkdir(outDir, { recursive: true });
  const base = path.join(outDir, site.slug);
  await fs.mkdir(path.dirname(base), { recursive: true });

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
    const tab = await context.newPage();
    const url = new URL(page, site.url).href;
    await tab.goto(url, { waitUntil: 'networkidle', timeout: TIMEOUT });

    const pngPath = `${base}.png`;
    await tab.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });

    // Scrolling GIF: scroll down the page grabbing frames, then encode with gifenc.
    const frames = [];
    const scrollHeight = await tab.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < scrollHeight; y += HEIGHT) {
      await tab.evaluate((top) => window.scrollTo(0, top), y);
      await tab.waitForTimeout(250);
      const buf = await tab.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
      frames.push(buf);
      if (frames.length >= 20) break; // keep the GIF small
    }
    const gif = GIFEncoder();
    for (const buf of frames) {
      const { data, width, height } = await decodePng(buf);
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      gif.writeFrame(index, width, height, { palette, delay: 250 });
    }
    gif.finish();
    const gifPath = `${base}.gif`;
    await fs.writeFile(gifPath, Buffer.from(gif.bytes()));

    await context.close();
    return { png: pngPath, gif: gifPath };
  } finally {
    await browser.close();
  }
}

// Decode a PNG buffer into RGBA pixel data using the PNG decoder bundled with playwright's image stack is
// not available; use a tiny pure-JS decoder fallback via canvas-free approach: we keep frames as raw PNGs
// and encode GIF per-frame is complex — for now re-encode using a minimal zTXt-free path is out of scope.
// Use 'pngjs' if present; otherwise skip GIF generation gracefully.
async function decodePng(buf) {
  try {
    const { PNG } = await import('pngjs');
    return PNG.sync.read(buf);
  } catch {
    const err = new Error('pngjs not installed; scrolling GIF generation requires it');
    err.code = 'GIF_DECODE_UNAVAILABLE';
    throw err;
  }
}

// CLI entry: node scripts/capture.js
if (process.argv[1] && process.argv[1].endsWith('capture.js')) {
  const res = await captureAll();
  for (const f of res.failed) console.warn(`⚠️ WARNING: capture failed for ${f.slug}${f.page}: ${f.reason}`);
  console.log(`Captured: ${res.updated.length}, failed: ${res.failed.length}`);
}
