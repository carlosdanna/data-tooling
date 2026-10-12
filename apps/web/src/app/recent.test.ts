import { expect, test } from 'bun:test'
import { addRecent, parseRecent } from './recent'

test('ignores junk cookies', () => {
  expect(parseRecent(undefined)).toEqual([])
  expect(parseRecent('not json')).toEqual([])
  expect(parseRecent('{"ticker":"AAPL"}')).toEqual([])
  expect(parseRecent('[null,{"ticker":1},{"ticker":"AAPL","name":"Apple"}]')).toEqual([
    { ticker: 'AAPL', name: 'Apple' },
  ])
})

test('keeps the six newest, deduped by ticker', () => {
  let list = parseRecent(undefined)
  for (const t of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'C'])
    list = addRecent(list, { ticker: t, name: t })
  expect(list.map((c) => c.ticker)).toEqual(['C', 'G', 'F', 'E', 'D', 'B'])
})
