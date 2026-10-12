import { expect, test } from 'bun:test'

process.env.SEC_USER_AGENT ??= 'Test test@example.com'
const { app } = await import('./index')

test('GET /health returns ok', async () => {
  const res = await app.handle(new Request('http://localhost/health'))
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ status: 'ok' })
})
