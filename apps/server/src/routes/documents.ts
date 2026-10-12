import { Elysia, t } from 'elysia'
import { cache } from '../cache'
import { fetchText } from '../edgar/client'

const TTL_MS = 7 * 24 * 60 * 60 * 1000 // filed documents never change

// Only filing documents on sec.gov, so this can't be used to fetch arbitrary URLs.
const DOCUMENT_URL = String.raw`^(?!.*\.\.)https://www\.sec\.gov/Archives/edgar/data/\d+/\d+/[\w./-]+$`

export const documents = new Elysia({ prefix: '/documents' }).get(
  '/',
  // shortcut: whole documents (10-Ks can be several MB) stay in the in-memory cache layer; add an LRU bound if memory grows
  ({ query }) => cache.getOrSet(`document:${query.url}`, TTL_MS, () => fetchText(query.url)),
  { query: t.Object({ url: t.String({ pattern: DOCUMENT_URL }) }) },
)
