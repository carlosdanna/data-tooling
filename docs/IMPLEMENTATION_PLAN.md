# Implementation plan

How the pieces in [REQUIREMENTS.md](REQUIREMENTS.md) fit together.

## Request flow

```
Browser ──> Next.js (apps/web, RSC) ──Eden treaty──> Elysia (apps/server) ──> SEC EDGAR
            URL params = UI state                    cache: memory → sqlite    (User-Agent, ≤10 req/s)
```

- The browser never calls the API server directly. Server components fetch through Eden; client components only update URL search params. No CORS, no client-side data-fetching library.
- Next.js fetches with `cache: 'no-store'`. The Elysia cache is the single cache layer, so two caches can't disagree.
- The web app imports `type App` from the server workspace (`"server": "workspace:*"`), type-only, so the API contract has one source of truth.

## Repo layout

```
package.json               workspaces ["apps/*"]; scripts: dev, lint, format, typecheck, test
.oxlintrc.json  .prettierrc  tsconfig.base.json

apps/server/src/
  index.ts                 Elysia app, pino request logs, error mapper, routes; export type App
  env.ts                   PORT, SEC_USER_AGENT (fail fast if missing)
  logger.ts                pino (+ pino-pretty in dev)
  cache.ts                 getOrSet(key, ttlMs, loader): Map → bun:sqlite → loader; in-flight dedupe
  edgar/client.ts          fetchJson(url): User-Agent, ≥100ms spacing, non-2xx → UpstreamError
  edgar/tickers.ts         ticker → {cik, name} map (24h TTL); resolveTicker, searchTickers
  edgar/submissions.ts     getFilings(cik) (1h TTL): transpose filings.recent → Filing[]
  filings.ts               pure: queryFilings(filings, {form, sort, page, pageSize}), summarize(filings, now)
  routes/companies.ts      GET /companies/search?q=, GET /companies/:ticker/filings
  routes/filings.ts        GET /filings/summary?tickers=
  *.test.ts                bun test; fixture = trimmed real AAPL submissions JSON

apps/web/src/
  lib/api.ts               treaty<App>(API_URL), server-only
  components/ui/*          shadcn (table, select, badge, button, input, card, command/popover)
  components/ui/typography.tsx   cva-based: as / variant / size / color / weight
  components/company-switcher.tsx   client: server action → /companies/search, navigates on select
  app/page.tsx             redirect → /companies/AAPL
  app/companies/[ticker]/page.tsx     RSC: filings table + pagination
  app/companies/[ticker]/filters.tsx  client: form multi-select, sort toggle → router.replace(?form=&sort=)
  app/summary/page.tsx     RSC: ?tickers=AAPL,SPOT,JPM → comparison table
```

## Key design points

- **Cache what's small.** Store normalised `Filing[]` per CIK, not the raw EDGAR JSON. SQLite table `cache(key TEXT PRIMARY KEY, value TEXT, expires_at INTEGER)`. An expired entry triggers a refetch; if EDGAR fails and a stale entry exists, serve it and log a warning.
- **In-flight dedupe.** Concurrent requests for the same key share one promise, so a burst of requests for AAPL makes one EDGAR call.
- **Throttle.** One module-level promise chain spaces outgoing calls ≥100ms apart (SEC limit is 10 req/s).
- **Summary resilience.** `Promise.allSettled` over tickers; a bad ticker becomes an entry in `errors[]` instead of failing the request.
- **Filter options.** The filings response also returns `forms: {form, count}[]` so the UI filter only offers forms the company actually files.
- **Summary logic.** Rolling 12 months from `now` (injected, for tests). `latest10K` = max `filingDate` where `form === "10-K"`. Spotify files 20-F, so it gets `null`; the UI says so.
- **Errors.** `NotFoundError` / `UpstreamError` classes mapped in Elysia `onError` to `{ error: { code, message } }` with 404 / 502. Elysia `t` schemas give 400 on bad params.
- **Deferred:** older filings in `filings.files[]` — documented in NOTES.md.

## Build order

| #   | Phase                                                                           | Done when                                          |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | Scaffold: workspaces, oxlint, prettier, tsconfig, Elysia hello, create-next-app | `bun run dev` serves both apps, lint passes        |
| 2   | Cache, EDGAR client, columnar transform, tests                                  | `bun test` green on fixture                        |
| 3   | Routes and error mapping                                                        | curl returns filings and summary for AAPL/SPOT/JPM |
| 4   | shadcn, Typography, filings page, company switcher, filters                     | switch company, filter, sort, paginate in the UI   |
| 5   | Summary page                                                                    | comparison table for AAPL, SPOT, JPM               |
| 6   | README run instructions, NOTES.md, prompt log                                   | a fresh clone runs from the README                 |

## Testing

- **Unit (bun test):** columnar transpose, `queryFilings` (filter, sort, pagination bounds), `summarize` (12-month window, company without a 10-K), cache (TTL expiry, dedupe).
- **Manual:** curl each endpoint; UI walkthrough for the three acceptance companies.
