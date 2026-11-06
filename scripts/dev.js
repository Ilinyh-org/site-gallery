// Local dev server (spec 5.1): hugo server with live-reload on port 1313.
// Uses existing screenshots in S3 — no re-capture.
import 'dotenv/config';
import { spawnSync } from 'node:child_process';

const port = process.env.DEV_PORT || '1313';
const result = spawnSync('hugo', ['server', '--port', port, '--bind', '127.0.0.1'], { stdio: 'inherit' });
if (result.error && result.error.code === 'ENOENT') {
  console.error('hugo binary not found on PATH. Install Hugo (extended) to run the dev server.');
  process.exit(1);
}
process.exit(result.status ?? 1);
