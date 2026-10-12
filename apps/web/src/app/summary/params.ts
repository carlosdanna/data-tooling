export function parseTickers(raw: string | string[] | undefined): string[] {
  const parts = [raw ?? []].flat().flatMap((s) => s.split(','))
  return [...new Set(parts.map((s) => s.trim().toUpperCase()))].filter(Boolean)
}

export function summaryHref(tickers: string[]) {
  return `/summary?tickers=${tickers.map(encodeURIComponent).join(',')}`
}

/**
 * Most common form types: filed by the most companies first, then by total count,
 * so one prolific filer (JPM's ~20k 424B2 prospectuses) can't take every column.
 */
export function topForms(rows: { formCounts: Record<string, number> }[], n = 8) {
  const totals: Record<string, [companies: number, count: number]> = {}
  for (const r of rows)
    for (const [form, count] of Object.entries(r.formCounts)) {
      const [companies, sum] = totals[form] ?? [0, 0]
      totals[form] = [companies + 1, sum + count]
    }
  return Object.entries(totals)
    .sort(([a, [ca, x]], [b, [cb, y]]) => cb - ca || y - x || a.localeCompare(b))
    .slice(0, n)
    .map(([form]) => form)
}
