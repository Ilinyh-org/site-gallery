// Sub-issue #18: screenshots are part of the build. After generation, copy the
// captured screenshots (.tmp/screenshots) into public/screenshots so the same-origin
// tiles (/screenshots/<slug>/<page>.png) resolve in the published site (Pages, #17).
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, '.tmp', 'screenshots');
const DEST = path.join(ROOT, 'public', 'screenshots');

export async function copyScreenshots({ src = SRC, dest = DEST } = {}) {
  let count = 0;
  async function walk(dir, rel = '') {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return; // no screenshots captured; tiles hide themselves via onerror
    }
    await fs.mkdir(dest, { recursive: true });
    for (const e of entries) {
      const r = path.join(rel, e.name);
      if (e.isDirectory()) await walk(path.join(dir, e.name), r);
      else {
        await fs.mkdir(path.dirname(path.join(dest, r)), { recursive: true });
        await fs.copyFile(path.join(dir, e.name), path.join(dest, r));
        count++;
      }
    }
  }
  await walk(src);
  return count;
}

if (process.argv[1] && process.argv[1].endsWith('copy-screenshots.js')) {
  console.log(`Copied ${await copyScreenshots()} screenshot file(s) to public/screenshots`);
}
