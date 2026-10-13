# Prompt log

AI tool: Claude Code (Claude Opus 5.5). Each entry has the verbatim prompt and a summary of the output. Raw session transcripts are exported at the end as a backup.

## Tools & plugins used

Only tools and plugins that actually took part in building this project. Rows are added as new ones are used.

| Name                   | What it is                                      | How it was used                                                                                                                                 |
| ---------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code (Opus 5.5) | AI coding agent in the terminal                 | Plan mode to agree on each step before acting; AskUserQuestion for the 4 stack decisions; read the assignment PDF; wrote docs, ran git and Bun. |
| `vercel` plugin        | Claude Code plugin with Next.js/Vercel guidance | Its session-start hook injected current Next.js and platform context and greenfield-project guidance.                                           |
| `ponytail` plugin      | Claude Code plugin enforcing minimal changes    | Its session-start hook keeps changes minimal; shaped scope, e.g. deferring older filings (`filings.files[]`) and avoiding extra packages.       |
| `superpowers` plugin   | Claude Code plugin with process skills          | Its session-start hook added skill-usage context (brainstorming, verification before completion); no skill changed the code directly.           |

---

## 1. Project kickoff (2026-10-12)

**Prompt**

> I am applying for this position https://quartr.com/careers/job/full-stack-engineer-data-tooling_8203880 and I have the assignment in @docs/Data_Tooling_-_Coding_Assignment.pdf
>
> Part of the tasks is to use AI to develop this system and I would like you to help me trace my work while working on these tasks. To start I would like to make this a monorepo with two projects one for a server that will serve as a mediator for the api and the nextjs application which will be responsible to render the frontend.
>
> Let's start creating a notes.md file as described in the assignment in docs I would like a requirements document (markdown file) and a claude md specifying the use of bun as a server and package manager, typescript, nextjs and some tooling like oxlint, prettier and something for logging.
>
> For the UI I am planning to use shadcn and incorporate into shadcn a Typography component that allows me to set tag, variant, size, color and weight.
>
> On the backend I think caching will be an important factor for this work so we are not constantly making api calls to the APIs

**Output summary**

- Read the assignment PDF; found Bun was not installed.
- Asked four clarifying questions. Answers: **Elysia** backend, **pino** logging, **in-memory TTL + `bun:sqlite`** cache (user considered Redis more realistic but chose SQLite so reviewers need no extra infra), curated **`docs/prompt-log.md`**.
- Proposed a plan: docs → monorepo scaffold → shadcn + Typography.

## 2. Narrow scope to requirements (2026-10-12)

**Prompt**

> I just installed bun, I would like you to add .gitignore file with the standard files for this kind of project. Also I would like on the claude.md to specify the use of conventional commit standard. Let's ignore step 2 and 3 because I want the requirement plan for now

**Output summary**

- Dropped scaffold and shadcn steps for now.
- Created:
  - `.gitignore` — Bun/Next.js/TS ignores, env files (keeps `.env.example`), local SQLite cache, editor/OS files.
  - `CLAUDE.md` — Bun-only, TS strict, Elysia + Eden, Next.js + shadcn + Typography, cache rules, EDGAR User-Agent/rate limit, oxlint/prettier/pino, **Conventional Commits**, prompt-log upkeep.
  - `docs/REQUIREMENTS.md` — BE-1..4, FE-1..2, filing shape, API contract, error codes, EDGAR rules, caching TTLs, Typography spec, extensions.
  - `NOTES.md` — status checklist, decisions & trade-offs, time log.
  - `docs/prompt-log.md` — this file.

## 3. Commit, verify Bun, implementation plan (2026-10-12)

**Prompt**

> commit and make sure the bun command works. After doing this I would like you to write up an implementation plan on how you think all of this will work together. It would be useful as well on the prompt log to present the usage of plugins

Follow-up while reviewing the plan:

> Only list list the tools and plugins that are used in the development of this project. Remove the estimations from the build order & time budget because they are unrealistic being that claude is much faster than those estimates

**Output summary**

