import { Elysia, t } from 'elysia'
import { getOlderFilings, getSubmissions } from '../edgar/submissions'
import { resolveTicker, searchTickers } from '../edgar/tickers'
import { olderSummary, queryFilings } from '../filings'

export const companies = new Elysia({ prefix: '/companies' })
  .get('/search', ({ query }) => searchTickers(query.q), {
    query: t.Object({ q: t.String() }),
  })
  .get(
    '/:ticker/filings',
    async ({ params, query }) => {
      const company = await resolveTicker(params.ticker)
      const { filings, files } = await getSubmissions(company.cik)
      const all = query.history === 'all'
      return {
        company,
        older: all ? null : olderSummary(files),
        ...queryFilings(
          all ? [...filings, ...(await getOlderFilings(company.cik, files))] : filings,
          {
            form: query.form,
            sort: query.sort ?? 'desc',
            page: query.page ?? 1,
            pageSize: query.pageSize ?? 25,
          },
        ),
      }
    },
    {
      query: t.Object({
        form: t.Optional(t.Array(t.String())),
        sort: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
        page: t.Optional(t.Integer({ minimum: 1 })),
        pageSize: t.Optional(t.Integer({ minimum: 1, maximum: 100 })),
        history: t.Optional(t.Literal('all')),
      }),
    },
  )
