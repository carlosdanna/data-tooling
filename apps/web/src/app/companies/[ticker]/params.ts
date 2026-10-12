export type FilingsParams = { form: string[]; sort: 'asc' | 'desc'; page: number }

type RawParams = Record<string, string | string[] | undefined>

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** Raw URL search params → valid filings query, so junk URLs never reach the API as a 400. */
export function parseFilingsParams(sp: RawParams): FilingsParams {
  const page = Number(first(sp.page))
  return {
    form: [sp.form ?? []].flat().filter(Boolean),
    sort: first(sp.sort) === 'asc' ? 'asc' : 'desc',
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  }
}

export function filingsHref(ticker: string, { form, sort, page }: FilingsParams) {
  const qs = new URLSearchParams()
  for (const f of form) qs.append('form', f)
  if (sort === 'asc') qs.set('sort', sort)
  if (page > 1) qs.set('page', String(page))
  const s = qs.toString()
  return `/companies/${ticker}${s ? `?${s}` : ''}`
}
