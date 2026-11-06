// Shared helpers: load sites.yaml, slugify page paths, build S3 keys/URLs.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export function loadConfig(root = process.cwd()) {
  const file = path.join(root, 'config', 'sites.yaml');
  const doc = yaml.load(fs.readFileSync(file, 'utf8'));
  if (!doc || !Array.isArray(doc.sites)) {
    throw new Error('Invalid config/sites.yaml: expected top-level `sites:` list');
  }
  for (const s of doc.sites) {
    if (!s.name || !s.url || !s.slug) {
      throw new Error(`Invalid site entry (needs name, url, slug): ${JSON.stringify(s)}`);
    }
    if (!s.pages || s.pages.length === 0) s.pages = ['/'];
    if (!Array.isArray(s.tags)) s.tags = [];
    if (!Array.isArray(s.categories)) s.categories = [];
  }
  return doc.sites;
}

// "/" -> "index"; "/pricing" -> "pricing"; "/about/team" -> "about-team"
export function pageSlug(pagePath) {
  const clean = pagePath.replace(/^\/+|\/+$/g, '');
  return clean === '' ? 'index' : clean.replace(/\//g, '-');
}

export function screenshotKeys(site) {
  return site.pages.map((p) => ({
    page: p,
    pngKey: `screenshots/${site.slug}/${pageSlug(p)}.png`,
    gifKey: `screenshots/${site.slug}/${pageSlug(p)}.gif`,
  }));
}

export function publicUrl(site, pagePath) {
  const base = (process.env.S3_PUBLIC_URL || '').replace(/\/+$/, '');
  return `${base}/screenshots/${site.slug}/${pageSlug(pagePath)}.png`;
}
