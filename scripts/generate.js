// Static site generator (sub-issue #16): renders public/index.html + assets from config/sites.yaml.
// Replaces the former Hugo layer. No CDN: images referenced relatively from the same origin.
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadConfig, pageSlug, publicUrl } from './lib.js';

// S3 mode (issue #36): when S3_PUBLIC_URL is set, tiles point at S3-hosted
// screenshots; otherwise tiles use same-origin relative paths (Pages assets).
const s3Mode = () => Boolean(process.env.S3_PUBLIC_URL);

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderPage(sites) {
  const tiles = [];
  const tagSet = new Set();
  const catSet = new Set();
  for (const site of sites) {
    for (const page of site.pages) {
      const slug = pageSlug(page);
      tiles.push(`      <a class="tile" data-tags="${esc((site.tags || []).join(' '))}" data-categories="${esc((site.categories || []).join(' '))}"
         href="${esc(site.url)}" target="_blank" rel="noopener">
        <img src="${esc(s3Mode() ? publicUrl(site, page) : `screenshots/${esc(site.slug)}/${esc(slug)}.png`)}"
             alt="${esc(site.slug)} — ${esc(slug)}" loading="lazy" decoding="async"
             width="1280" height="720"
             onerror="this.closest('.tile').hidden=true;window.filterCheck&&filterCheck()">
      </a>`);
      (site.tags || []).forEach((t) => tagSet.add(t));
      (site.categories || []).forEach((c) => catSet.add(c));
    }
  }
  const chips = (values, kind) => [...values].map((v) => `        <button type="button" class="chip" data-kind="${kind}" data-value="${esc(v)}">${esc(v)}</button>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Site Screenshots Gallery</title>
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#121212">
  <script>try { var t = localStorage.getItem('theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}</script>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="site-header">
    <h1>Site Screenshots Gallery</h1>
    <button id="theme-toggle" type="button" aria-label="Toggle theme">🌗</button>
  </header>

  <nav class="filters" id="filters">
    <div class="filter-group" id="tag-chips">
${chips(tagSet, 'tags')}
    </div>
    <div class="filter-group" id="category-chips">
${chips(catSet, 'categories')}
    </div>
    <button id="filter-reset" type="button">Reset</button>
  </nav>

  <main>
    <div class="gallery" id="gallery">
${tiles.join('\n')}
    </div>
    <p id="empty-message" hidden>Nothing found</p>
  </main>

  <script type="module" src="js/filter.js"></script>
</body>
</html>
`;
}

// Pre-render chips statically; filter.js also rebuilds them from tiles, so keep both consistent.
export async function generate({ sites = null } = {}) {
  const list = sites || loadConfig();
  await fs.mkdir(PUBLIC, { recursive: true });
  for (const dir of ['css', 'js', 'screenshots']) {
    await fs.mkdir(path.join(PUBLIC, dir), { recursive: true });
  }
  for (const [src, dest] of [
    ['static/css/style.css', 'css/style.css'],
    ['static/js/filter.js', 'js/filter.js'],
    ['static/js/filter-core.js', 'js/filter-core.js'],
  ]) {
    await fs.copyFile(path.join(ROOT, src), path.join(PUBLIC, dest));
  }
  await fs.writeFile(path.join(PUBLIC, 'index.html'), renderPage(list));
  return { page: 'public/index.html', tiles: list.reduce((n, s) => n + s.pages.length, 0) };
}

if (process.argv[1] && process.argv[1].endsWith('generate.js')) {
  const res = await generate();
  console.log(`Generated ${res.page} (${res.tiles} tiles)`);
}
