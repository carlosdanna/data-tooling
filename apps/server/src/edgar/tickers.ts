import { cache } from '../cache'
import { NotFoundError } from '../errors'
import { fetchJson } from './client'

export type Company = { ticker: string; cik: string; name: string }

type RawTickers = Record<string, { cik_str: number; ticker: string; title: string }>

const TTL_MS = 24 * 60 * 60 * 1000

export function getTickers(): Promise<Record<string, Company>> {
  return cache.getOrSet('tickers', TTL_MS, async () => {
    const raw = await fetchJson<RawTickers>('https://www.sec.gov/files/company_tickers.json')
    const map: Record<string, Company> = {}
    for (const { cik_str, ticker, title } of Object.values(raw)) {
      const key = ticker.toUpperCase()
      map[key] ??= { ticker: key, cik: String(cik_str).padStart(10, '0'), name: title }
    }
    return map
  })
}

export async function resolveTicker(ticker: string): Promise<Company> {
  const company = (await getTickers())[ticker.trim().toUpperCase()]
  if (!company) throw new NotFoundError(`Unknown ticker: ${ticker}`)
  return company
}

export async function searchTickers(q: string, limit = 10): Promise<Company[]> {
  return rankCompanies(Object.values(await getTickers()), q, limit)
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Length of the stretch of `s` covering `q`'s characters in order, or null if they don't all appear. */
function subsequenceSpan(q: string, s: string): number | null {
  let start = -1
  let pos = -1
  for (const ch of q) {
    pos = s.indexOf(ch, pos + 1)
    if (pos === -1) return null
    if (start === -1) start = pos
  }
  return pos - start + 1
}

/** Fuzzy match on ticker and name. Returns [tier, tie-break]; lower is better. */
function score(c: Company, q: string): [number, number] | null {
  const ticker = norm(c.ticker)
  const words = c.name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  const name = words.join('')
  if (ticker === q) return [0, 0]
  if (ticker.startsWith(q)) return [1, 0]
  if (words.some((_, i) => words.slice(i).join('').startsWith(q))) return [2, 0]
  if (name.includes(q)) return [3, 0]
  const spans = [subsequenceSpan(q, ticker), subsequenceSpan(q, name)].filter((n) => n !== null)
  return spans.length ? [4, Math.min(...spans)] : null
}

/**
 * One result per company (CIK), shown under its first-listed ticker. Ties go to list order:
 * SEC's company_tickers.json is roughly sorted by market cap, so bigger companies come first.
 */
export function rankCompanies(companies: Company[], q: string, limit = 10): Company[] {
  const query = norm(q)
  if (!query) return []
  const best = new Map<string, { c: Company; s: [number, number]; order: number }>()
  companies.forEach((c, order) => {
    const prev = best.get(c.cik)
    const s = score(c, query)
    if (!prev) best.set(c.cik, { c, s: s ?? [Infinity, 0], order })
    else if (s && (s[0] - prev.s[0] || s[1] - prev.s[1]) < 0) prev.s = s
  })
  return [...best.values()]
    .filter((r) => r.s[0] !== Infinity)
    .sort((a, b) => a.s[0] - b.s[0] || a.s[1] - b.s[1] || a.order - b.order)
    .slice(0, limit)
    .map(({ c }) => c)
}
