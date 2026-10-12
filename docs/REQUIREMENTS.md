# Requirements

Source: [Data_Tooling_-_Coding_Assignment.pdf](Data_Tooling_-_Coding_Assignment.pdf). Time budget ~4 hours including setup.

## Constraints

- TypeScript throughout, React frontend.
- Must work for any SEC filer. Acceptance set: **Apple (AAPL), Spotify (SPOT), JPMorgan Chase (JPM)**.
- Submission: source code + run instructions, AI prompt log ([prompt-log.md](prompt-log.md)), [NOTES.md](../NOTES.md), pushed to GitHub.

## Architecture

Bun workspaces monorepo:

| Path          | Role                                                   |
| ------------- | ------------------------------------------------------ |
| `apps/server` | Elysia API on Bun. Talks to EDGAR, normalises, caches. |
| `apps/web`    | Next.js App Router + shadcn/ui. Talks only to server.  |

The web app consumes the server through Eden treaty for end-to-end types.

## Backend

### BE-1 Resolve ticker → CIK and fetch filing history

- Load `https://www.sec.gov/files/company_tickers.json` and build a `TICKER → CIK` map (case-insensitive).
- Fetch `https://data.sec.gov/submissions/CIK##########.json` (CIK zero-padded to 10 digits).
- Unknown ticker → `404`.

### BE-2 Standardised filing objects

EDGAR returns `filings.recent` as parallel arrays (columnar). Transpose into rows:

```ts
type Filing = {
  accessionNumber: string // "0000320193-24-000123"
  form: string // "10-K", "10-Q", "8-K", ...
  filingDate: string // ISO date
  reportDate: string | null
  primaryDocument: string
  primaryDocDescription: string | null
  url: string // link to original document on sec.gov
}
```

`url = https://www.sec.gov/Archives/edgar/data/{cik}/{accessionNumber without dashes}/{primaryDocument}`

**Open decision:** `filings.recent` holds only the latest ~1000 filings; older ones are in `filings.files[]` (extra JSON files). Not needed for the 12-month summary; needed for full history of heavy filers (e.g. JPM). Decide whether to load them lazily.

### BE-3 `GET /companies/:ticker/filings`

| Query      | Type                      | Default | Notes                                    |
| ---------- | ------------------------- | ------- | ---------------------------------------- |
| `form`     | string, repeatable or CSV | all     | e.g. `form=10-K&form=8-K`; exact match   |
| `sort`     | `desc` \| `asc`           | `desc`  | by `filingDate`                          |
| `page`     | int ≥ 1                   | `1`     |                                          |
| `pageSize` | int 1–100                 | `25`    |                                          |

Response:

```ts
{
  company: { ticker: string; cik: string; name: string }
  data: Filing[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}
```

Also expose the distinct form types available for the company (for the UI filter), either in this response or a separate endpoint.

### BE-4 `GET /filings/summary`

- Input: `tickers=AAPL,SPOT,JPM`.
- Per company: count of filings per form type over the **last 12 months** (rolling, from today), and the date of the **latest 10-K** (`null` if none, e.g. foreign filers like SPOT file 20-F — note in NOTES.md).
- One unknown ticker should not fail the whole request: return per-ticker errors.

```ts
{
  data: Array<{
    ticker: string
    cik: string
    name: string
    formCounts: Record<string, number>
    latest10K: string | null
  }>
  errors: Array<{ ticker: string; message: string }>
}
```

### Errors

| Case                        | Status |
| --------------------------- | ------ |
| Invalid query params        | 400    |
| Unknown ticker              | 404    |
| EDGAR unreachable / non-2xx | 502    |

Errors return `{ error: { code, message } }`.

## EDGAR usage rules

- Every request sends `User-Agent: "<Name> <email>"` (from `SEC_USER_AGENT` env), otherwise SEC returns 403.
- Fair-access limit: ≤ 10 requests/second. Throttle outgoing calls.

## Caching

Avoid hitting EDGAR on every request.

| Data                  | TTL  |
| --------------------- | ---- |
| `company_tickers.json` | 24 h |
| Submissions per CIK   | 1 h  |

- Two layers: in-memory TTL map → `bun:sqlite` file (`apps/server/.cache/edgar.sqlite`, gitignored) so restarts don't refetch.
- Deduplicate concurrent in-flight requests for the same key.
- Production upgrade path: Redis (shared across instances). Chosen SQLite so reviewers need no extra infra.

## Frontend

### FE-1 Filings list

- Company switcher: any ticker (search/autocomplete over the ticker list).
- Filter by form type (multi-select).
- Sort by filing date (asc/desc).
- Pagination.
- Each row links to the original document on sec.gov (new tab).
- State in URL search params so views are shareable.

### FE-2 Summary view

- Pick a set of companies; show a table of form-type counts (last 12 months) per company plus latest 10-K date.
- Format is free; a comparison table is the baseline, a chart is an extension.

### UI system

- shadcn/ui components.
- Custom `Typography` component in shadcn style (cva-based) with props:
  - `as` — rendered tag (`h1`…`h6`, `p`, `span`, …)
  - `variant` — semantic preset (h1–h4, p, lead, small, muted, code) that sets default tag and styles
  - `size`, `color`, `weight` — override the variant
- Loading, empty and error states for every data view.

## Non-functional

- TypeScript `strict`.
- oxlint + prettier.
- pino structured logging (request logs, cache hit/miss, upstream calls).
- Tests for the columnar → row transform, pagination/filter logic and summary aggregation.

## Extensions (if time allows)

- Load older filings from `filings.files[]`.
- Summary chart.
- Docker compose with Redis cache.
- OpenAPI docs via Elysia swagger plugin.
