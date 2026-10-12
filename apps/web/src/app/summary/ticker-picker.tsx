'use client'

import { useRouter } from 'next/navigation'
import { CompanySearch } from '@/components/company-search'
import { summaryHref } from './params'

/** Adds a company to the comparison; removal lives in the table rows. */
export function TickerPicker({ tickers }: { tickers: string[] }) {
  const router = useRouter()
  return (
    <CompanySearch
      className="w-full sm:w-80"
      onSelect={(t) => !tickers.includes(t) && router.push(summaryHref([...tickers, t]))}
    />
  )
}
