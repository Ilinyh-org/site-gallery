# site-gallery


Static one-page gallery of website screenshots (Hugo + npm build pipeline).

Spec: https://ilinyh.blog/ru/posts/projects/site_gallery/

## Scripts

- `SKIP_CAPTURE=1 npm run build` — generate the static site into `public/` from `config/sites.yaml` (no screenshot capture; safe locally).
- `npm run build` — full build: capture screenshots (Playwright), generate the static site into `public/`.
- `npm run dev` — serve `public/` at http://127.0.0.1:1313 (run a build first).
- `npm run deploy` — build, then publish `public/` to `DEPLOY_TARGET` (rsync-over-ssh, `user@host:/path`). GitHub Pages publishing lands via the Actions workflow (sub-issue #17).

## Tests

- `npm test` (node --test) — unit tests for non-capture logic (config handling, S3 keys, filtering). No Playwright or network needed.

## Configuration

- `config/sites.yaml` — site list: name, url, slug, pages, tags, categories.
- `.env` (see `.env.example`) — S3 credentials, capture timeout/concurrency, deploy target. Never committed.

## Layout

- `config/sites.yaml` — site list (source of truth).
- `scripts/` — capture.js, upload.js, build.js (orchestrator), generate.js (static site generator), dev.js, deploy.js, lib.js.
- `static/` — css + js assets copied into `public/` at build time; screenshots land in `public/screenshots/`.
- `tests/` — node:test suites for non-capture logic.
- `docs/acceptance-audit.md` — spec §12 status map. `STATUS.md` — working log.