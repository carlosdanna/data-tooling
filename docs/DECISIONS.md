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
