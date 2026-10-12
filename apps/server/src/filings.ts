import type { Filing } from './edgar/submissions'

export type FilingsQuery = {
  form?: string[]
  sort: 'asc' | 'desc'
  page: number
  pageSize: number
}

export function queryFilings(filings: Filing[], { form, sort, page, pageSize }: FilingsQuery) {
  // `form` may be repeated (form=a&form=b) or CSV (form=a,b)
  const forms = new Set(
    (form ?? []).flatMap((f) => f.split(',').map((s) => s.trim())).filter(Boolean),
  )
  const filtered = forms.size ? filings.filter((f) => forms.has(f.form)) : filings
  const sorted = [...filtered].sort((a, b) =>
    sort === 'asc'
      ? a.filingDate.localeCompare(b.filingDate)
      : b.filingDate.localeCompare(a.filingDate),
  )
  const total = sorted.length
  const counts: Record<string, number> = {}
  for (const f of filings) counts[f.form] = (counts[f.form] ?? 0) + 1

  return {
    data: sorted.slice((page - 1) * pageSize, page * pageSize),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    forms: Object.entries(counts)
      .map(([form, count]) => ({ form, count }))
      .sort((a, b) => b.count - a.count),
  }
}

export function summarize(filings: Filing[], now: Date) {
  const start = new Date(now)
  start.setUTCFullYear(start.getUTCFullYear() - 1)
  const cutoff = start.toISOString().slice(0, 10)

  const formCounts: Record<string, number> = {}
  let latest10K: string | null = null
  for (const f of filings) {
    if (f.filingDate >= cutoff) formCounts[f.form] = (formCounts[f.form] ?? 0) + 1
    if (f.form === '10-K' && (!latest10K || f.filingDate > latest10K)) latest10K = f.filingDate
  }
  return { formCounts, latest10K }
}
