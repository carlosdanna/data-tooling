# NOTES

## Status

Steps follow [docs/PROMPTS.md](docs/PROMPTS.md).

- [x] 0. Requirements, implementation plan, decisions, prompts
- [x] 1. Scaffold the monorepo
- [x] 2. Cache and EDGAR client
- [x] 3. API routes (`GET /companies/:ticker/filings`, `GET /filings/summary`)
- [x] 4. shadcn, Typography and API client
- [x] 5. Filings page
- [x] 6. Summary page
- [x] 7. Submission polish (README)
- [x] 8. Extension: older filings on request (D-37)

## Final status

Steps 0–8 are complete. The extension (step 8) loads a company's full filing history from `filings.files[]` on request (D-37). The API and UI work for any SEC filer and were checked against the acceptance set (AAPL, SPOT, JPM): filings pages, the summary comparison, filing documents and error responses. A fresh clone runs from [README.md](README.md) alone (install, `.env`, `bun run dev`, every curl example, `bun run check` passing).

## Decisions & trade-offs

All decisions, with reasons and alternatives, are in [docs/DECISIONS.md](docs/DECISIONS.md).

## Data notes

- `latest10K` matches `10-K` exactly. Foreign private issuers such as Spotify (SPOT) file 20-F annual reports instead, so their `latest10K` is `null`.

## What's missing & how I'd finish it

- **Shared cache (Redis).** The cache is in-memory plus `bun:sqlite` on local disk, so each server instance has its own. With more than one instance, I'd put Redis behind the same `getOrSet` interface in `apps/server/src/cache.ts`, keep the in-memory layer in front, and keep the request coalescing.
- **Document memory.** Filing documents are cached whole in the in-memory layer (a 10-K is about 1–2 MB), and so is a full filing history once someone loads it (JPM: about 169k rows, roughly 170 MB). An LRU bound is the next step if memory grows (D-30, D-37).
- **Charts.** The summary page is a table. A chart of filings per form over time (per company, from the cached filings) would make the comparison easier to read.
- **e2e tests and CI.** Unit tests cover the cache, EDGAR parsing, filtering/summary rules, routes and URL params. Missing: Playwright tests for the three pages (search → company → document dialog, summary add/remove/sort), and a CI workflow running `bun run check`.
- **Pagination** is Prev/Next with a page jump, at a fixed page size of 25.
- **Slow first load in dev.** After `bun run dev`, the first page load waits a few seconds before the Next devtools badge appears, and the search box shows no results until then. Turbopack compiles the route and its dev bundles (React dev build, devtools, about 4 MB) on the first request, and React can't hydrate until they arrive. Until hydration the search box is a plain `<input>`. Text typed in that window is kept, and `CompanySearch` searches for it on hydration. Measured on warm loads: HTML in about 60 ms, hydrated in about 200 ms, API search in about 14 ms. `next build`/`next start` doesn't have this. The fix would be to request `/` once when `next dev` starts so the compile happens before the browser opens. I left it out because it only affects the dev server.
- **Production build/deploy.** Only `bun run dev` is set up. A deploy would need `next build`/`next start` for the web app and a long-running Bun process (plus a persistent volume for the SQLite file) for the API.
- **Ticker cap on the summary.** `GET /filings/summary` takes any number of tickers. Each uncached ticker is one EDGAR call, spaced 100 ms apart through a queue shared by all requests, so 500 tickers would hold that queue for about 50 s. I'd reject more than about 20 with a 400 (`apps/server/src/routes/filings.ts`).
- **EDGAR timeouts.** `fetch` has no timeout. If an EDGAR connection hangs, the shared in-flight promise in `cache.ts` never settles, so every later request for that key hangs too. I'd add `signal: AbortSignal.timeout(10_000)` and turn the abort into an `UpstreamError`, which already becomes a 502 or a stale cached copy (`apps/server/src/edgar/client.ts`).
- **Retries.** A single 429 or 5xx from EDGAR becomes a 502 unless a stale copy exists. One or two retries that honor `Retry-After` would cover rate limits and brief outages.
- **Full history per request.** With `history=all`, every page or filter click rebuilds and re-sorts the whole history (JPM: about 169k rows). Keeping the merged array per CIK would make paging a slice (`apps/server/src/routes/companies.ts`).
- **SQLite pruning.** Expired rows are never deleted, including keys from older formats (the `shortcut:` in `cache.ts`). A startup `DELETE` of rows past a maximum stale age would keep the file bounded without breaking serve-stale.
- **Health check.** `/health` always returns `ok`. For a deploy it should report whether the ticker list is loaded and SQLite is reachable.
- **Search precompute.** Search normalizes about 10k company names on every keystroke. Doing it once when `getTickers()` loads the list would remove that work. Low priority, since a search takes about 14 ms now.
- **Checked and fine:** `/documents` only fetches sec.gov filing paths (strict regex), the framed filing runs sandboxed (CSP `sandbox` plus a sandboxed iframe), and the `<base href>` can't be broken out of because the regex excludes quotes.

## Time log

| Step                                 | Time            |
| ------------------------------------ | --------------- |
| 0. Requirements & repo docs          | — (ended 18:37) |
| 1. Scaffold the monorepo             | ~15 min         |
| 2. Cache and EDGAR client            | ~30 min         |
| 3. API routes                        | ~10 min         |
| 4. shadcn, Typography and API client | ~20 min         |
| 5. Filings page                      | ~25 min         |
| 6. Summary page                      | ~20 min         |
| Follow-ups (search, memory, styling) | ~30 min         |
| 7. Submission polish                 | ~15 min         |

Times are taken from the gaps between commits (step 4: up to 19:51, step 5: 19:57–20:20, step 6: 20:16–20:37, follow-ups: 20:37–21:06), so they're approximate. Step 0's start wasn't recorded.