- Committed the docs: `9fe6bd9 docs: add requirements, notes, claude guidelines and prompt log`.
- Bun 1.4.3 works (`bun -e` smoke test passed). It lives in `~/.bun/bin`, and `~/.zshrc` adds it to PATH, but the running Claude Code session started before the install, so it needs a restart to see `bun` on PATH.
- Created `docs/IMPLEMENTATION_PLAN.md`: request flow (browser → Next.js RSC → Eden → Elysia → EDGAR), repo layout, cache/throttle/error design, build order without time estimates, test plan.
- Added the "Tools & plugins used" table at the top of this log, listing only what was actually used.

**Plugins/skills used:** `vercel` and `ponytail` session hooks (context only).

## 4. Decisions log and step prompts (2026-10-12)

**Prompt**

> Commit these changes, Now create a list of prompts to excecute the implementation plan you described. I will run each one of those prompts manually with a clear memory in plan mode as steps for developing this assignment

Follow-up while reviewing the plan:

> Can you also add a Decisions.md document with all the decisions that were made during this development.

**Output summary**

- Committed `bfd19b0 docs: add implementation plan and plugin usage to prompt log`.
- Created `docs/DECISIONS.md`: 20 decisions (D-01..D-20) grouped by stack, architecture, caching & EDGAR, API and process, each with why, alternatives, date and the prompt-log entry it came from.
- Created `docs/PROMPTS.md`: 7 self-contained prompts (+1 optional extension) for fresh plan-mode sessions, each naming the docs to read and a "done when" check, plus a shared housekeeping block (checks, prompt log, NOTES.md, DECISIONS.md, conventional commit).
- NOTES.md: status list now matches the prompt steps; decisions section links to DECISIONS.md. CLAUDE.md links all docs.

**Plugins/skills used:** `vercel` and `ponytail` session hooks (context only).

## 5. Scaffold the monorepo (2026-10-12)

**Prompt** (PROMPTS.md step 1, run in plan mode)

> Read docs/REQUIREMENTS.md and docs/IMPLEMENTATION_PLAN.md (phase 1). Scaffold the Bun workspaces monorepo: root package.json (workspaces apps/\*, scripts dev/lint/format/typecheck/test), tsconfig.base.json (strict), .oxlintrc.json, .prettierrc/.prettierignore. Create apps/server as an Elysia app with a pino logger (pino-pretty in dev), env.ts validating PORT and SEC_USER_AGENT, a .env.example, a GET /health route, and export type App. Create apps/web with create-next-app (TypeScript, Tailwind, App Router, src dir, Bun, no ESLint — we use oxlint) on port 3000; server on 3001. bun run dev at the root must start both. Fill in the Commands section of CLAUDE.md. Done when: bun run dev serves both apps, curl localhost:3001/health works, lint/format/typecheck pass.
>
> Setup as well as precommit event to validate the typechecks, test and lint are passing

**Output summary**

- Root: `package.json` (workspaces, `dev`/`lint`/`format`/`format:check`/`typecheck`/`test`/`check`/`prepare`), `tsconfig.base.json` (strict + `noUncheckedIndexedAccess`), `.oxlintrc.json` (`no-console`, `no-explicit-any` as errors), `.prettierrc`, `.prettierignore`, `bun.lock`.
- Pre-commit: `.githooks/pre-commit` runs `bun run check`; `prepare` sets `core.hooksPath` on `bun install` (D-21).
- `apps/server`: Elysia 1.4 with `env.ts` (fail-fast `PORT`/`SEC_USER_AGENT`), pino `logger.ts`, request log in `onAfterResponse`, `GET /health`, `export type App`, `.env.example`, and a `bun test` for `/health` (also keeps `bun test` from failing on zero tests).
- `apps/web`: create-next-app (Next 16.4, React 19.3, Tailwind 4), `next dev --port 3000`, `typecheck` = `next typegen && tsc --noEmit`, tsconfig extends the base.
- Ran prettier once over the existing docs. Filled in the Commands section of CLAUDE.md; ticked step 1 in NOTES.md; added D-21, D-22.
- Verified: `bun run dev` serves both (`/health` → `{"status":"ok"}`, web → 200), missing `SEC_USER_AGENT` aborts startup, `bun run check` passes.

**Plugins/skills used:** `vercel` and `ponytail` session hooks (context only).

## 6. Cache and EDGAR client (2026-10-12)

**Prompt** (PROMPTS.md step 2, run in plan mode)

