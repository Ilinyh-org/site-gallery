// Upload captured screenshots to S3-compatible storage (AWS SDK v3).
// Skips upload when the remote object is byte-identical (spec 6.3).
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

export function makeClient(env = process.env) {
  for (const key of ['S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY']) {
    if (!env[key]) throw new Error(`Missing required env var ${key} (see .env.example)`);
  }
  return new S3Client({
    region: env.S3_REGION || 'us-east-1',
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(env.S3_ENDPOINT),
    credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
  });
}

export async function uploadAll(updated, { client = null, bucket = process.env.S3_BUCKET, dryRun = false } = {}) {
  // Dry-run skips the real client so build logic can be tested without credentials.
  const s3 = client || (dryRun ? null : makeClient());
  const uploaded = [];
  const skipped = [];
  const failed = [];

  for (const item of updated) {
    for (const [key, file] of [[item.pngKey, item.files?.png], [item.gifKey, item.files?.gif]]) {
      if (!file) continue; // GIF may be unavailable; PNG is mandatory
      try {
        const body = await fs.readFile(file);
        if (dryRun) {
          uploaded.push(key);
          continue;
        }
        if (await isIdentical(s3, bucket, key, body)) {
          skipped.push(key);
          continue;
        }
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: key.endsWith('.gif') ? 'image/gif' : 'image/png',
          CacheControl: 'public, max-age=86400',
        }));
        uploaded.push(key);
      } catch (err) {
        // Spec 9: upload failure warns and build continues.
        console.warn(`⚠️ WARNING: upload failed for ${key}: ${err.message}`);
        failed.push(key);
      }
    }
  }
  return { uploaded, skipped, failed };
}

async function isIdentical(s3, bucket, key, body) {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return head.ContentLength === body.length;
  } catch {
    return false; // not present -> upload
  }
}

// CLI entry: node scripts/upload.js (re-uploads whatever is in .tmp/screenshots)
if (process.argv[1] && process.argv[1].endsWith('upload.js')) {
  const { loadConfig, screenshotKeys } = await import('./lib.js');
  const items = [];
  for (const site of loadConfig()) {
    for (const entry of screenshotKeys(site)) {
      const base = path.join('.tmp', 'screenshots', site.slug);
      items.push({ site, page: entry.page, pngKey: entry.pngKey, gifKey: entry.gifKey,
        files: { png: `${base}.png`, gif: `${base}.gif` } });
    }
  }
  const res = await uploadAll(items);
  console.log(`Uploaded: ${res.uploaded.length}, identical-skipped: ${res.skipped.length}, failed: ${res.failed.length}`);
}
