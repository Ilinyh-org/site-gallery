// Tests for non-capture helpers (lib.js). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageSlug, screenshotKeys, publicUrl, loadConfig } from '../scripts/lib.js';
import path from 'node:path';

test('pageSlug maps paths per spec', () => {
  assert.equal(pageSlug('/'), 'index');
  assert.equal(pageSlug('/pricing'), 'pricing');
  assert.equal(pageSlug('/about/team'), 'about-team');
  assert.equal(pageSlug('trailing/'), 'trailing');
});

test('screenshotKeys build spec S3 keys', () => {
  const site = { slug: 'example', pages: ['/', '/pricing'] };
  const keys = screenshotKeys(site);
  assert.deepEqual(keys, [
    { page: '/', pngKey: 'screenshots/example/index.png', gifKey: 'screenshots/example/index.gif' },
    { page: '/pricing', pngKey: 'screenshots/example/pricing.png', gifKey: 'screenshots/example/pricing.gif' },
  ]);
});

test('publicUrl joins base without double slashes', () => {
  process.env.S3_PUBLIC_URL = 'https://cdn.example.com/';
  assert.equal(publicUrl({ slug: 'example' }, '/about'), 'https://cdn.example.com/screenshots/example/about.png');
  delete process.env.S3_PUBLIC_URL;
});

test('loadConfig loads the real config/sites.yaml', () => {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const sites = loadConfig(root);
  assert.ok(Array.isArray(sites) && sites.length >= 1);
  for (const s of sites) {
    assert.ok(s.name && s.url && s.slug);
    assert.ok(Array.isArray(s.pages) && s.pages.length > 0);
    assert.ok(Array.isArray(s.tags));
    assert.ok(Array.isArray(s.categories));
  }
});

test('loadConfig rejects malformed config', () => {
  assert.throws(() => loadConfig('/nonexistent-root'), Error);
});
