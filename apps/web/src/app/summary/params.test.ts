import { expect, test } from 'bun:test'
import { parseTickers, summaryHref, topForms } from './params'

test('starts empty when the param is absent or blank', () => {
  expect(parseTickers(undefined)).toEqual([])
  expect(parseTickers('')).toEqual([])
})

test('normalises and dedupes tickers', () => {
  expect(parseTickers(' aapl,MSFT,,Aapl ')).toEqual(['AAPL', 'MSFT'])
  expect(parseTickers(['aapl', 'jpm,spot'])).toEqual(['AAPL', 'JPM', 'SPOT'])
})

test('builds a readable href', () => {
  expect(summaryHref(['AAPL', 'BRK-B'])).toBe('/summary?tickers=AAPL,BRK-B')
  expect(summaryHref([])).toBe('/summary?tickers=')
})

test('ranks forms by companies filing them, then total count, and caps the list', () => {
  const rows: { formCounts: Record<string, number> }[] = [
    { formCounts: { '8-K': 3, '10-Q': 3, '4': 1 } },
    { formCounts: { '4': 9, '6-K': 1 } },
  ]
  expect(topForms(rows)).toEqual(['4', '10-Q', '8-K', '6-K'])
  expect(topForms([{ formCounts: { '424B2': 99, '4': 1 } }, { formCounts: { '4': 1 } }])).toEqual([
    '4',
    '424B2',
  ])
  expect(topForms(rows, 2)).toEqual(['4', '10-Q'])
})
