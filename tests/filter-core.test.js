// Tests for pure filtering logic (filter-core.js). Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matches, uniqueLabels, applyFilters, toLabels } from '../static/js/filter-core.js';

const tiles = [
  { tags: 'saas landing', categories: 'marketing' },
  { tags: 'blog', categories: 'content' },
  { tags: 'saas docs', categories: 'marketing docs' },
];

test('toLabels splits space-separated attributes', () => {
  assert.deepEqual(toLabels(tiles[0]), { tags: ['saas', 'landing'], categories: ['marketing'] });
  assert.deepEqual(toLabels({ tags: '', categories: undefined }), { tags: [], categories: [] });
});

test('matches with no selection shows everything', () => {
  const none = { tags: new Set(), categories: new Set() };
  for (const t of tiles) assert.ok(matches(t, none));
});

test('matches multi-select tags', () => {
  const sel = { tags: new Set(['saas']), categories: new Set() };
  assert.ok(matches(tiles[0], sel));
  assert.ok(!matches(tiles[1], sel));
  assert.ok(matches(tiles[2], sel));
});

test('matches requires tag AND category when both selected', () => {
  const sel = { tags: new Set(['saas']), categories: new Set(['docs']) };
  assert.ok(!matches(tiles[0], sel)); // saas but marketing
  assert.ok(!matches(tiles[1], sel)); // docs but blog
  assert.ok(matches(tiles[2], sel));  // saas + docs
});

test('matches handles missing attributes safely', () => {
  const sel = { tags: new Set(['saas']), categories: new Set() };
  assert.ok(!matches({}, sel));
});

test('uniqueLabels collects distinct values', () => {
  assert.deepEqual(uniqueLabels(tiles, 'tags'), ['saas', 'landing', 'blog', 'docs']);
  assert.deepEqual(uniqueLabels(tiles, 'categories'), ['marketing', 'content', 'docs']);
});

test('applyFilters reports empty state', () => {
  const sel = { tags: new Set(['nope']), categories: new Set() };
  const res = applyFilters(tiles, sel);
  assert.equal(res.visible.length, 0);
  assert.ok(res.empty);
});
