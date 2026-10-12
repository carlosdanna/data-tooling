import { expect, test } from 'bun:test'

process.env.SEC_USER_AGENT ??= 'Test test@example.com'
const { app } = await import('./index')

test('GET /health returns ok', async () => {
  const res = await app.handle(new Request('http://localhost/health'))
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ status: 'ok' })
})

test('GET /documents rejects URLs outside sec.gov filing archives', async () => {
  for (const url of [
    'https://evil.example/Archives/edgar/data/1/2/x.htm',
    'https://www.sec.gov/cgi-bin/browse-edgar',
    'https://www.sec.gov/Archives/edgar/data/1/2/../../../x.htm',
    'https://www.sec.gov/Archives/edgar/data/1/2/x.htm?a=1',
  ]) {
    const res = await app.handle(
      new Request(`http://localhost/documents?url=${encodeURIComponent(url)}`),
    )
    expect(res.status).toBe(400)
  }
})
