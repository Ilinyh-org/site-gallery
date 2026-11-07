// Client-side tag/category filtering (spec 2.3). Vanilla JS, no page reload.
// Pure logic lives in filter-core.js (unit-tested in tests/filter-core.test.js).
import { matches, uniqueLabels } from './filter-core.js';

(function () {
  const tiles = Array.from(document.querySelectorAll('#gallery .tile'));
  const tagBox = document.getElementById('tag-chips');
  const catBox = document.getElementById('category-chips');
  const resetBtn = document.getElementById('filter-reset');
  const emptyMsg = document.getElementById('empty-message');

  const selected = { tags: new Set(), categories: new Set() };

  function collectLabels(box, kind) {
    const values = uniqueLabels(tiles.map((t) => t.dataset), kind);
    for (const value of values) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = value;
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        if (selected[kind].has(value)) selected[kind].delete(value);
        else selected[kind].add(value);
        apply();
      });
      box.appendChild(chip);
    }
  }

  function apply() {
    let visible = 0;
    for (const tile of tiles) {
      const show = matches(tile.dataset, selected);
      tile.hidden = !show;
      if (show) visible++;
    }
    emptyMsg.hidden = visible > 0;
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selected.tags.clear();
      selected.categories.clear();
      document.querySelectorAll('.chip.active').forEach((c) => c.classList.remove('active'));
      apply();
    });
  }

  // Theme toggle: cycles auto -> light -> dark -> auto.
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    const order = ['', 'light', 'dark'];
    toggle.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme || '';
      const next = order[(order.indexOf(current) + 1) % order.length];
      if (next) document.documentElement.dataset.theme = next;
      else delete document.documentElement.dataset.theme;
    });
  }

  collectLabels(tagBox, 'tags');
  collectLabels(catBox, 'categories');
  apply();
})();
