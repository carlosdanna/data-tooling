# Decisions

Every decision made while building this project. New ones are appended with the next `D-NN`. **Source** points to the entry in [prompt-log.md](prompt-log.md) where it was made.

## Stack

### D-01 — Bun workspaces monorepo

- **Decision:** One repo with `apps/server` (API) and `apps/web` (frontend) as Bun workspaces.
- **Why:** One install, and the web app can import the server's types directly.
- **Alternatives:** Two separate repos.
- **Date / Source:** 2026-10-12 · #1

### D-02 — Bun as runtime and package manager

- **Decision:** Bun for running, installing, testing (`bun test`) and the SQLite cache (`bun:sqlite`).
- **Why:** Quartr's stack; fast; test runner and SQLite built in.
- **Alternatives:** Node + pnpm.
- **Date / Source:** 2026-10-12 · #1

### D-03 — Elysia for the API

- **Decision:** Elysia on Bun.
- **Why:** Quartr's stack; typed routes and built-in validation (`t`).
- **Alternatives:** Hono, bare `Bun.serve`.
- **Date / Source:** 2026-10-12 · #1

### D-04 — Next.js App Router for the React frontend

- **Decision:** Next.js with server components.
- **Why:** Data fetching stays on the server; routing and layouts out of the box.
- **Alternatives:** Vite + React (lighter, but needs a client data layer and CORS).
- **Date / Source:** 2026-10-12 · #1

### D-05 — shadcn/ui with a custom Typography component

- **Decision:** shadcn/ui components plus a cva-based `Typography` with `as`, `variant`, `size`, `color`, `weight`.
- **Why:** Components live in the repo and can be changed; one consistent way to style text.
- **Alternatives:** Raw Tailwind classes on every text element.
- **Date / Source:** 2026-10-12 · #1

### D-06 — pino for logging

- **Decision:** pino, with pino-pretty in development.
- **Why:** Fast structured JSON logs.
- **Alternatives:** consola, LogTape.
- **Date / Source:** 2026-10-12 · #1

### D-07 — oxlint, prettier, TypeScript strict

- **Decision:** oxlint for linting, prettier for formatting, `strict: true`, no `any`.
- **Why:** User choice; oxlint is very fast.
- **Alternatives:** ESLint.
- **Date / Source:** 2026-10-12 · #1

## Architecture

### D-08 — Eden treaty client typed from the server

- **Decision:** The web app calls the API through Eden treaty using the server's exported `App` type.
- **Why:** The API contract has one source of truth; no duplicated DTOs.
- **Alternatives:** A shared types package, or OpenAPI codegen.
- **Date / Source:** 2026-10-12 · #3

### D-09 — Browser → Next.js server components → Elysia; UI state in the URL

- **Decision:** The browser never calls the API directly. Client components only change URL search params.
- **Why:** No CORS, no client data-fetching library, shareable URLs.
- **Alternatives:** Client-side fetching with TanStack Query.
- **Date / Source:** 2026-10-12 · #3

### D-10 — One cache layer, in the server

- **Decision:** Only the Elysia server caches; Next.js fetches with `cache: 'no-store'`.
- **Why:** Two caches could disagree and are harder to reason about.
- **Alternatives:** Next.js fetch cache on top of the server cache.
- **Date / Source:** 2026-10-12 · #3

## Caching & EDGAR

### D-11 — In-memory cache in front of `bun:sqlite`

- **Decision:** Memory map with TTL, backed by a SQLite file (`apps/server/.cache/edgar.sqlite`, gitignored).
- **Why:** Reviewers need no extra infrastructure, and the cache survives restarts.
- **Alternatives:** Redis (more realistic, the production choice for multiple instances); memory only (lost on restart).
- **Date / Source:** 2026-10-12 · #1

### D-12 — What and how long to cache

- **Decision:** Cache the cleaned-up `Filing[]` per company, not SEC's raw JSON. Ticker list 24h, filings 1h. Simultaneous requests for the same key share one call. If SEC fails and an expired entry exists, serve it.
- **Why:** Smaller entries, fewer SEC calls, keeps working when SEC is down.
- **Alternatives:** Cache raw responses.
- **Date / Source:** 2026-10-12 · #3

### D-13 — Follow SEC fair-access rules

- **Decision:** Every request sends `User-Agent` from `SEC_USER_AGENT`; outgoing calls spaced at least 100ms apart.
- **Why:** SEC returns 403 without a User-Agent and limits clients to 10 requests per second.
- **Date / Source:** 2026-10-12 · #3

