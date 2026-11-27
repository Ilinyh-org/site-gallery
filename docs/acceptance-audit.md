# Spec §12 acceptance audit (site_gallery spec, 2026-11-07)

| Criterion | Status | Evidence |
|---|---|---|
| Three npm scripts: dev, build, deploy | ✅ | package.json scripts |
| `npm run dev` local server + live-reload | ✅ | scripts/dev.js → hugo server :1313 (hugo verified locally, tools/) |
| `npm run build` capture + S3 upload + hugo | ✅ code / ⏳ runtime | scripts/build.js orchestrates capture→upload→hugo; capture & upload DEFERRED (no live run) |
| `npm run deploy` publishes to target host | ✅ code / ⏳ runtime | scripts/deploy.js (rsync-over-ssh via DEPLOY_TARGET); needs real target |
| Sites/pages defined in config/sites.yaml | ✅ | config/sites.yaml, spec 2.2 format |
| All listed pages captured per site | ⏳ | DEFERRED (capture.js implements; not run live) |
| Unavailable site → warning, old shot kept | ✅ code / ⏳ runtime | capture.js failure handling; upload.js never deletes remote |
| Screenshots in S3 at public URLs | ⏳ | DEFERRED; keys per spec 2.6 (scripts/lib.js screenshotKeys) |
| No CDN | ✅ | S3 public URL + static host only (hugo.toml params) |
| Hugo Gallery theme | ⚠️ | Custom minimal `themes/gallery` implements required UX; spec recommends themes.gohugo.io theme — owner question open |
| Client-side tag/category filtering | ✅ | static/js/filter.js + filter-core.js; 16 tests |
| Click opens site in new tab | ✅ | target="_blank" rel="noopener" |
| Desktop + mobile correct | ✅ | responsive grid (auto-fill + ≤640px 2-col); no live browser check yet |
| Build time ≤5 min (10 sites × 3 pages) | ⏳ | concurrency=4 configured; measure post-DEFERRED |

Legend: ✅ done · ⏳ deferred/needs runtime · ⚠️ open question
