import Link from 'next/link'
import { cookies } from 'next/headers'
import { Suspense } from 'react'
import { CompanySearch } from '@/components/company-search'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { parseRecent, RECENT_COOKIE } from './recent'

export default function Home() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Typography variant="h1">EDGAR Filings</Typography>
        <Typography variant="lead">Find a company by name or ticker.</Typography>
      </div>
      <CompanySearch autoFocus className="w-full max-w-xl" />
      <Suspense>
        <RecentSearches />
      </Suspense>
    </div>
  )
}

/** Reads cookies, so it renders per request while the rest of the page prerenders. */
async function RecentSearches() {
  const recent = parseRecent((await cookies()).get(RECENT_COOKIE)?.value)
  return (
    recent.length > 0 && (
      <section className="flex w-full max-w-xl flex-col gap-2">
        <Typography as="h2" size="sm" color="muted">
          Recent searches
        </Typography>
        <ul className="grid gap-2 sm:grid-cols-2">
          {recent.map((c) => (
            <li key={c.ticker}>
              <Link
                href={`/companies/${c.ticker}`}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted"
              >
                <Badge variant="secondary" className="font-mono">
                  {c.ticker}
                </Badge>
                <Typography as="span" size="sm" className="truncate">
                  {c.name}
                </Typography>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )
  )
}
