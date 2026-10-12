import { expect, test } from 'bun:test'

process.env.SEC_USER_AGENT ??= 'Test test@example.com'
const { rankCompanies } = await import('./tickers')

const co = (ticker: string, name: string, cik = ticker) => ({ ticker, cik, name })
const companies = [
  co('JPM', 'JPMORGAN CHASE & CO'),
  co('JPM-PC', 'JPMORGAN CHASE & CO', 'JPM'),
  co('AAPL', 'Apple Inc.'),
  co('APLE', 'Apple Hospitality REIT, Inc.'),
  co('PAPL', 'Pineapple Financial Inc.'),
  co('SPOT', 'Spotify Technology S.A.'),
  co('BRK-B', 'BERKSHIRE HATHAWAY INC'),
  co('BRK-A', 'BERKSHIRE HATHAWAY INC', 'BRK-B'),
  co('AP', 'Ampco-Pittsburgh Corp'),
]
const tickers = (q: string) => rankCompanies(companies, q).map((c) => c.ticker)

test('ranks exact ticker, ticker prefix, name word-prefix, name substring, then fuzzy', () => {
  expect(tickers('ap').slice(0, 3)).toEqual(['AP', 'APLE', 'AAPL'])
  expect(tickers('apple')).toEqual(['AAPL', 'APLE', 'PAPL'])
})

test('ignores case and punctuation', () => {
  expect(tickers('brkb')[0]).toBe('BRK-B')
  expect(tickers('berkshire hath')[0]).toBe('BRK-B')
  expect(tickers('spotif')[0]).toBe('SPOT')
})

test('fuzzy subsequence match', () => {
  expect(tickers('jpmc')[0]).toBe('JPM')
})

test('one result per company, under its first-listed ticker', () => {
  expect(tickers('jpm-pc')).toEqual(['JPM'])
  expect(tickers('brk')).toEqual(['BRK-B'])
})

test('no match or empty query returns nothing', () => {
  expect(tickers('zzzzqq')).toEqual([])
  expect(tickers('  ')).toEqual([])
})
