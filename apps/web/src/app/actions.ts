'use server'

import { api } from '@/lib/api'

export async function searchCompanies(q: string) {
  const { data } = await api.companies.search.get({ query: { q } })
  return data ?? []
}