> Read docs/REQUIREMENTS.md (BE-1, BE-2, EDGAR usage rules, Caching) and docs/IMPLEMENTATION_PLAN.md (phase 2). In apps/server implement: cache.ts (getOrSet with an in-memory Map in front of bun:sqlite at .cache/edgar.sqlite, TTL, in-flight dedupe, serve stale on loader failure), edgar/client.ts (fetchJson with User-Agent from env, ≥100ms spacing between calls, non-2xx → UpstreamError), edgar/tickers.ts (ticker map with 24h TTL, resolveTicker → NotFoundError, searchTickers), edgar/submissions.ts (getFilings(cik) with 1h TTL, transposing filings.recent into Filing objects with the sec.gov URL). Save a trimmed real AAPL submissions JSON as a test fixture. Write bun tests for the transform and the cache (TTL expiry, dedupe). No routes yet. Done when: bun test passes and a one-off script resolves AAPL, SPOT and JPM to filings.

**Output summary**

- `apps/server/src/errors.ts`: `NotFoundError`, `UpstreamError`.
- `cache.ts`: `createCache({ path, now })` (factory so tests can use `:memory:` and a fake clock) + default `cache` at `apps/server/.cache/edgar.sqlite`. Memory Map → SQLite → loader, in-flight dedupe, serves stale on loader failure.
- `edgar/client.ts`: `fetchJson` with `User-Agent`, a promise-chain throttle (≥100ms between calls), and `UpstreamError` on non-2xx or network failure; logs every upstream call.
- `edgar/tickers.ts`: `getTickers` (24h), `resolveTicker`, `searchTickers`. `edgar/submissions.ts`: `Filing` type, pure `toFilings`, `getFilings` (1h).
- Fixture `edgar/__fixtures__/aapl-submissions.json`: 11 real AAPL rows (Form 4, 144 with empty `reportDate`, 10-K, 10-Q, 8-K).
- Tests: `submissions.test.ts` (transpose, URL, empty → null), `cache.test.ts` (TTL, dedupe, stale, rethrow, SQLite persistence). `bun run check` passes (9 tests).
- Verified with a one-off script (not committed): AAPL 1001 filings, SPOT 380 (20-F, no 10-K), JPM 26,293. The second run made no EDGAR calls; the 10-K URL returns 200. Added D-23, D-24.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 7. API routes and error mapping (2026-10-12)

**Prompt** (PROMPTS.md step 3, run in plan mode)

> Read docs/REQUIREMENTS.md (BE-3, BE-4, Errors) and docs/IMPLEMENTATION_PLAN.md (phase 3). The EDGAR client and cache already exist in apps/server/src. Implement pure functions in filings.ts: queryFilings (form filter, repeatable or CSV; sort asc/desc by filingDate; page/pageSize with bounds; plus the distinct forms with counts) and summarize (per-form counts over a rolling 12 months from an injected now, latest 10-K date or null). Add routes GET /companies/search?q=, GET /companies/:ticker/filings and GET /filings/summary?tickers= with Elysia t validation, Promise.allSettled for the summary (per-ticker errors), and an onError mapper to { error: { code, message } } with 400/404/502. Unit-test queryFilings and summarize. Done when: tests pass and curl returns correct data for AAPL, SPOT (latest10K null) and JPM, plus 404 for an unknown ticker.

**Output summary**

