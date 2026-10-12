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

export type FileRef = { name: string; filingCount: number; filingFrom: string; filingTo: string }

type Submissions = { filings: { recent: RecentFilings; files: FileRef[] } }

const TTL_MS = 60 * 60 * 1000
const OLDER_TTL_MS = 30 * 24 * 60 * 60 * 1000 // filed history never changes

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

export function getSubmissions(cik: string): Promise<{ filings: Filing[]; files: FileRef[] }> {
  // v2: the value used to be Filing[]; old rows under `submissions:${cik}` have the wrong shape
  return cache.getOrSet(`submissions:v2:${cik}`, TTL_MS, async () => {
    const data = await fetchJson<Submissions>(`https://data.sec.gov/submissions/CIK${cik}.json`)
    return { filings: toFilings(cik, data.filings.recent), files: data.filings.files }
  })
}

/** Older filings beyond `recent`; each extra file has the same column-wise shape. */
export async function getOlderFilings(cik: string, files: FileRef[]): Promise<Filing[]> {
  const chunks = await Promise.all(
    files.map(({ name }) =>
      cache.getOrSet(`submissions-file:${name}`, OLDER_TTL_MS, async () =>
        toFilings(cik, await fetchJson<RecentFilings>(`https://data.sec.gov/submissions/${name}`)),
      ),
    ),
  )
  return chunks.flat()
}
