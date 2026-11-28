// Client-side filtering + search + count + theme selector (spec 2.3, issue #43).
// Vanilla JS, no page reload. Pure logic lives in filter-core.js (unit-tested
// in tests/filter-core.test.js).
import { matches, matchesSearch, uniqueLabels } from './filter-core.js';

(function () {
  const tiles = Array.from(document.querySelectorAll('#gallery .card'));
  const tagBox = document.getElementById('tag-chips');
  const catBox = document.getElementById('category-chips');
  const resetBtn = document.getElementById('filter-reset');
  const emptyMsg = document.getElementById('empty-message');
  const searchInput = document.getElementById('search');
  const countEl = document.getElementById('count');

  const selected = { tags: new Set(), categories: new Set() };

  function collectLabels(box, kind) {
    if (!box) return;
    box.textContent = ''; // static pre-render exists only as no-JS fallback; rebuild from tiles
    const values = uniqueLabels(tiles.map((t) => t.dataset), kind);
    for (const value of values) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = value;
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => {
        const on = chip.classList.toggle('active');
        chip.setAttribute('aria-pressed', String(on));
        if (selected[kind].has(value)) selected[kind].delete(value);
        else selected[kind].add(value);
        apply();
      });
      box.appendChild(chip);
    }
  }

  function apply() {
    const query = searchInput ? searchInput.value : '';
    let visible = 0;
    for (const tile of tiles) {
      const show = matches(tile.dataset, selected) && matchesSearch(tile.dataset, query);
      tile.hidden = !show;
      if (show) visible++;
    }
    if (emptyMsg) emptyMsg.hidden = visible > 0;
    if (countEl) countEl.textContent = `${visible} ${visible === 1 ? 'website' : 'websites'}`;
    if (resetBtn) resetBtn.hidden = visible === tiles.length && !query.trim();
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selected.tags.clear();
      selected.categories.clear();
      document.querySelectorAll('.chip.active').forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      if (searchInput) searchInput.value = '';
      apply();
    });
  }
  if (searchInput) searchInput.addEventListener('input', apply);

  // Theme selector (issue #43 §6): System | Light | Dark, persisted to
  // localStorage ('theme'); absent key = follow OS preference.
  const themeBtns = Array.from(document.querySelectorAll('[data-theme-choice]'));
  function currentChoice() {
    return document.documentElement.dataset.theme === 'light'
      || document.documentElement.dataset.theme === 'dark'
      ? document.documentElement.dataset.theme
      : 'system';
  }
  function setTheme(choice) {
    if (choice === 'light' || choice === 'dark') {
      document.documentElement.dataset.theme = choice;
      document.documentElement.style.colorScheme = choice;
      try { localStorage.setItem('theme', choice); } catch (e) {}
    } else {
      delete document.documentElement.dataset.theme;
      delete document.documentElement.style.colorScheme;
      try { localStorage.removeItem('theme'); } catch (e) {}
    }
    themeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === choice)));
  }
  themeBtns.forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.themeChoice === currentChoice()));
    b.addEventListener('click', () => setTheme(b.dataset.themeChoice));
  });

  collectLabels(catBox, 'categories');
  collectLabels(tagBox, 'tags');
  apply();

  // Exposed so cards hidden on image-load errors (spec 2.5) can re-run the empty-state check.
  window.filterCheck = apply;
})();
