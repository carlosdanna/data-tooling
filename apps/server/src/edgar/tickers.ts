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
  const query = q.trim().toUpperCase()
  if (!query) return []
  const companies = Object.values(await getTickers())
  const byTicker = companies.filter((c) => c.ticker.startsWith(query))
  const byName = companies.filter(
    (c) => !c.ticker.startsWith(query) && c.name.toUpperCase().includes(query),
  )
  return [...byTicker, ...byName].slice(0, limit)
}