- `apps/server/src/filings.ts`: pure `queryFilings` (form filter accepts repeated and CSV values, exact match; sort by `filingDate`; pagination with `totalPages ≥ 1`; `forms: {form, count}[]` over all of the company's filings, not just the filtered ones, so the UI filter keeps every option) and `summarize(filings, now)` (rolling 12 months, cutoff day included; `latest10K` exact `10-K` match).
- `routes/companies.ts` (`/companies/search`, `/companies/:ticker/filings`) and `routes/filings.ts` (`/filings/summary`, `Promise.allSettled`, tickers deduped and upper-cased). `t` schemas: `page ≥ 1`, `pageSize` 1–100, `sort` asc|desc.
- `index.ts`: `onError` maps `NotFoundError` → 404, `UpstreamError` → 502, validation → 400, unknown route → 404, anything else → 500 with a generic message. All return `{ error: { code, message } }`.
- `filings.test.ts`: 9 tests. `bun run check` passes (18 tests).
- Checked with curl: AAPL filter/sort/pagination, SPOT `latest10K: null`, JPM `latest10K: 2026-02-13`, unknown ticker 404 (and listed in `errors[]` in the summary), `pageSize=500` → 400. NOTES.md: step 3 ticked, SPOT/20-F note added.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 8. shadcn, Typography and API client (2026-10-12)

**Prompt** (PROMPTS.md step 4, run in plan mode)

> Read docs/REQUIREMENTS.md (UI system) and docs/IMPLEMENTATION_PLAN.md (phase 4). In apps/web: init shadcn/ui and add table, select, badge, button, input, card, popover, command. Build components/ui/typography.tsx in shadcn style with cva: props as (tag), variant (h1–h4, p, lead, small, muted, code — sets the default tag and styles), and size, color, weight (override the variant). Add lib/api.ts: a server-only Eden treaty client typed with App from the server workspace ("server": "workspace:\*"), base URL from API_URL, cache: 'no-store'. Add an app layout with nav (Filings, Summary). Done when: a page shows the Typography variants, the home page renders data from /health via Eden, and typecheck passes.

**Output summary**

- shadcn init (radix base, Nova preset, neutral) and the requested components; `command` also pulled in `dialog`, `input-group`, `textarea`. shadcn now uses its own `cn` package in place of clsx + tailwind-merge.
- `components/ui/typography.tsx`: one `cva` with `variant` / `size` / `color` / `weight`; overrides come later in the class string so tailwind-merge lets them win. Default tag per variant, `as` overrides it.
- `lib/api.ts`: `server-only` Eden treaty client, `API_URL` (default `http://localhost:3001`, `.env.example` added), `fetch: { cache: 'no-store' }`.
- Layout with nav (Filings → `/companies/AAPL`, Summary → `/summary`; both 404 until steps 5–6). Home renders `/health` inside `<Suspense>` (required by `cacheComponents`) with an error state. A `/typography` showcase page was used to check the variants, then removed (not needed for the app).
- Typecheck fixes: web moved to TypeScript 7 so only one `elysia` copy resolves (D-25); server `onError` now uses `status()` so error bodies stay out of success types (D-26).
- Verified: `bun run check`, `next build` (`/` partial prerender), home shows `ok` with the API up and the error state with it down; 400/404 responses unchanged.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 9. Follow-ups: time log, dev script (2026-10-12)

**Prompts**

> Kill the background shell and give me information on where it is so next time I can kill it with the process manager. I removed the typography page as well because is not necesary for this work but it was nice to see it. I am noticing in the notes.md the time log is not being updated

> commit this, but the process you kill is giving me problems when running bun dev I get the following log [`web dev $ next dev --port 3000 └─ Waiting for 1 other script(s)`] The other script I don't know what it is. http://localhost:3000 is giving me unable to connect

**Output summary**

- The background server had already exited. Its process: `bun --watch src/index.ts` in `apps/server`, port 3001.
- NOTES.md Time log filled from commit timestamps; the PROMPTS.md housekeeping block now includes updating it. Entry 8 updated for the removed `/typography` page.
- `bun dev` hang: web now depends on `server` (`workspace:*`), so `bun run --filter` ran the scripts in dependency order and waited for the never-ending server `dev`. Root `dev` is now `bun run --parallel --filter '*' dev`. Verified both apps start.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 10. Filings page, filters, company search (2026-10-12)

**Prompt** (PROMPTS.md step 5, run in plan mode)

> Read docs/REQUIREMENTS.md (FE-1) and docs/IMPLEMENTATION_PLAN.md (phase 4). shadcn, Typography and the Eden client already exist in apps/web. Build app/companies/[ticker]/page.tsx as a server component that reads form, sort and page from search params and renders a filings table (form badge, filing date, report date, description, link to sec.gov in a new tab) with pagination. Add a client filters.tsx (form multi-select from the forms list, sort toggle) that updates the URL with router.replace, and a company-switcher.tsx that searches tickers via a server action and navigates. / redirects to /companies/AAPL. Include loading, empty, error and unknown-ticker states. Done when: in the browser I can switch between AAPL, SPOT and JPM, filter by form, sort and paginate, and the URL reflects the state.

**Plan feedback**

> No, I would like the app/page.tsx to have a search box in the middle of the page with a fuzzy search between company name and ticker, the user can use to search for their company. When the user press enter it should go to the company/[ticker]/page.tsx. If there is no ticker to select then the user should remain in the app/page.tsx

**Output summary**

- Server: `searchTickers` now uses a pure `rankCompanies` with fuzzy matching. The tiers are exact ticker, ticker prefix, name word-prefix, name substring, then subsequence (`jpmc` → JPM). Matching ignores case and punctuation. There is one result per CIK (JPM, not JPM-PC/VYLD), and ties go to SEC list order, which is roughly market cap. `tickers.test.ts` added (D-28).
- `/` is a centered search page instead of the redirect (D-27). `components/company-search.tsx` is an inline cmdk box that calls the `searchCompanies` server action (`app/actions.ts`). Enter or a click opens `/companies/[ticker]`. Enter with no results does nothing. The same component is the switcher in the filings header.
- `app/companies/[ticker]/`:
  - `page.tsx`: RSC with the table and Prev/Next pagination links, plus unknown-ticker, error and empty states.
  - `loading.tsx`.
  - `filters.tsx`: forms multi-select with counts and Clear, plus the sort toggle. It calls `router.replace` in a transition (dims the table while pending) and resets to page 1.
  - `params.ts` + test: parse and validate search params and build hrefs.
- Fix: Eden parsed `"2025-10-31"` strings into `Date` objects at runtime (React crashed on the table), so `lib/api.ts` sets `parseDate: false`.
- Verified: `bun run check`, `next build`, and curl of the search API and of the AAPL/SPOT/JPM/ZZZZ pages (rows, pagination, unknown-ticker and empty states). The interactive browser walkthrough was not run by the agent because no browser tools were available.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 11. Debounce, no top nav, documents in a dialog (2026-10-12)

**Prompt**

> add a debounce to the company search and remove the navigation items on the top. Also I am don't like the idea the user navigates out of the site to see the document can we render it in a dialog where the user can click on a button if they want to go to the document itself or close the dialog.

**Output summary**

- `company-search.tsx`: 200 ms debounce (the timer is cleared on unmount). It shows "Searching…" until results arrive, which removes the "No matching company" flash.
- Layout: the Filings/Summary nav links are gone and only the home title link remains.
- sec.gov sends `X-Frame-Options: SAMEORIGIN`, so it can't be framed directly. Added a document proxy (D-30):
  - Server `GET /documents?url=` accepts only `https://www.sec.gov/Archives/edgar/data/<cik>/<accession>/<file>` (no `..`, no query string) and caches documents for 7 days. `fetchText` shares the throttle and User-Agent with `fetchJson`. Test added for rejected URLs.
  - Web route handler `app/documents/route.ts` serves the document as HTML with a `<base>` pointing at sec.gov (images, links in a new tab) and a `CSP: sandbox` header.
  - `document-dialog.tsx`: the "View" button opens a wide dialog with a sandboxed iframe, a loading state, and "Close" / "Open on sec.gov" buttons.
- Verified: `bun run check` (27 tests), `next build`, and curl of `/documents` (AAPL 10-K, 1.5 MB: 0.2 s cold, 13 ms cached; a non-sec.gov URL returns 400). The dialog itself was not clicked through in a browser by the agent.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 12. Summary page (2026-10-12)

**Prompt**

> Read docs/REQUIREMENTS.md (FE-2, BE-4) and docs/IMPLEMENTATION_PLAN.md (phase 5). Build app/summary/page.tsx: a server component that reads tickers from search params (default AAPL,SPOT,JPM), calls /filings/summary and renders a comparison table — companies as rows, the most common form types as columns, and the latest 10-K date, with a note when a company has no 10-K (e.g. 20-F filers). Add a client control to add/remove tickers (reuse the company switcher search) that updates the URL. Show per-ticker errors inline. Done when: the page shows AAPL, SPOT and JPM correctly and adding/removing a ticker works.

**Output summary**

- `app/summary/page.tsx` (RSC): reads `?tickers=` (defaults to AAPL,SPOT,JPM only when the param is absent, so removing every ticker shows an empty state). Builds a table with one row per ticker in URL order, the top 8 form types as columns (last 12 months), and the latest 10-K date. A missing 10-K shows "No 10-K · files 20-F" with a footnote. Unknown tickers become an inline error row.
- `app/summary/params.ts` (+ test): `parseTickers`, `summaryHref` and `topForms`. Forms are ranked by how many companies file them, then by total count, because ranking by raw totals let JPM's ~22k 424B2 prospectuses fill every column.
- `app/summary/ticker-picker.tsx`: removable ticker badges plus `CompanySearch`, which updates the URL via `router.push`.
- `company-search.tsx`: optional `onSelect` prop (the default still navigates to the company page).
- `app/summary/loading.tsx`, plus a "Compare companies →" link on the home page.
- Verified: `bun run check` (31 tests), plus curl of the rendered `/summary`, `?tickers=…,ZZZZ`, `?tickers=…,MSFT` and `?tickers=`. The add/remove clicks were not exercised in a browser by the agent.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 13. Remove in table, sortable columns with TanStack Table (2026-10-12)

**Prompt**

> The removal of a ticker should be in the table itself. I would like to be able to sort on each table based one latest 10-k or number of specific forms. I think using something like tanstack table is an overkill but is worth adding it here.

**Output summary**

- Added `@tanstack/react-table` 9.3.1 to `apps/web` (v9 API: `useTable`, `tableFeatures({ rowSortingFeature, sortedRowModel })`) (D-32).
- New client `app/summary/summary-table.tsx`. Each form column and Latest 10-K has a sort button in its header (↑/↓ icon, `aria-sort`); the first click sorts descending and the third clears the sort. Error rows and companies without a 10-K always sort last. Every row, including error rows, has an ✕ remove button that updates `?tickers=`.
- `page.tsx` now builds rows in URL order (companies plus errors) and renders `SummaryTable`. `ticker-picker.tsx` is now only the add search.
- Verified: `bun run check` (31 tests), SSR of `/summary?tickers=AAPL,SPOT,JPM,ZZZZ` via curl, and a scratch `useTable` render that checked sort order in both directions (JPM,AAPL,SPOT,ZZZZ desc / SPOT,AAPL,JPM,ZZZZ asc on 8-K). The agent did not click through in a browser.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only); TanStack's bundled `getting-started` / `table-features` skill docs were read from `node_modules`.

