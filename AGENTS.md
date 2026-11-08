# AGENTS.md — conventions for AI agents working on this repository

Authoritative spec: https://ilinyh.blog/ru/posts/projects/site_gallery/
When requirements are unclear, fetch and re-read the spec. Never guess — the spec wins.

## Project

Static one-page gallery of website screenshots: Hugo static site + npm build pipeline.
Playwright captures (PNG + scrolling GIF, ≥1280×720), S3-compatible storage
(`screenshots/{slug}/{page-slug}.png|.gif`), client-side tag/category filtering,
CSS Grid square tiles, light + dark themes, lazy loading, NO CDN.

## Branch & merge rules

- Default working branch: `dev`. All work happens on `feat/*` branches → PR into `dev`.
- `main` is owner-only: NEVER push to `main` or open a `dev` → `main` PR without an
  explicit owner instruction.
- PRs are self-merged once verification is green (see below), then the feat branch is
  deleted (remote + local).
- Direct pushes to `dev` are rejected by repo rules — changes land only via PRs.

## Verification before merge

Run all three; everything must be green:

1. `node --check` on every changed JS file.
2. `npm test` (node --test) — non-capture unit tests only.
3. `hugo --minify` — clean build into `public/` (a local `tools/hugo` binary works;
   build.js resolves it before PATH).

## Scope guards

- S3 / screenshot capture work is DEFERRED by the owner — do not develop, install for,
  or verify capture.js / upload.js / Playwright browser flows. Stubbed runs
  (`BUILD_DRY_RUN=1`) are fine.
- Never commit secrets. `.env` stays local; `.env.example` holds placeholders only.
- English everywhere: code comments, commits, issues, PRs, reports.

## Layout

- `config/sites.yaml` — site list (source of truth; mirrored to `data/` at build time).
- `scripts/` — capture.js, upload.js, build.js (orchestrator), dev.js, deploy.js, lib.js.
- `themes/gallery/` — minimal Hugo theme (grid, filters, themes, lazy loading).
- `static/js/` — filter.js (DOM layer) + filter-core.js (pure logic, unit-tested).
- `tests/` — node:test suites for non-capture logic.
- `docs/acceptance-audit.md` — spec §12 status map. `STATUS.md` — working log.

## Communication

Reports are SHORT: outcome, evidence (paths/commands/tests), what is needed. Full detail
belongs in STATUS.md and PR descriptions, not chat.
