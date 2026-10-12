import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from './logger'

type Entry = { value: unknown; expiresAt: number }

export function createCache({ path, now = Date.now }: { path: string; now?: () => number }) {
  const db = new Database(path, { create: true })
  db.run('PRAGMA journal_mode = WAL')
  db.run(
    'CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires_at INTEGER NOT NULL)',
  )
  const select = db.query<{ value: string; expires_at: number }, [string]>(
    'SELECT value, expires_at FROM cache WHERE key = ?',
  )
  // shortcut: expired rows are never pruned (they back serve-stale); add a cleanup if the DB grows large
  const upsert = db.query('INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)')

  const memory = new Map<string, Entry>()
  const inFlight = new Map<string, Promise<unknown>>()

  function lookup(key: string): Entry | undefined {
    const hit = memory.get(key)
    if (hit) return hit
    const row = select.get(key)
    if (!row) return undefined
    const entry = { value: JSON.parse(row.value) as unknown, expiresAt: row.expires_at }
    memory.set(key, entry)
    return entry
  }

  async function load(
    key: string,
    ttlMs: number,
    loader: () => Promise<unknown>,
    stale: Entry | undefined,
  ) {
    try {
      const value = await loader()
      const expiresAt = now() + ttlMs
      memory.set(key, { value, expiresAt })
      upsert.run(key, JSON.stringify(value), expiresAt)
      return value
    } catch (err) {
      if (!stale) throw err
      logger.warn({ key, err }, 'cache loader failed, serving stale')
      return stale.value
    }
  }

  return {
    // Callers own the key → type mapping; values round-trip through JSON.
    async getOrSet<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
      const entry = lookup(key)
      if (entry && entry.expiresAt > now()) {
        logger.debug({ key }, 'cache hit')
        return entry.value as T
      }
      logger.debug({ key }, 'cache miss')
      let pending = inFlight.get(key)
      if (!pending) {
        pending = load(key, ttlMs, loader, entry).finally(() => inFlight.delete(key))
        inFlight.set(key, pending)
      }
      return (await pending) as T
    },
  }
}

const dir = join(import.meta.dir, '..', '.cache')
mkdirSync(dir, { recursive: true })
export const cache = createCache({ path: join(dir, 'edgar.sqlite') })
