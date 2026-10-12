# NOTES

## Status

Steps follow [docs/PROMPTS.md](docs/PROMPTS.md).

- [x] 0. Requirements, implementation plan, decisions, prompts
- [x] 1. Scaffold the monorepo
- [x] 2. Cache and EDGAR client
- [x] 3. API routes (`GET /companies/:ticker/filings`, `GET /filings/summary`)
- [x] 4. shadcn, Typography and API client
- [x] 5. Filings page
- [ ] 6. Summary page
- [ ] 7. Submission polish (README)
- [ ] 8. Extension (optional)

## Decisions & trade-offs

All decisions, with reasons and alternatives, are in [docs/DECISIONS.md](docs/DECISIONS.md).

## Data notes

- `latest10K` matches `10-K` exactly. Foreign private issuers such as Spotify (SPOT) file 20-F annual reports instead, so their `latest10K` is `null`.

## What's missing & how I'd finish it

- Company search has no debounce. Each keystroke is one server-action call answered from the cached ticker map (D-28).
- Pagination is Prev/Next only, at a fixed page size of 25.

## Time log

| Step                                 | Time            |
| ------------------------------------ | --------------- |
| 0. Requirements & repo docs          | — (ended 18:37) |
| 1. Scaffold the monorepo             | ~15 min         |
| 2. Cache and EDGAR client            | ~30 min         |
| 3. API routes                        | ~10 min         |
| 4. shadcn, Typography and API client | ~20 min         |
| 5. Filings page                      | ~25 min         |

Times are taken from the gaps between commits (step 4: up to 19:51, step 5: 19:57–20:20), so they're approximate. Step 0's start wasn't recorded.