### D-14 — Defer older filings

- **Decision:** Use only `filings.recent` (latest ~1000 filings); skip the extra files in `filings.files[]` for now.
- **Why:** Not needed for the 12-month summary; good extension candidate.
- **Alternatives:** Load all files up front, or lazily when paging past the recent set.
- **Date / Source:** 2026-10-12 · #3

## API

### D-15 — API contract

- **Decision:** Filings take `page`, `pageSize`, `form` (repeatable or CSV) and `sort`. The response also lists the form types the company files. Errors are `{ error: { code, message } }` with 400 / 404 / 502.
- **Why:** Predictable for the client; the UI filter only offers forms that exist.
- **Date / Source:** 2026-10-12 · #3

### D-16 — Summary rules

- **Decision:** Counts over a rolling 12 months from today. `latest10K` matches `10-K` exactly, so 20-F filers like Spotify get `null`. Each ticker is fetched independently; a failing ticker goes into `errors[]`.
- **Why:** Follows the spec literally; one bad ticker doesn't fail the whole request.
- **Alternatives:** Treat 20-F as the annual-report equivalent.
- **Date / Source:** 2026-10-12 · #3

## Process

### D-17 — Conventional Commits

- **Decision:** `<type>(<scope>): <summary>` with scopes `server`, `web`, `repo`, `docs`.
- **Why:** Readable history for reviewers.
- **Date / Source:** 2026-10-12 · #2

### D-18 — Curated prompt log

- **Decision:** `docs/prompt-log.md` with each prompt verbatim and a summary of the output, plus a table of the tools and plugins actually used. Raw transcripts exported at the end as backup.
- **Why:** The assignment requires a prompt log reviewers can follow.
- **Alternatives:** Raw transcripts only.
- **Date / Source:** 2026-10-12 · #1, #3

### D-19 — No time estimates in the build plan

- **Decision:** The build order lists phases and "done when" checks, no durations.
- **Why:** Estimates were unrealistic; Claude works much faster.
- **Date / Source:** 2026-10-12 · #3

### D-20 — One prompt per fresh session, in plan mode

- **Decision:** Development follows [PROMPTS.md](PROMPTS.md): each step runs in a new Claude Code session in plan mode, and ends by updating the prompt log, NOTES.md and this file, then committing.
- **Why:** Small reviewable steps and a traceable log.
- **Date / Source:** 2026-10-12 · #4

### D-21 — Plain git pre-commit hook

- **Decision:** `.githooks/pre-commit` runs `bun run check` (lint, format check, typecheck, tests). The root `prepare` script sets `git config core.hooksPath .githooks`, so `bun install` enables it on a fresh clone.
- **Why:** Broken code can't be committed, with no extra dependency.
- **Alternatives:** husky, lefthook, lint-staged (only checks staged files, but typecheck and tests need the whole project anyway).
- **Date / Source:** 2026-10-12 · #5

### D-22 — `bun run --filter` to run both apps

- **Decision:** Root `dev` and `typecheck` use `bun run --filter '*' <script>`, which runs each workspace's script in parallel.
- **Why:** Built into Bun; no task runner needed for two apps.
- **Alternatives:** concurrently, Turborepo.
- **Date / Source:** 2026-10-12 · #5

### D-23 — Ticker map cached as a keyed object; simple ranked search

- **Decision:** `company_tickers.json` is cached as `Record<TICKER, { ticker, cik, name }>` (CIK zero-padded to 10 digits). `searchTickers` returns ticker-prefix matches first, then company-name matches.
- **Why:** Stays JSON-serialisable for the SQLite layer and gives O(1) `resolveTicker`; ~10k entries make a linear search scan cheap.
- **Alternatives:** An array plus a rebuilt index; fuzzy search (e.g. Fuse.js).
- **Date / Source:** 2026-10-12 · #6

### D-24 — `filings.recent` can be large; cache it as-is

- **Decision:** Keep caching the full normalised `filings.recent` per CIK. It covers the last year or 1000 filings, whichever is more, so JPM returns ~26k rows (mostly 424B2), about 7.5 MB of JSON. Expired rows stay in SQLite so they can be served stale; they are never pruned.
- **Why:** Still fast to filter in memory; correcting D-14's "~1000" assumption.
- **Alternatives:** Store only the columns the API needs per form, or paginate in SQL.
- **Date / Source:** 2026-10-12 · #6

### D-25 — One TypeScript version (7) across workspaces

