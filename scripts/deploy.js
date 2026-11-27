// Publish public/ to the static hosting target (spec 5.3).
// Target comes from DEPLOY_TARGET env (rsync/ssh, S3 website, netlify CLI, etc.).
// Kept minimal: rsync-over-ssh when DEPLOY_TARGET=user@host:/path, else error.
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const target = process.env.DEPLOY_TARGET;
if (!target) {
  console.error('DEPLOY_TARGET is not set (see .env.example). Nothing deployed.');
  process.exit(1);
}
if (!fs.existsSync('public/index.html')) {
  console.error('public/index.html not found — run the build first.');
  process.exit(1);
}

const m = target.match(/^([^@/]+)@([^:/]+):(.+)$/);
if (!m) {
  console.error(`Unsupported DEPLOY_TARGET format: ${target}. Expected user@host:/path (rsync over ssh).`);
  process.exit(1);
}
const [, user, host, dest] = m;
const res = spawnSync('rsync', ['-avz', '--delete', 'public/', `${user}@${host}:${dest}/`], { stdio: 'inherit' });
process.exit(res.status ?? 1);
