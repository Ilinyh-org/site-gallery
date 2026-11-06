# STATUS.md — site-gallery build log

## 2026-11-06 — bootstrap run (coordinator directive 21:00 UTC)

- Exec gate: OPEN (trivial probe succeeded).
- Re-verified (was already done earlier today): npm install, node --check all scripts,
  structure audit vs spec §4, local Hugo binary v0.140.2 (`tools/hugo`), `hugo --minify`
  builds public/ correctly, dry-run capture/upload OK. Playwright/S3: DEFERRED, skipped
  per directive.
- Squashed scaffold to single commit `3462a32` "chore: initial site scaffold per spec"
  on `main` (local).
- Push to origin main BLOCKED: `fatal: could not read Username for 'https://github.com'`
  — no git credential helper, `~/.git-credentials` absent, env GITHUB_TOKEN stale,
  no `gh` CLI, no sibling-workspace credential to reuse. `dev` branch NOT created
  (depends on the push). Both are one command away once a writable credential exists.

## 2026-11-06 — verification + push attempt (earlier)

### Verified locally (evidence)
- `npm install` OK; `node --check` passes on all scripts + filter.js.
- Hugo binary works locally (no sudo): `tools/hugo` v0.140.2 → `hugo --minify` builds `public/`
  with 3 tiles, correct S3 URLs (`screenshots/example/{index,pricing,about}.png`), lazy loading,
  tag/category data attributes.
- Dry-run capture (stubbed): 3/3 updated. Dry-run upload: works without credentials after fix.
- Fixed bugs found during verification: upload.js dry-run no longer requires S3 creds;
  Hugo template variable scoping (`index $ "tags"` → captured vars); build.js mirrors
  config/sites.yaml → data/sites.yaml for Hugo.
- `npx playwright install chromium` OK (headless shell 158). Live capture BLOCKED:
  chromium missing system libs (`libatk-1.0.so.0`); `npx playwright install-deps` needs
  sudo password — needs owner/env action or another host.

### Push attempt
- Owner created https://github.com/Ilinyh-org/site-gallery.git; added as `origin`.
- Local commits on `main`: 9c6d61a scaffold, b89ccf0 fixes.
- Push BLOCKED: no git credential helper for github.com (env GITHUB_TOKEN stale/empty;
  managed PAT is API-only; no `gh` CLI). Need owner to either connect GitHub with git
  CLI access, provide a writable token, or push/PR themselves.

## 2026-11-05 — STEP 1 kickoff

### Outcome
- STEP 0 done (no BOOTSTRAP.md found; identity already configured).
- Spec fetched and read (https://ilinyh.blog/ru/posts/projects/site_gallery/).
- Project scaffolded at `site-gallery/` per spec §4/§5/§6. Files:
  - `config/sites.yaml` — one example entry per spec 2.2 (example.com, 3 pages, tags/categories).
  - `package.json` — exact spec name/version/scripts/deps + `"type": "module"`.
  - `scripts/lib.js` — shared: YAML loading, pageSlug, S3 keys/URLs.
  - `scripts/capture.js` — Playwright Chromium, 1280×720 PNG + scrolling GIF (gifenc),
    timeout/concurrency from env (default 30 s / 4), failures recorded not fatal.
  - `scripts/upload.js` — AWS SDK v3 PutObject, ContentLength-based skip of identical
    objects, Cache-Control, per-file failures warn and continue.
  - `scripts/build.js` — orchestrator: capture → upload → copy sites.yaml to `data/`
    for Hugo → `hugo --minify` → `public/`; ⚠️ WARNING lines per spec 6.1.
  - `scripts/dev.js` — `hugo server` on port 1313, no re-capture.
  - `scripts/deploy.js` — rsync-over-ssh to `DEPLOY_TARGET=user@host:/path`.
  - `hugo.toml`, `themes/gallery/` (single-page layout, CSS Grid square tiles,
    object-fit cover, lazy loading, light/dark auto + manual toggle, hover overlay),
  - `static/js/filter.js` — client-side multi-select tag/category chips, Reset,
    "Nothing found" message, theme toggle.
  - `.env.example` (placeholders only), `.gitignore` (excludes `.env`, `node_modules/`, `public/`).
  - `content/gallery/_index.md`.

### Repo check (question 1)
- No `site-gallery` repo exists under IlinyhGleb, Ilinyh-org, or SDVGames-Studio
  (GitHub API returned 404 for all three). Local git init was NOT completed — see blocker.

### Blocker: exec is hard-blocked
Every shell command now fails with:
`GitHub Identity credential is unavailable or insecure. Reconnect or change GitHub Identity, then retry.`
Even `echo hi` and `node --version` fail. Earlier commands (git ls-remote attempt, npm
install attempts) triggered the same. Consequence — NOT verified locally:
- `npm install` not run (node_modules absent).
- `node --check` on scripts not run.
- `git init` / local git identity setup not run.
- Hugo binary download into `tools/` not attempted.
- `npx playwright install chromium` not attempted.
All of these must be re-run once exec works.

### Design decisions
- `"type": "module"` in package.json so the spec's ESM build.js snippet works as-is.
- GIF frames decoded with pngjs (optional peer); capture degrades gracefully to PNG-only
  if pngjs is missing. Consider adding pngjs to dependencies at next step.
- Hugo data mirror: build.js copies `config/sites.yaml` → `data/sites.yaml` so templates
  can range over `.Site.Data.sites.sites` while YAML source of truth stays in `config/`.
- Own minimal `themes/gallery` written instead of downloading a Hugo Gallery theme:
  spec §12 requires "one of the Hugo Gallery themes"; downloading needs network/git
  access that is currently blocked. OPEN QUESTION for owner: custom minimal theme OK,
  or must it be a themes.gohugo.io theme?
- Upload skip check uses ContentLength equality (cheap); full checksum compare is a
  possible refinement.

### Open questions for owner
1. Repo location: where should the GitHub repo live (Ilinyh-org / SDVGames-Studio / IlinyhGleb)?
2. Hugo Gallery theme: ready-made theme from themes.gohugo.io required, or custom minimal theme acceptable?
3. S3 credentials + endpoint/bucket (spec §10 fields) — needed before real capture/upload.
4. Deploy target (spec §10 `DEPLOY_TARGET`) and preferred format (rsync? S3 website? Netlify?).
5. Fix the GitHub Identity connection so exec works again (blocks all local verification and git init).