- **Decision:** `apps/web` uses `typescript@^7`, like the root and server. The server exposes `"exports": { ".": "./src/index.ts" }` so the web imports `type App` from `server`.
- **Why:** `elysia` has `typescript` as a peer, so web on TS 5 and server on TS 7 installed two `elysia` copies and Eden rejected `App` ("separate declarations of a private property"). Next 16.4 supports TS 7 by running the project `tsc` CLI.
- **Alternatives:** Pin the server to TS 5; map `elysia` to one copy with tsconfig `paths`.
- **Date / Source:** 2026-10-12 · #8

### D-26 — Error responses via `status()` in `onError`

- **Decision:** `onError` returns `status(code, { error })` instead of setting `set.status` and returning the body.
- **Why:** A plain return is merged into every route's success type, so Eden's `data` became `T | { error }` everywhere. `status()` types it as an error response; `data` stays `T` and `error.value` carries the body.
- **Alternatives:** Narrow `data` in every page.
- **Date / Source:** 2026-10-12 · #8

### D-27 — Home page is a company search, not a redirect

- **Decision:** `/` shows a centered fuzzy search box. Enter opens `/companies/[ticker]` for the highlighted result and does nothing when there are no results. The same `CompanySearch` component is the switcher on the filings page.
- **Why:** User feedback on the step 5 plan: the search box is a better entry point than landing on AAPL.
- **Alternatives:** Redirect `/` to `/companies/AAPL` (original plan).
- **Date / Source:** 2026-10-12 · #10

### D-28 — Fuzzy ticker search ranked on the server, no library

- **Decision:** `rankCompanies` scores tiers (exact ticker, ticker prefix, name word-prefix, name substring, subsequence) and returns one result per CIK. Ties go to the order of SEC's ticker list (roughly market cap). The web calls it through a server action, with no debounce.
- **Why:** About 10k companies take one in-memory pass per keystroke. The ticker map stays on the server. A dependency isn't worth a few lines.
- **Alternatives:** fuse.js; shipping the ticker list to the client; a debounce (add it if search gets slow).
- **Date / Source:** 2026-10-12 · #10

### D-29 — Filters take URL state as props; Eden `parseDate: false`

- **Decision:** The page parses search params once (`parseFilingsParams`) and passes them to the client `Filters`, which writes back with `router.replace`. The Eden client disables date parsing.
- **Why:** There is one parser, so the filters need no `useSearchParams` and no extra Suspense boundary. Eden turned ISO date strings into `Date` objects that the types still call `string`.
- **Alternatives:** `useSearchParams` in `Filters`; formatting `Date` objects in the table.
- **Date / Source:** 2026-10-12 · #10

### D-30 — Filing documents open in a dialog through a proxy

- **Decision:** "View" opens a dialog with a sandboxed iframe of `/documents?url=` (a Next route handler). The handler gets the document from the API's `GET /documents`, which only accepts sec.gov filing-archive URLs and caches documents for 7 days. The dialog has "Open on sec.gov" and "Close".
- **Why:** The user wants to stay on the site. sec.gov forbids framing (`X-Frame-Options: SAMEORIGIN`), so the document has to come from our origin. The URL allow-list stops the proxy from fetching arbitrary URLs. The `CSP: sandbox` header and the iframe `sandbox` attribute stop filing scripts from running on our origin.
- **Alternatives:** Link to sec.gov in a new tab (previous); `srcDoc` through a server action; rendering only XBRL facts.
- **Date / Source:** 2026-10-12 · #11

### D-31 — Debounce company search (200 ms)

- **Decision:** `CompanySearch` waits 200 ms after the last keystroke before calling the server action. This replaces the no-debounce shortcut in D-28.
- **Why:** User request. It also cuts server-action calls while typing.
- **Alternatives:** No debounce (D-28).
- **Date / Source:** 2026-10-12 · #11

### D-32 — Summary table uses TanStack Table v9 for sorting

- **Decision:** The summary comparison table is a client component built on `@tanstack/react-table` v9 (`rowSortingFeature` + `createSortedRowModel`). Every form-count column and the latest 10-K column can be sorted. The first click sorts descending, the third click returns to URL order, and error rows plus companies without a 10-K always sort last (`sortUndefined: 'last'`). Sort state is local and not kept in the URL. The remove button sits on each row, including error rows.
- **Why:** User request. TanStack is more than one table strictly needs, but it is the standard headless table for shadcn and leaves room for more columns or features.
- **Alternatives:** A hand-written `useState` sort over the rows (about 20 lines); keeping sort state in `?sort=` so it can be shared.
- **Date / Source:** 2026-10-12 · #13

