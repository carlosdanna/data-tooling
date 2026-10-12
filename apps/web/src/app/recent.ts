export type RecentCompany = { ticker: string; name: string }

export const RECENT_COOKIE = 'recent'
const MAX = 6

/** Cookie value → recent companies; the cookie is user-controlled, so junk becomes []. */
export function parseRecent(raw: string | undefined): RecentCompany[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]')
    if (!Array.isArray(value)) return []
    return value
      .filter(
        (c): c is RecentCompany =>
          typeof c?.ticker === 'string' && typeof c?.name === 'string' && c.ticker !== '',
      )
      .slice(0, MAX)
  } catch {
    return []
  }
}

/** Newest first, one entry per ticker, at most six. */
export function addRecent(list: RecentCompany[], { ticker, name }: RecentCompany) {
  return [{ ticker, name }, ...list.filter((c) => c.ticker !== ticker)].slice(0, MAX)
}
