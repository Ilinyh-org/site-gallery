// Client-side tag/category filtering (spec 2.3). Vanilla JS, no page reload.
(function () {
  const tiles = Array.from(document.querySelectorAll('#gallery .tile'));
  const tagBox = document.getElementById('tag-chips');
  const catBox = document.getElementById('category-chips');
  const resetBtn = document.getElementById('filter-reset');
  const emptyMsg = document.getElementById('empty-message');

  const selected = { tags: new Set(), categories: new Set() };

  function collectLabels(box, kind) {
    const values = new Set();
    for (const tile of tiles) {
      (tile.dataset[kind] || '').split(/\s+/).filter(Boolean).forEach((v) => values.add(v));
    }
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

  function matches(tile) {
    const tags = (tile.dataset.tags || '').split(/\s+/).filter(Boolean);
    const cats = (tile.dataset.categories || '').split(/\s+/).filter(Boolean);
    const tagOk = selected.tags.size === 0 || tags.some((t) => selected.tags.has(t));
    const catOk = selected.categories.size === 0 || cats.some((c) => selected.categories.has(c));
    return tagOk && catOk;
  }

  function apply() {
    let visible = 0;
    for (const tile of tiles) {
      const show = matches(tile);
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

  // Exposed so tiles hidden on image-load errors (spec 2.5) can re-run the empty-state check.
  window.filterCheck = apply;
})();
