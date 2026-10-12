# Data Tooling — SEC EDGAR filings

An API and UI over the [SEC EDGAR submissions API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces). It works for any SEC filer. The acceptance set is Apple (AAPL), Spotify (SPOT) and JPMorgan Chase (JPM).

- **`apps/server`**: an [Elysia](https://elysiajs.com) API. It is the only part that talks to EDGAR. It caches responses (in-memory TTL in front of `bun:sqlite`, stored in `apps/server/.cache/edgar.sqlite`) and stays under SEC's 10 req/s limit.
- **`apps/web`**: a Next.js (App Router) UI with shadcn/ui. It calls the API through a typed Eden treaty client.
  - `/`: company search with recent searches.
  - `/companies/[ticker]`: filings with form filter, sort, pagination, and documents opened in a dialog.
  - `/summary?tickers=AAPL,SPOT,JPM`: a sortable side-by-side summary (filings in the last 12 months, top forms, latest 10-K).

## Prerequisites

- [Bun](https://bun.sh) **1.4.3 or newer** (`bun --version`). Bun is the runtime and the package manager. Node, npm, yarn and pnpm are not needed.
- Internet access to `sec.gov`.

## Setup

```sh
bun install
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env` and set `SEC_USER_AGENT` to your name and email. SEC rejects requests without it, and the server refuses to start without it:

```sh
SEC_USER_AGENT="Jane Doe jane@example.com"
```

The web app needs no env file. `API_URL` defaults to `http://localhost:3001`. See `apps/web/.env.example` to change it.

## Run

```sh
bun run dev
```

| App | URL                   |
| --- | --------------------- |
| Web | http://localhost:3000 |
| API | http://localhost:3001 |

Try http://localhost:3000/companies/AAPL and http://localhost:3000/summary?tickers=AAPL,SPOT,JPM.

## API

Errors share one shape: `{ "error": { "code": "NOT_FOUND" | "VALIDATION_ERROR" | "UPSTREAM_ERROR" | "INTERNAL_ERROR", "message": "..." } }`.

```sh
# Health check
curl 'http://localhost:3001/health'

# Company search by ticker or name (ranked, up to 10 results)
curl 'http://localhost:3001/companies/search?q=apple'

# Filings for a company. All query params are optional:
# form (repeatable), sort=asc|desc (by filing date, default desc), page (default 1), pageSize (1–100, default 25), history=all (add filings older than `filings.recent`; the response's `older` says how many)
curl 'http://localhost:3001/companies/AAPL/filings?form=10-K&form=10-Q&sort=desc&page=1&pageSize=5'

# Summary for several companies. Unknown tickers go to errors[] and don't fail the request
curl 'http://localhost:3001/filings/summary?tickers=AAPL,SPOT,JPM'

# A filing document (only sec.gov Archives URLs, use a `url` from a filings response)
curl 'http://localhost:3001/documents?url=https://www.sec.gov/Archives/edgar/data/320193/000032019326000020/aapl-20260627.htm'

# Unknown ticker -> 404
curl -i 'http://localhost:3001/companies/NOPE/filings'
```

## Tests and checks

```sh
bun run test       # bun test: server and web unit tests, no network (EDGAR data comes from fixtures)
bun run check      # lint (oxlint) + format:check (prettier) + typecheck + test
```

`bun install` sets `core.hooksPath` to `.githooks`, so `bun run check` also runs as a pre-commit hook.

## Project layout

```
apps/
  server/src/
    index.ts           Elysia app: error mapping, /health, route mounting
    routes/            companies (search, filings), filings (summary), documents
    edgar/             EDGAR client (User-Agent, rate limit), tickers, submissions
    cache.ts           in-memory TTL + bun:sqlite cache
    filings.ts         filtering, sorting, paging and summary logic
  web/src/
    app/               pages: / , companies/[ticker], summary; documents route
    components/        CompanySearch, ApiGate, shadcn ui/ (incl. Typography)
    lib/api.ts         Eden treaty client typed from the server's App
    proxy.ts           remembers the last /summary comparison
docs/                  requirements, implementation plan, decisions, prompts, prompt log
```

## More

- [NOTES.md](NOTES.md): status, trade-offs, what's missing and how I'd finish it.
- [docs/DECISIONS.md](docs/DECISIONS.md): every decision with its reasons and alternatives.
- [docs/prompt-log.md](docs/prompt-log.md): the AI prompt log.
- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) and [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).