## 14. Sort by company, fix search typed before hydration (2026-10-12)

**Prompt**

> It would be good to be able to sort by company. And I noticed a bug where there are times the ticker search box does not search when reloading the page. I don't see any api calls being made either

**Output summary**

- Bug was reproduced with Playwright by delaying `/_next/static` JS 3 s and typing right away. Text typed before React hydrates stays in the DOM input, but `onValueChange` never fires, so the debounced search never runs and no server action is POSTed until another key is pressed. This is most likely on a reload in dev, when chunks compile or load slowly.
- Fix (`company-search.tsx`, shared by every page): a ref on `CommandInput`. On mount, any value already in the DOM is passed to `search()`. Re-ran the repro: 10 options, 1 POST.
- `summary-table.tsx`: Company is now a sortable accessor (name, `text` sort, A→Z first, error rows last).
- Verified in headless Chromium: Company, 8-K and Latest 10-K each sort asc/desc and clear back to URL order, `aria-sort` updates, ✕ removes ZZZZ then SPOT (URL updates), and adding MSFT via search works. `bun run check` passes (31 tests).

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 15. No default companies on the summary page, commit (2026-10-12)

**Prompt**

> remove the default companies from the summary and commit these changes

**Output summary**

- `parseTickers` no longer falls back to AAPL,SPOT,JPM. `/summary` starts empty ("Add a company to compare.") and companies are added via the search. Test updated.
- Committed the summary page work (prompts 12–15) as one `feat(web)` commit.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 16. Hydration, form search, page jump, recent searches, summary nav and memory (2026-10-12)

