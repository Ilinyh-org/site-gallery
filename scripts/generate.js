// Static site generator: renders public/index.html + assets from config/sites.yaml.
// Issue #43: minimalist editorial redesign — masonry-inspired responsive grid,
// fixed-height viewport previews, system/light/dark themes, filters + search + count.
import fs from 'node:fs/promises';
import path from 'node:path';
import { loadConfig, pageSlug, publicUrl, sizeVariant } from './lib.js';

// S3 mode (issue #36): when S3_PUBLIC_URL is set, tiles point at S3-hosted
// screenshots; otherwise tiles use same-origin relative paths (Pages assets).
const s3Mode = () => Boolean(process.env.S3_PUBLIC_URL);

// Canonical site base URL (SEO, issue #43 §11): override with SITE_URL if the
// deploy target ever moves; default matches the GitHub Pages deploy.
const SITE_URL = (process.env.SITE_URL || 'https://ilinyh-org.github.io/site-gallery').replace(/\/+$/, '');

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const domainOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};

export function renderPage(sites) {
  const cards = [];
  const tagSet = new Set();
  const catSet = new Set();
  let pageCount = 0;

  for (const site of sites) {
    const domain = domainOf(site.url);
    for (const page of site.pages) {
      const slug = pageSlug(page);
      const variant = sizeVariant(`${site.slug}/${slug}`);
      pageCount++;
      (site.tags || []).forEach((t) => tagSet.add(t));
      (site.categories || []).forEach((c) => catSet.add(c));
      const imgSrc = esc(s3Mode() ? publicUrl(site, page) : `screenshots/${esc(site.slug)}/${esc(slug)}.png`);
      const labels = [
        ...(site.categories || []),
        ...(site.tags || []),
      ];
      cards.push(`      <article class="card" data-tags="${esc((site.tags || []).join(' '))}" data-categories="${esc((site.categories || []).join(' '))}" data-name="${esc(site.name)}" data-domain="${esc(domain)}">
        <a class="tile preview--${variant}" href="${esc(site.url)}" target="_blank" rel="noopener noreferrer"
           aria-label="${esc(site.name)} — ${esc(page)} (opens in a new tab)">
          <img src="${imgSrc}" alt="Screenshot of ${esc(site.name)}, ${esc(page)} page"
               loading="lazy" decoding="async" width="1280" height="720"
               onerror="this.closest('.card').hidden=true;window.filterCheck&&filterCheck()">
        </a>
        <div class="card-meta">
          <h2 class="card-title"><a href="${esc(site.url)}" target="_blank" rel="noopener noreferrer">${esc(site.name)}<span class="card-arrow" aria-hidden="true">&nbsp;&#8599;</span></a></h2>
          <p class="card-domain">${esc(domain)}${page !== '/' ? ` &middot; ${esc(page)}` : ''}</p>
          ${labels.length ? `<p class="card-tags">${labels.map((l) => `<span>${esc(l)}</span>`).join(' ')}</p>` : ''}
        </div>
      </article>`);
    }
  }

  const chips = (values, kind, label) => [...values].length
    ? `    <div class="filter-group" data-kind="${kind}" aria-label="${esc(label)}">
${[...values].map((v) => `        <button type="button" class="chip" data-kind="${kind}" data-value="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join('\n')}
    </div>`
    : '';

  const description = 'A curated collection of interesting websites — screenshots-first, minimalist, quietly organized.';
  const ogImage = `${SITE_URL}/screenshots/${esc(sites[0]?.slug || 'site')}/index.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Site Screenshots Gallery</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${SITE_URL}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Site Screenshots Gallery">
  <meta property="og:title" content="Site Screenshots Gallery">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#F7F7F5">
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#171717">
  <script>(function () { try { var t = localStorage.getItem('theme'); if (t === 'light' || t === 'dark') { document.documentElement.dataset.theme = t; document.documentElement.style.colorScheme = t; } } catch (e) {} })();</script>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="site-header">
    <p class="site-name">Site Gallery</p>
    <nav class="theme-nav" aria-label="Theme">
      <button type="button" class="theme-btn" data-theme-choice="system" aria-pressed="true">System</button>
      <button type="button" class="theme-btn" data-theme-choice="light" aria-pressed="false">Light</button>
      <button type="button" class="theme-btn" data-theme-choice="dark" aria-pressed="false">Dark</button>
    </nav>
  </header>

  <main id="main">
    <section class="intro">
      <h1>A collection of websites.</h1>
      <p>A curated visual directory of interesting sites, organized by screenshots.</p>
    </section>

    <section class="toolbar" aria-label="Gallery filters">
      <div class="toolbar-row">
        <nav class="filters" id="filters">
          <div class="filter-group" id="category-chips" aria-label="Category filters">
${chips(catSet, 'categories', 'Categories')}
          </div>
          <div class="filter-group" id="tag-chips" aria-label="Tag filters">
${chips(tagSet, 'tags', 'Tags')}
          </div>
          <button id="filter-reset" type="button" class="chip chip-reset" hidden>Reset</button>
        </nav>
        <div class="toolbar-side">
          <label class="search-label" for="search">Search</label>
          <input id="search" type="search" placeholder="Search websites&hellip;" autocomplete="off" spellcheck="false">
          <p class="count" id="count" role="status" aria-live="polite">${pageCount} ${pageCount === 1 ? 'website' : 'websites'}</p>
        </div>
      </div>
    </section>

    <section class="gallery-section" aria-label="Website gallery">
      <div class="gallery" id="gallery">
${cards.join('\n')}
      </div>
      <p id="empty-message" hidden>No websites match your filters.</p>
    </section>
  </main>

  <footer class="site-footer">
    <p>&copy; ${new Date().getFullYear()} Gleb Ilinykh &middot; <a href="https://github.com/Ilinyh-org/site-gallery">Source</a></p>
  </footer>

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
  // SEO plumbing (issue #43 §11): single-page sitemap + robots.
  await fs.writeFile(path.join(PUBLIC, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}/</loc></url>\n</urlset>\n`);
  await fs.writeFile(path.join(PUBLIC, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  return { page: 'public/index.html', tiles: list.reduce((n, s) => n + s.pages.length, 0) };
}

if (process.argv[1] && process.argv[1].endsWith('generate.js')) {
  const res = await generate();
  console.log(`Generated ${res.page} (${res.tiles} tiles)`);
}
