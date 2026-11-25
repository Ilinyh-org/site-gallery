// Tests for the S3 upload client setup (issue #36: S3_REGION is optional).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeClient } from '../scripts/upload.js';

test('makeClient works without S3_REGION (optional, defaults to us-east-1)', () => {
  const client = makeClient({
    S3_BUCKET: 'my-screenshots',
    S3_ACCESS_KEY: 'key',
    S3_SECRET_KEY: 'secret',
  });
  assert.ok(client, 'client constructed without S3_REGION');
});

test('makeClient still requires the core credentials', () => {
  assert.throws(() => makeClient({ S3_ACCESS_KEY: 'k', S3_SECRET_KEY: 's' }), /S3_BUCKET/);
  assert.throws(() => makeClient({ S3_BUCKET: 'b', S3_SECRET_KEY: 's' }), /S3_ACCESS_KEY/);
  assert.throws(() => makeClient({ S3_BUCKET: 'b', S3_ACCESS_KEY: 'k' }), /S3_SECRET_KEY/);
});
