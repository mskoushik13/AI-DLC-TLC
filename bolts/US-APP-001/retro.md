# Bolt US-APP-001 — post-mortem

## 1. How it performed

Figures from manifest.json, audit.md and results/US-APP-001.result.json.

| Measure | Value |
|---|---|
| Started | 2026-10-05T08:49:39Z |
| Gate 1 presented | 09:46:51Z (57 min, including ~4 min blocked waiting for credentials) |
| Gate 1 approved | 09:54:12Z (7 min human wait) |
| Gate 2 presented | 10:01:34Z (7 min generate → run → heal → re-run) |
| Total to Gate 2 | ~72 min |
| Heals | 1 (1.3, test defect, fixed on attempt 1) |
| Full-suite runs | 5 (1 red, 4 green) |
| Exploration scripts | 9, about 8 sign-ins at ~2.5s each |
| Result | 5/5 passed (seed + 4 tests) |
| Permanent records created by this bolt | **0** (7 created: 2 exploration probes and 5 test runs; all 7 deleted and verified by search) |

Unrelated: 2 records `MSKOUSHIK-20261005T091415` / `-095554` exist on the app. They do not match this bolt's name format and were left alone.

## 2. Where it could improve

- **Pre-Gate-1 time went on setup, not exploration.** Three environment faults were each found only by hitting them: (a) the story targets a different app from `e2e.config.yml`; (b) `@playwright/test` was not installed, and the playwright-test MCP server cached that failure until a restart; (c) `playwright.config.ts` cannot load in this folder (`__dirname` under `"type": "module"`). Each cost a diagnose-and-workaround cycle.
- **Nearly reported a missing success message.** Probe 1 queried `[role=alert]`/toast selectors, found nothing, and the script stopped. The confirmation is a modal `dialog`. This was caught by re-instrumenting, as `e2e-plan` "Before writing that a UI element is absent" requires. That rule worked, but the first probe should have dumped the full snapshot.
- **One extra full run** (run 3): its JSON went to a scratch file outside `results/` and the suite then had to be re-run for `pw-aidlc results`. It cost one record (deleted).
- **Run 2 and 3 timestamps were not captured live.** The audit says so rather than backfilling.
- **Approver mismatch:** Gate 1 was approved by the session user; `governance.owner` is Pranay.
- Checked against the Step 2 list: no `selectOption` and no `first: true`; no `fixtures.ts` duplication (there is no fixtures module for this app); the heal is classified and written to knowledge.

## 3. Suggestions

**AI-DLC config**
- `e2e.config.yml` has one `app.url` (CrewHub). A story for another app has to run on a `BASE_URL` override plus a second config. Either give each app its own workspace via `pw-aidlc init`, or add a per-bolt `app_url` that the kit honours.

**Bundled Playwright framework**
- `playwright.config.ts` and `tests/seed.spec.ts` use `__dirname`, which breaks whenever the workspace `package.json` has `"type": "module"`, as this kit folder's does. Use a `.cts` config, or derive the directory in an ESM-safe way.
- `lib/report.mjs` (`pw-aidlc results`) always runs `npx playwright test` with the default config. Add a `--config` pass-through so a non-default config needs no `--no-run` workaround.

**Bundled knowledge**
- Written: `knowledge/project/enigma-ai-app-notes.md`, covering the late-loading grid, success modal vs toast, duplicate-name native alert, per-field `*` markers and the Remove flow.
- Candidate for `knowledge/org/locator-policy.md` (not written; a human should decide, and the templates copy must match): "required-field markers are usually one element per field; scope `*` checks to the field's row."

**Skills**
- `e2e-intake` §5: compare a story's stated application URL with `app.url` and stop on a mismatch before any exploration. This bolt found it by chance.
- `e2e-plan` exploration guidance: after any save, dump the full accessibility snapshot first and query specific selectors second.