**Prompt**

> Ok a few things I would like you to take a look
>
> 1. There is a hydration issue with the ticker input box (mainly on first render)
> 2. The form filter is not good I would like to be able to search for an specific form in the select field
> 3. In companies ticker I would like to be able to navigate to a specific page
> 4. I would like to store and display the 6 most recent searches in the home page
> 5. Add summary as a navigation item (I was wrong to remove that one)
> 6. When I go to the summary page I should be able to see the last selected companies there
>
> Also I would like you to configure shadcn with this preset b2C8SQI9Q

**Output summary**

- Hydration: no mismatch in clean headless Chromium, even when typing before hydration. Treated as browser-extension attributes, so the input gets `suppressHydrationWarning` and `autoComplete="off"` (D-35).
- Form filter: `CommandInput` + `CommandEmpty` in the filters popover; cmdk filters by form name.
- Pagination: a plain GET form with a page number input and "Go" that keeps the form and sort filters.
- Recent searches: `rememberCompany` server action plus a `recent` cookie (`app/recent.ts`, tested). Home lists the six newest in a Suspense boundary (D-33).
- Header nav gets a "Summary" link. The home "Compare companies →" link was removed. `src/proxy.ts` saves and restores the last `/summary` tickers (D-34).
- shadcn preset: `bunx shadcn apply b2C8SQI9Q` was blocked by the permission classifier (it pulls remote registry code). Left for the user to run.
- Verified with Playwright: 7 selections leave 6 recents, typing "10-" shows 10-Q/10-K, Go goes to `?sort=asc&page=3`, Summary nav restores AAPL,MSFT, and there are no console errors. `bun run check` passes (33 tests).

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 17. Proton Pass hydration mismatch, API availability gate (2026-10-12)

