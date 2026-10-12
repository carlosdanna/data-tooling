import { cache } from '../cache'
import { fetchJson } from './client'

export type Filing = {
  accessionNumber: string
  form: string
  filingDate: string
  reportDate: string | null
  primaryDocument: string
  primaryDocDescription: string | null
  url: string
}

export type RecentFilings = {
  accessionNumber: string[]
  form: string[]
  filingDate: string[]
  reportDate: string[]
  primaryDocument: string[]
  primaryDocDescription: string[]
}

type Submissions = { filings: { recent: RecentFilings } }

const TTL_MS = 60 * 60 * 1000

/** EDGAR stores filings column-wise (parallel arrays); turn them into rows. */
export function toFilings(cik: string, recent: RecentFilings): Filing[] {
  const cikNumber = Number(cik)
  return recent.accessionNumber.map((accessionNumber, i) => {
    const primaryDocument = recent.primaryDocument[i] ?? ''
    return {
      accessionNumber,
      form: recent.form[i] ?? '',
      filingDate: recent.filingDate[i] ?? '',
      reportDate: recent.reportDate[i] || null,
      primaryDocument,
      primaryDocDescription: recent.primaryDocDescription[i] || null,
      url: `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${accessionNumber.replaceAll('-', '')}/${primaryDocument}`,
    }
  })
}

// Only filings.recent (latest ~1000); older pages in filings.files[] are deferred, see NOTES.md.
export function getFilings(cik: string): Promise<Filing[]> {
  return cache.getOrSet(`submissions:${cik}`, TTL_MS, async () => {
    const data = await fetchJson<Submissions>(`https://data.sec.gov/submissions/CIK${cik}.json`)
    return toFilings(cik, data.filings.recent)
  })
}
