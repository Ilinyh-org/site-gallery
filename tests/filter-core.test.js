// Tests for pure filtering logic (filter-core.js). Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matches, matchesSearch, uniqueLabels, applyFilters, toLabels } from '../static/js/filter-core.js';

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

// Search (issue #43 §2): pure logic tests.
const searchable = {
  name: "Ilinyh's Blog", domain: 'ilinyh.blog', tags: 'blog personal', categories: 'writing',
};

test('matchesSearch with empty/blank query shows everything', () => {
  assert.ok(matchesSearch(searchable, ''));
  assert.ok(matchesSearch(searchable, '   '));
  assert.ok(matchesSearch(searchable, null));
});

test('matchesSearch matches name, domain, tags, categories case-insensitively', () => {
  assert.ok(matchesSearch(searchable, 'blog'));
  assert.ok(matchesSearch(searchable, 'ILINYH'));
  assert.ok(matchesSearch(searchable, 'ilinyh.blog'));
  assert.ok(matchesSearch(searchable, 'personal'));
  assert.ok(matchesSearch(searchable, 'writing'));
  assert.ok(!matchesSearch(searchable, 'shop'));
});

test('matchesSearch ANDs multiple terms', () => {
  assert.ok(matchesSearch(searchable, 'blog ilinyh'));
  assert.ok(!matchesSearch(searchable, 'blog shop'));
});

test('matchesSearch is safe on missing attributes', () => {
  assert.doesNotThrow(() => matchesSearch({}, 'anything'));
  assert.ok(matchesSearch({}, ''));          // empty query matches everything
  assert.ok(!matchesSearch({}, 'anything')); // empty tile never matches a real query
});