### D-33 — Recent searches live in a cookie

- **Decision:** Choosing a company in `CompanySearch` calls the `rememberCompany` server action. It stores the six newest `{ticker, name}` (one per ticker) in a `recent` cookie. The home page reads that cookie inside a `<Suspense>` boundary and links to each company. `parseRecent` treats the cookie as untrusted and turns junk into `[]`.
- **Why:** User request. Rendering on the server means no empty-then-filled flash and no new hydration mismatch. The Suspense boundary lets the rest of `/` prerender under Cache Components.
- **Alternatives:** localStorage (client-only, so it flashes and adds an effect); a server-side table (needs users).
- **Date / Source:** 2026-10-12 · #16

### D-34 — `proxy.ts` remembers the last summary comparison

- **Decision:** A Next proxy matched on `/summary` saves every `?tickers=` to a `summary-tickers` cookie. A visit with no `tickers` param redirects to the saved list. An explicit empty `?tickers=` clears it.
- **Why:** User request (the Summary nav link should reopen the last comparison). The add, remove and nav paths all go through the URL, so one proxy covers them with no component changes.
- **Alternatives:** A server action called from the picker and the remove button; localStorage plus a client redirect.
- **Date / Source:** 2026-10-12 · #16

### D-35 — Hydration warnings from password-manager extensions are suppressed

- **Decision:** `<main>` in the root layout and `CompanySearch`'s input have `suppressHydrationWarning`. The input also has `autoComplete="off"`.
- **Why:** The user's overlay showed `data-protonpass-form=""` on `<main>`. Proton Pass tags the container of the search input before React hydrates. Clean headless Chromium had no mismatch. The flag only covers that element's own attributes, not its children.
- **Alternatives:** Asking users to disable extensions; rendering the search client-only (it would flash).
- **Date / Source:** 2026-10-12 · #16, #17

### D-36 — Layout gates pages on API health; tickers warm at startup

- **Decision:** The root layout wraps pages in `ApiGate` (inside `<Suspense>`). It calls `GET /health` through Eden with a 2 s timeout and shows "The API is not available" instead of the page when that fails. The server loads the SEC ticker list right after `listen`. A failed search shows "Search is unavailable" instead of "No matching company" or an endless "Searching…".
- **Why:** User request. A slow or stopped API made the search look broken with no explanation. The warm-up removes the slow first search, which waited on SEC's ticker file.
- **Alternatives:** `/health` that waits for tickers (its test would hit SEC); per-page error handling only.
- **Date / Source:** 2026-10-12 · #17

### D-37 — Older filings load on request via `?history=all`

- **Decision:** The submissions cache entry is now `{ filings, files }` under `submissions:v2:${cik}` (the old `Filing[]` rows under `submissions:${cik}` have the wrong shape). The filings API returns `older: { count, from }` built from `filings.files[]`. With `history=all` it fetches each older file (cached 30 days, because filed history never changes) and appends it to the recent filings. The filings page shows a "Load N older filings (since YYYY)" link, and the param stays on through paging, filters and sorting. The summary still uses `recent` only. Replaces D-14.
- **Why:** Totals, per-form counts, oldest-first sorting and form filters are only correct over the whole history, so fetching automatically "when you page past the recent set" would still give wrong numbers. Loading everything up front costs a lot for heavy filers: JPM has about 169k filings, takes about 7 s cold and adds roughly 170 MB of server memory. `recent` always covers at least a year, so the 12-month summary is complete without the older files.
- **Alternatives:** Load all files up front; fetch automatically past the recent set.
- **Date / Source:** 2026-10-12 · #23

### D-38 — Password managers are told to skip the search and page-jump fields

- **Decision:** `CompanySearch` is wrapped in a `<form role="search">` (submit is prevented, because cmdk handles Enter) that has `suppressHydrationWarning`. The input carries opt-outs for the common password managers: `data-protonpass-ignore`, `data-1p-ignore`, `data-lpignore` and `data-bwignore`. The filings page-jump `<form>` gets `suppressHydrationWarning` and `data-protonpass-ignore`. The `<main>` flag from D-35 stays.
- **Why:** Proton Pass also tagged the `/summary` page's `div` (`data-protonpass-form`), so a flag on each tagged container would never end. A page can't disable extensions. It can ask them to skip fields, and give them a form element it owns to tag.
- **Alternatives:** `suppressHydrationWarning` on every container that holds an input; rendering the search client-only (it would flash).
- **Date / Source:** 2026-10-13 · #27
