// Visual regression checks (issue #43 §12): serve public/, screenshot the
// homepage at 1440/1024/390 px in light and dark themes -> docs/visual/.
// Requires Playwright chromium (CI installs it; locally it may be unavailable —
// this script then fails loudly rather than reporting false success).
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'docs', 'visual');
const PORT = 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
};

function serve() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = path.join(PUBLIC, rel === '/' ? 'index.html' : rel);
      if (!file.startsWith(PUBLIC)) {
        res.writeHead(403).end();
        return;
      }
      fs.readFile(file)
        .then((buf) => res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' }).end(buf))
        .catch(() => res.writeHead(404).end('not found'));
    });
    server.on('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

const SHOTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-1024', width: 1024, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
];
const THEMES = ['light', 'dark'];

const server = await serve();
try {
  const browser = await chromium.launch();
  await fs.mkdir(OUT, { recursive: true });
  for (const theme of THEMES) {
    for (const shot of SHOTS) {
      const ctx = await browser.newPage({
        viewport: { width: shot.width, height: shot.height },
        colorScheme: theme,
      });
      // Pin the theme before any page script runs (no-FOUC path uses localStorage).
      await ctx.addInitScript((t) => {
        try { localStorage.setItem('theme', t); } catch {}
      }, theme);
      const page = await ctx.newPage();
      await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300); // settle lazy images/transitions
      const file = path.join(OUT, `${shot.name}-${theme}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`visual: ${path.relative(ROOT, file)}`);
      await ctx.close();
    }
  }
  await browser.close();
  console.log('visual-check: OK');
} finally {
  server.close();
}
