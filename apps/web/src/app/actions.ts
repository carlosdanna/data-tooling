'use server'

import { cookies } from 'next/headers'
import { api } from '@/lib/api'
import { addRecent, parseRecent, RECENT_COOKIE, type RecentCompany } from './recent'

/** null when the API failed, so the UI can tell "unavailable" from "no match". */
export async function searchCompanies(q: string) {
  const { data } = await api.companies.search.get({ query: { q } })
  return data
}

export async function rememberCompany(company: RecentCompany) {
  if (typeof company?.ticker !== 'string' || typeof company.name !== 'string') return
  const jar = await cookies()
  const list = addRecent(parseRecent(jar.get(RECENT_COOKIE)?.value), company)
  jar.set(RECENT_COOKIE, JSON.stringify(list), { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
}
