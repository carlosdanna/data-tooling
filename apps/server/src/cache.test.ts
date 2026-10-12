import { expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createCache } from './cache'

function setup() {
  let time = 0
  const cache = createCache({ path: ':memory:', now: () => time })
  return { cache, advance: (ms: number) => (time += ms) }
}

test('serves from cache within TTL and reloads after it expires', async () => {
  const { cache, advance } = setup()
  let calls = 0
  const loader = async () => ++calls

  expect(await cache.getOrSet('k', 1000, loader)).toBe(1)
  advance(999)
  expect(await cache.getOrSet('k', 1000, loader)).toBe(1)
  advance(1)
  expect(await cache.getOrSet('k', 1000, loader)).toBe(2)
})

test('concurrent requests for the same key share one loader call', async () => {
  const { cache } = setup()
  let calls = 0
  const loader = async () => {
    calls++
    await Bun.sleep(10)
    return 'v'
  }

  expect(
    await Promise.all([cache.getOrSet('k', 1000, loader), cache.getOrSet('k', 1000, loader)]),
  ).toEqual(['v', 'v'])
  expect(calls).toBe(1)
})

test('serves the stale value when the loader fails after expiry', async () => {
  const { cache, advance } = setup()
  await cache.getOrSet('k', 1000, async () => 'old')
  advance(5000)
  expect(await cache.getOrSet<string>('k', 1000, () => Promise.reject(new Error('down')))).toBe(
    'old',
  )
})

test('rethrows the loader error when nothing is cached', async () => {
  const { cache } = setup()
  await expect(cache.getOrSet('k', 1000, () => Promise.reject(new Error('down')))).rejects.toThrow(
    'down',
  )
})

test('persists to sqlite across cache instances', async () => {
  const path = join(mkdtempSync(join(tmpdir(), 'cache-test-')), 'c.sqlite')
  await createCache({ path }).getOrSet('k', 60_000, async () => ({ a: 1 }))
  let called = false
  const value = await createCache({ path }).getOrSet('k', 60_000, async () => {
    called = true
    return { a: 2 }
  })
  expect(value).toEqual({ a: 1 })
  expect(called).toBe(false)
})
