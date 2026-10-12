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
- [ ] 8. Extension (optional)

## Final status

Steps 0–7 are complete; the optional extension (step 8) is not started. The API and UI work for any SEC filer and were checked against the acceptance set (AAPL, SPOT, JPM): filings pages, the summary comparison, filing documents and error responses. A fresh clone runs from [README.md](README.md) alone (install, `.env`, `bun run dev`, every curl example, `bun run check` with 33 tests passing).

## Decisions & trade-offs

All decisions, with reasons and alternatives, are in [docs/DECISIONS.md](docs/DECISIONS.md).

## Data notes

- `latest10K` matches `10-K` exactly. Foreign private issuers such as Spotify (SPOT) file 20-F annual reports instead, so their `latest10K` is `null`.

## What's missing & how I'd finish it

- **Older filings.** Only `filings.recent` is used (about the last 1000 filings or one year, whichever is more; D-14). To finish: when a page goes past the recent set, fetch the JSON files listed in `filings.files[]` lazily, cache each one like the main submissions file, and append them. Filed history never changes, so a long TTL is safe.
- **Shared cache (Redis).** The cache is in-memory plus `bun:sqlite` on local disk, so each server instance has its own. With more than one instance, I'd put Redis behind the same `getOrSet` interface in `apps/server/src/cache.ts`, keep the in-memory layer in front, and keep the request coalescing.
- **Document memory.** Filing documents are cached whole in the in-memory layer (a 10-K is about 1–2 MB). An LRU bound is the next step if memory grows (D-30).
- **Charts.** The summary page is a table. A chart of filings per form over time (per company, from the cached filings) would make the comparison easier to read.
- **e2e tests and CI.** Unit tests cover the cache, EDGAR parsing, filtering/summary rules, routes and URL params. Missing: Playwright tests for the three pages (search → company → document dialog, summary add/remove/sort), and a CI workflow running `bun run check`.
- **Pagination** is Prev/Next with a page jump, at a fixed page size of 25.
- **Production build/deploy.** Only `bun run dev` is set up. A deploy would need `next build`/`next start` for the web app and a long-running Bun process (plus a persistent volume for the SQLite file) for the API.

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