**Prompt**

> Done i did the shadcn apply.
>
> Here is the error I am getting
>
> (pasted Next.js overlay: hydration mismatch, `<main>` has `data-protonpass-form=""` on the client, `src/app/layout.tsx:41`)
>
> I think the issue with search box is the server is taking a long time to load and that is why I get no responses. It would be good for the page not to load unless the server is available. Something like an error message

**Output summary**

- Preset `b2C8SQI9Q` (radix-maia, mist, Inter) applied by the user. Prettier fixed its formatting and the unused `Geist` import was dropped. `typography.tsx` was not affected.
- Hydration: the cause was the Proton Pass extension tagging `<main>`. Added `suppressHydrationWarning` to `<main>` (D-35, updated).
- New `components/api-gate.tsx`: the layout checks `/health` (2 s timeout) and shows an error page when the API is down. The server warms the ticker list at startup. `searchCompanies` returns `null` on failure and the search shows "Search is unavailable" (D-36).
- Verified: e2e flows pass with no console errors. Pausing the API process (SIGSTOP) shows the error page after about 3 s, and resuming restores it. `bun run check` passes (33 tests).

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 18. Commit (2026-10-12)

**Prompt**

> commit these changes

**Output summary**

- Two commits: `chore(web): apply shadcn preset b2C8SQI9Q` (preset files only), then `feat(web)` for prompts 16–17 (features, API gate, docs).

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 19. Search box styling (2026-10-12)

**Prompt**

> I really dislike the box around the ticker search box can you make some visual improvements?

**Output summary**

- `apps/web/src/components/company-search.tsx`: removed the outer bordered/padded popover card around the search input so only the pill shows; input is 40px tall on the page background with a light shadow; results dropdown sits a bit lower with rounder corners and a stronger shadow. Applies to home, company and summary pages.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 20. Commit (2026-10-12)

**Prompt**

> commit this

**Output summary**

- One commit: `style(web): drop the box around the company search input` (prompt 19).

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 21. Submission polish (2026-10-12)

**Prompt**

> Read docs/REQUIREMENTS.md (Constraints) and NOTES.md. Write README.md: what it is, prerequisites (Bun version), setup (bun install, .env from .env.example with SEC_USER_AGENT), bun run dev, URLs, curl examples for each endpoint, how to run tests, project layout, and links to NOTES.md, docs/DECISIONS.md and docs/prompt-log.md. Verify by following the README in a fresh clone of the repo in a temp dir. Finish NOTES.md: final status and what's missing and how I'd finish it (e.g. older filings from filings.files[], Redis cache, charts, e2e tests). Make sure docs/prompt-log.md and docs/DECISIONS.md are complete and consistent. Done when: a fresh clone runs from the README alone.

**Output summary**

