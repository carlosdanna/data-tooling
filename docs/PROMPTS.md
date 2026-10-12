# Implementation prompts

Prompts that carry out [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), one step at a time.

## How to use

1. Start a **new Claude Code session** (no memory of earlier steps) and switch to **plan mode**.
2. Paste the next prompt **including the housekeeping block** below it.
3. Review the plan, adjust, approve.
4. Check the "Done when" yourself before moving to the next prompt.

`CLAUDE.md` loads automatically; each prompt names the other docs it needs.

### Housekeeping block (append to every prompt)

> When done: run lint, format check, typecheck and tests; append an entry to docs/prompt-log.md (verbatim prompt, output summary, plugins/skills used — add any new ones to the "Tools & plugins used" table); tick the step in NOTES.md Status, add the step's time to the NOTES.md Time log, and record deferred items there; append any new decision to docs/DECISIONS.md (next D-NN, with why and alternatives); commit with a Conventional Commit message.

---

## 1. Scaffold the monorepo

> Read docs/REQUIREMENTS.md and docs/IMPLEMENTATION_PLAN.md (phase 1). Scaffold the Bun workspaces monorepo: root package.json (workspaces `apps/*`, scripts dev/lint/format/typecheck/test), tsconfig.base.json (strict), .oxlintrc.json, .prettierrc/.prettierignore. Create `apps/server` as an Elysia app with a pino logger (pino-pretty in dev), env.ts validating PORT and SEC_USER_AGENT, a `.env.example`, a `GET /health` route, and `export type App`. Create `apps/web` with create-next-app (TypeScript, Tailwind, App Router, src dir, Bun, no ESLint — we use oxlint) on port 3000; server on 3001. `bun run dev` at the root must start both. Fill in the Commands section of CLAUDE.md. Done when: `bun run dev` serves both apps, `curl localhost:3001/health` works, lint/format/typecheck pass.

## 2. Cache and EDGAR client

> Read docs/REQUIREMENTS.md (BE-1, BE-2, EDGAR usage rules, Caching) and docs/IMPLEMENTATION_PLAN.md (phase 2). In apps/server implement: `cache.ts` (getOrSet with an in-memory Map in front of bun:sqlite at `.cache/edgar.sqlite`, TTL, in-flight dedupe, serve stale on loader failure), `edgar/client.ts` (fetchJson with User-Agent from env, ≥100ms spacing between calls, non-2xx → UpstreamError), `edgar/tickers.ts` (ticker map with 24h TTL, resolveTicker → NotFoundError, searchTickers), `edgar/submissions.ts` (getFilings(cik) with 1h TTL, transposing filings.recent into Filing objects with the sec.gov URL). Save a trimmed real AAPL submissions JSON as a test fixture. Write bun tests for the transform and the cache (TTL expiry, dedupe). No routes yet. Done when: `bun test` passes and a one-off script resolves AAPL, SPOT and JPM to filings.

## 3. API routes

> Read docs/REQUIREMENTS.md (BE-3, BE-4, Errors) and docs/IMPLEMENTATION_PLAN.md (phase 3). The EDGAR client and cache already exist in apps/server/src. Implement pure functions in `filings.ts`: queryFilings (form filter, repeatable or CSV; sort asc/desc by filingDate; page/pageSize with bounds; plus the distinct `forms` with counts) and summarize (per-form counts over a rolling 12 months from an injected `now`, latest 10-K date or null). Add routes `GET /companies/search?q=`, `GET /companies/:ticker/filings` and `GET /filings/summary?tickers=` with Elysia `t` validation, Promise.allSettled for the summary (per-ticker errors), and an onError mapper to `{ error: { code, message } }` with 400/404/502. Unit-test queryFilings and summarize. Done when: tests pass and curl returns correct data for AAPL, SPOT (latest10K null) and JPM, plus 404 for an unknown ticker.

## 4. shadcn, Typography and API client

> Read docs/REQUIREMENTS.md (UI system) and docs/IMPLEMENTATION_PLAN.md (phase 4). In apps/web: init shadcn/ui and add table, select, badge, button, input, card, popover, command. Build `components/ui/typography.tsx` in shadcn style with cva: props `as` (tag), `variant` (h1–h4, p, lead, small, muted, code — sets the default tag and styles), and `size`, `color`, `weight` (override the variant). Add `lib/api.ts`: a server-only Eden treaty client typed with `App` from the server workspace (`"server": "workspace:*"`), base URL from API_URL, `cache: 'no-store'`. Add an app layout with nav (Filings, Summary). Done when: a page shows the Typography variants, the home page renders data from `/health` via Eden, and typecheck passes.

## 5. Filings page

> Read docs/REQUIREMENTS.md (FE-1) and docs/IMPLEMENTATION_PLAN.md (phase 4). shadcn, Typography and the Eden client already exist in apps/web. Build `app/companies/[ticker]/page.tsx` as a server component that reads `form`, `sort` and `page` from search params and renders a filings table (form badge, filing date, report date, description, link to sec.gov in a new tab) with pagination. Add a client `filters.tsx` (form multi-select from the `forms` list, sort toggle) that updates the URL with router.replace, and a `company-switcher.tsx` that searches tickers via a server action and navigates. `/` redirects to `/companies/AAPL`. Include loading, empty, error and unknown-ticker states. Done when: in the browser I can switch between AAPL, SPOT and JPM, filter by form, sort and paginate, and the URL reflects the state.

## 6. Summary page

> Read docs/REQUIREMENTS.md (FE-2, BE-4) and docs/IMPLEMENTATION_PLAN.md (phase 5). Build `app/summary/page.tsx`: a server component that reads `tickers` from search params (default AAPL,SPOT,JPM), calls `/filings/summary` and renders a comparison table — companies as rows, the most common form types as columns, and the latest 10-K date, with a note when a company has no 10-K (e.g. 20-F filers). Add a client control to add/remove tickers (reuse the company switcher search) that updates the URL. Show per-ticker errors inline. Done when: the page shows AAPL, SPOT and JPM correctly and adding/removing a ticker works.

## 7. Submission polish

> Read docs/REQUIREMENTS.md (Constraints) and NOTES.md. Write README.md: what it is, prerequisites (Bun version), setup (`bun install`, `.env` from `.env.example` with SEC_USER_AGENT), `bun run dev`, URLs, curl examples for each endpoint, how to run tests, project layout, and links to NOTES.md, docs/DECISIONS.md and docs/prompt-log.md. Verify by following the README in a fresh clone of the repo in a temp dir. Finish NOTES.md: final status and what's missing and how I'd finish it (e.g. older filings from filings.files[], Redis cache, charts, e2e tests). Make sure docs/prompt-log.md and docs/DECISIONS.md are complete and consistent. Done when: a fresh clone runs from the README alone.

## 8. Extension (optional)

> Read NOTES.md "What's missing" and docs/DECISIONS.md. Pick the extension that adds the most value (suggested: load older filings from `filings.files[]` lazily, or a chart on the summary page) and propose a plan.
