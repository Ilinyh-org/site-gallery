# site-gallery


Static one-page gallery of website screenshots (Hugo + npm build pipeline).

Spec: https://ilinyh.blog/ru/posts/projects/site_gallery/

## Scripts

- `npm run dev` — Hugo dev server with live-reload on port 1313 (uses existing S3 screenshots). Requires `hugo` on PATH (a local binary works, e.g. `tools/hugo`).
- `npm run build` — capture screenshots (Playwright), upload to S3, run `hugo --minify` into `public/`.
- `npm run deploy` — build, then publish `public/` to `DEPLOY_TARGET` (rsync-over-ssh, `user@host:/path`).

## Tests

- `node --test` — unit tests for non-capture logic (config handling, S3 keys, filtering). No Playwright or network needed.

## Configuration

- `config/sites.yaml` — site list: name, url, slug, pages, tags, categories.
- `.env` (see `.env.example`) — S3 credentials, capture timeout/concurrency, deploy target. Never committed.

## Layout

Screenshots live in S3 under `screenshots/{slug}/{page-slug}.png|.gif` and are served
directly from S3 public URLs — no CDN in front.

## Status & docs

- `docs/acceptance-audit.md` — spec §12 acceptance audit (done / deferred / open questions).
- `STATUS.md` — working log and decisions.