- New root `README.md`: what it is, Bun ≥ 1.4.3, setup, `bun run dev`, URLs, curl examples for `/health`, `/companies/search`, `/companies/:ticker/filings`, `/filings/summary`, `/documents` and a 404, tests/checks, project layout, doc links.
- Removed the create-next-app boilerplate `apps/web/README.md` (it told people to use npm/yarn).
- Verified in a fresh `git clone` in a temp dir: `bun install`, `.env` from the example, `bun run dev`. Every curl worked (SPOT `latest10K: null`, unknown ticker → 404), all pages returned 200 for AAPL/SPOT/JPM, and `bun run check` passed (33 tests). The README's document example now uses a URL taken from a real response, and it names the `url` field.
- `NOTES.md`: step 7 ticked, final status, an expanded "What's missing & how I'd finish it" (older filings from `filings.files[]`, Redis, document LRU, charts, e2e + CI, deploy path), time log for steps 6–7.
- Consistency: D-01–D-36 are sequential, every `#N` source exists, and the `superpowers` row was added to the tools table.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 22. Commit (2026-10-12)

**Prompt**

> (answered in prompt 21's plan: "Yes, one docs commit")

**Output summary**

- One commit: `docs: add readme and finish submission notes` (prompt 21).

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 23. Extension: older filings (2026-10-12)

**Prompt**

> Read NOTES.md "What's missing" and docs/DECISIONS.md. Pick the extension that adds the most value (suggested: load older filings from filings.files[] lazily, or a chart on the summary page) and propose a plan.

**Output summary**

- Picked older filings over a chart: without them the totals, form counts, oldest-first sorting and form filters are silently wrong for any company with a long history (AAPL: 1,001 of 2,265 filings).
- Server: `getSubmissions` (cache key `submissions:v2:`, keeps `files[]`), `getOlderFilings` (each file cached 30 days), `olderSummary`, and `history=all` on `GET /companies/:ticker/filings`, which returns `older: { count, from } | null`. The summary route uses `getSubmissions`.
- Web: `history` in `FilingsParams`/`filingsHref`, a "Load N older filings (since YYYY)" link on the filings page, and `history` kept by the filters and the page-jump form.
- Tests for `olderSummary` and the `history` param (35 pass). Checked live: AAPL goes back to 1994, JPM has 168,762 filings (about 7 s cold), the summary is unchanged.
- D-37; NOTES step 8 ticked.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 24. Commit (2026-10-12)

**Prompt**

> Commit it as separate server and web commits

**Output summary**

- `feat(server): load older filings from filings.files[] on request` (API, cache, tests).
- `feat(web): add a link to load older filings` (filings page, params, tests, plus the docs for prompt 23).

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 25. Slow first load in dev (2026-10-13)

**Prompt**

> I've noticed next js takes a few seconds to load its devtools when first running this also affects the search box can you take a look at it?

> I would like you to simply document this issue so the reviewer knows

**Output summary**

- Measured in headless Chromium against the running dev servers. Warm loads hydrate in about 200 ms and the API answers in milliseconds. The wait is Turbopack compiling the route and its dev bundles on the first request after `next dev` starts. The search box waits for hydration too, and text typed before hydration is kept.
- Proposed warming `/` when `next dev` starts. The user chose to document it instead.
- `NOTES.md`: "Slow first load in dev" bullet under what's missing. `README.md`: one-line note under Run.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 26. Commit and alternatives (2026-10-13)

**Prompt**

> commit it, are there other alternatives on how to fix this?

**Output summary**

- Committed `docs: note the slow first load in dev`. Moved an untracked `pnpm-lock.yaml` out of the repo because it failed the pre-commit format check.
- Alternatives: load `/` once when `next dev` starts (recommended), run from a production build, a search form that works without JavaScript, or hiding the devtools badge (doesn't fix the search box).

## 27. Password-manager hydration mismatch (2026-10-13)

**Prompt**

> I just found this issue can we disable the use of extensions in the input fields and forms?
>
> (pasted hydration-mismatch error: `data-protonpass-form=""` on the `/summary` page's `div` in `SummaryPage`)

**Output summary**

- A page can't disable extensions, but it can ask them to skip fields. `CompanySearch` is now wrapped in a `<form role="search">` with `suppressHydrationWarning`, and its input has opt-out attributes for Proton Pass, 1Password, LastPass and Bitwarden. The filings page-jump form got the same flag (D-38).
- Checked in headless Chromium: Enter still selects a result on `/` and `/summary`, and there are no console errors. Not tested with Proton Pass installed.

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).

## 28. Commit (2026-10-13)

**Prompt**

> commit it

**Output summary**

- `fix(web): opt the search out of password managers` (search form, page-jump form, D-38, prompt log 26–28).

**Plugins/skills used:** `ponytail` and `superpowers` session hooks (context only).
