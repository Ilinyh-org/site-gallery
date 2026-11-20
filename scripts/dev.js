// Local dev server: serves public/ on port 1313 (plain static, no build step).
// Regenerate with `npm run build` (or SKIP_CAPTURE=1 npm run build) after config changes.
import 'dotenv/config';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = parseInt(process.env.DEV_PORT || '1313', 10);
const ROOT = path.join(process.cwd(), 'public');

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error('public/index.html not found — run `SKIP_CAPTURE=1 npm run build` first.');
  process.exit(1);
}

http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
  let file = path.join(ROOT, rel || 'index.html');
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`Dev server: http://127.0.0.1:${PORT}`));
