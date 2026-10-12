import { Elysia, t } from 'elysia'
import { getFilings } from '../edgar/submissions'
import { resolveTicker } from '../edgar/tickers'
import { summarize } from '../filings'

export const filings = new Elysia({ prefix: '/filings' }).get(
  '/summary',
  async ({ query }) => {
    const tickers = [
      ...new Set(query.tickers.split(',').map((s) => s.trim().toUpperCase())),
    ].filter(Boolean)
    const now = new Date()
    // One bad ticker becomes an entry in errors[] instead of failing the request
    const results = await Promise.allSettled(
      tickers.map(async (ticker) => {
        const company = await resolveTicker(ticker)
        return { ...company, ...summarize(await getFilings(company.cik), now) }
      }),
    )
    const data = []
    const errors = []
    for (const [i, r] of results.entries()) {
      if (r.status === 'fulfilled') data.push(r.value)
      else
        errors.push({
          ticker: tickers[i]!,
          message: r.reason instanceof Error ? r.reason.message : String(r.reason),
        })
    }
    return { data, errors }
  },
  { query: t.Object({ tickers: t.String({ minLength: 1 }) }) },
)
