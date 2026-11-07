// Client-side tag/category filtering for the gallery (spec §6).
(function () {
  var tiles = Array.from(document.querySelectorAll('.gallery .tile'));
  var gallery = document.getElementById('gallery');
  var emptyMessage = document.getElementById('empty-message');
  var tagChips = document.getElementById('tag-chips');
  var catChips = document.getElementById('category-chips');
  var resetBtn = document.getElementById('filter-reset');
  if (!gallery || tiles.length === 0) return;

  var activeTags = new Set();
  var activeCats = new Set();

  function collectValues(attr) {
    var out = new Set();
    tiles.forEach(function (t) {
      (t.getAttribute(attr) || '').split(/\s+/).forEach(function (v) {
        if (v) out.add(v);
      });
    });
    return Array.from(out).sort();
  }

  function makeChip(group, value, activeSet) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = value;
    b.addEventListener('click', function () {
      if (activeSet.has(value)) activeSet.delete(value);
      else activeSet.add(value);
      b.classList.toggle('active', activeSet.has(value));
      apply();
    });
    group.appendChild(b);
  }

  collectValues('data-tags').forEach(function (v) { makeChip(tagChips, v, activeTags); });
  collectValues('data-categories').forEach(function (v) { makeChip(catChips, v, activeCats); });

  function matches(tile) {
    var tags = (tile.getAttribute('data-tags') || '').split(/\s+/).filter(Boolean);
    var cats = (tile.getAttribute('data-categories') || '').split(/\s+/).filter(Boolean);
    for (var t of activeTags) if (tags.indexOf(t) === -1) return false;
    for (var c of activeCats) if (cats.indexOf(c) === -1) return false;
    return true;
  }

  function apply() {
    var visible = 0;
    tiles.forEach(function (t) {
      var ok = matches(t);
      t.hidden = !ok;
      if (ok) visible++;
    });
    if (emptyMessage) emptyMessage.hidden = visible !== 0;
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      activeTags.clear();
      activeCats.clear();
      document.querySelectorAll('.chip.active').forEach(function (c) {
        c.classList.remove('active');
      });
      apply();
    });
  }
})();
