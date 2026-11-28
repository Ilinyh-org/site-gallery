// Pure filtering logic shared by static/js/filter.js and tests (no DOM).
// tiles: [{ tags: string[], categories: string[] }]
// selected: { tags: Set<string>, categories: Set<string> }

export function toLabels(tile) {
  return {
    tags: String(tile.tags || '').split(/\s+/).filter(Boolean),
    categories: String(tile.categories || '').split(/\s+/).filter(Boolean),
  };
}

export function matches(tile, selected) {
  const { tags, categories } = toLabels(tile);
  const tagOk = selected.tags.size === 0 || tags.some((t) => selected.tags.has(t));
  const catOk = selected.categories.size === 0 || categories.some((c) => selected.categories.has(c));
  return tagOk && catOk;
}

export function uniqueLabels(tiles, kind) {
  const values = new Set();
  for (const tile of tiles) toLabels(tile)[kind].forEach((v) => values.add(v));
  return [...values];
}

export function applyFilters(tiles, selected) {
  const visible = tiles.filter((t) => matches(t, selected));
  return { visible, empty: visible.length === 0 };
}

// Search (issue #43 §2): case-insensitive multi-term match over name, domain,
// tags and categories. All whitespace-separated terms must match (AND).
export function matchesSearch(tile, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const hay = [tile.name, tile.domain, tile.tags, tile.categories]
    .map((v) => String(v || '').toLowerCase())
    .join(' ');
  return q.split(/\s+/).every((term) => hay.includes(term));
}
