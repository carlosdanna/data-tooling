import { expect, test } from 'bun:test'
import { filingsHref, parseFilingsParams } from './params'

test('parses valid params', () => {
  expect(parseFilingsParams({ form: ['10-K', '8-K'], sort: 'asc', page: '3' })).toEqual({
    form: ['10-K', '8-K'],
    sort: 'asc',
    page: 3,
  })
  expect(parseFilingsParams({ form: '10-K' }).form).toEqual(['10-K'])
})

test('falls back to defaults on junk', () => {
  expect(parseFilingsParams({ sort: 'up', page: '-2' })).toEqual({
    form: [],
    sort: 'desc',
    page: 1,
  })
  expect(parseFilingsParams({ page: '1.5' }).page).toBe(1)
  expect(parseFilingsParams({ page: 'abc' }).page).toBe(1)
})

test('builds hrefs that round-trip and omit defaults', () => {
  expect(filingsHref('AAPL', { form: [], sort: 'desc', page: 1 })).toBe('/companies/AAPL')
  const p = { form: ['10-K', '8-K'], sort: 'asc', page: 2 } as const
  const href = filingsHref('AAPL', { ...p, form: [...p.form] })
  expect(href).toBe('/companies/AAPL?form=10-K&form=8-K&sort=asc&page=2')
  const sp = new URLSearchParams(href.split('?')[1])
  expect(
    parseFilingsParams({
      form: sp.getAll('form'),
      sort: sp.get('sort') ?? undefined,
      page: sp.get('page') ?? undefined,
    }),
  ).toEqual({ ...p, form: [...p.form] })
})
