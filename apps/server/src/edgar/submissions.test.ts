import { expect, test } from 'bun:test'
import fixture from './__fixtures__/aapl-submissions.json'

process.env.SEC_USER_AGENT ??= 'Test test@example.com'
const { toFilings } = await import('./submissions')

const recent = fixture.filings.recent
const filings = toFilings(fixture.cik, recent)

test('transposes every column-wise entry into a row', () => {
  expect(filings).toHaveLength(recent.accessionNumber.length)
  expect(filings.map((f) => f.form)).toEqual(recent.form)
})

test('builds a 10-K row with the sec.gov document URL', () => {
  expect(filings.find((f) => f.form === '10-K')).toEqual({
    accessionNumber: '0000320193-25-000079',
    form: '10-K',
    filingDate: recent.filingDate[recent.form.indexOf('10-K')]!,
    reportDate: '2025-09-27',
    primaryDocument: 'aapl-20250927.htm',
    primaryDocDescription: '10-K',
    url: 'https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm',
  })
})

test('maps empty reportDate and primaryDocDescription to null', () => {
  const form144 = filings.find((f) => f.form === '144')!
  expect(form144.reportDate).toBeNull()
  expect(form144.primaryDocDescription).toBeNull()
})
