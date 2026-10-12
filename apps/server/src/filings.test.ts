import { describe, expect, test } from 'bun:test'
import type { Filing } from './edgar/submissions'
import { queryFilings, summarize } from './filings'

const filing = (form: string, filingDate: string): Filing => ({
  accessionNumber: `${form}-${filingDate}`,
  form,
  filingDate,
  reportDate: null,
  primaryDocument: 'doc.htm',
  primaryDocDescription: null,
  url: 'https://www.sec.gov/',
})

const filings = [
  filing('10-Q', '2025-05-01'),
  filing('10-K', '2024-11-01'),
  filing('8-K', '2025-08-01'),
  filing('8-K', '2025-02-01'),
  filing('10-K', '2025-10-31'),
]

const base = { sort: 'desc', page: 1, pageSize: 25 } as const

describe('queryFilings', () => {
  test('returns everything newest first by default', () => {
    const res = queryFilings(filings, base)
    expect(res.data.map((f) => f.filingDate)).toEqual([
      '2025-10-31',
      '2025-08-01',
      '2025-05-01',
      '2025-02-01',
      '2024-11-01',
    ])
    expect(res.pagination).toEqual({ page: 1, pageSize: 25, total: 5, totalPages: 1 })
  })

  test('sorts ascending without mutating the input', () => {
    const before = [...filings]
    const res = queryFilings(filings, { ...base, sort: 'asc' })
    expect(res.data[0]!.filingDate).toBe('2024-11-01')
    expect(filings).toEqual(before)
  })

  test('filters by repeated and comma-separated forms, exact match', () => {
    const repeated = queryFilings(filings, { ...base, form: ['10-K', '8-K'] })
    const csv = queryFilings(filings, { ...base, form: ['10-K, 8-K'] })
    expect(repeated.pagination.total).toBe(4)
    expect(csv.data).toEqual(repeated.data)
    expect(queryFilings(filings, { ...base, form: ['10'] }).data).toEqual([])
  })

  test('paginates and reports totalPages', () => {
    const res = queryFilings(filings, { ...base, page: 2, pageSize: 2 })
    expect(res.data.map((f) => f.filingDate)).toEqual(['2025-05-01', '2025-02-01'])
    expect(res.pagination.totalPages).toBe(3)
  })

  test('page past the end is empty; empty result has one page', () => {
    expect(queryFilings(filings, { ...base, page: 9 }).data).toEqual([])
    expect(queryFilings([], base).pagination).toEqual({
      page: 1,
      pageSize: 25,
      total: 0,
      totalPages: 1,
    })
  })

  test('forms counts cover all filings regardless of the filter', () => {
    const res = queryFilings(filings, { ...base, form: ['10-Q'] })
    expect(res.forms).toEqual([
      { form: '10-K', count: 2 },
      { form: '8-K', count: 2 },
      { form: '10-Q', count: 1 },
    ])
  })
})

describe('summarize', () => {
  const now = new Date('2025-11-01T12:00:00Z')

  test('counts forms in the rolling 12 months, inclusive of the cutoff day', () => {
    const res = summarize([...filings, filing('8-K', '2024-10-31')], now)
    expect(res.formCounts).toEqual({ '10-Q': 1, '10-K': 2, '8-K': 2 })
  })

  test('latest10K is the newest 10-K, even outside the window', () => {
    expect(summarize(filings, now).latest10K).toBe('2025-10-31')
    expect(summarize([filing('10-K', '2020-01-01')], now)).toEqual({
      formCounts: {},
      latest10K: '2020-01-01',
    })
  })

  test('latest10K is null for a 20-F filer', () => {
    expect(summarize([filing('20-F', '2025-02-01'), filing('6-K', '2025-04-01')], now)).toEqual({
      formCounts: { '20-F': 1, '6-K': 1 },
      latest10K: null,
    })
  })
})
