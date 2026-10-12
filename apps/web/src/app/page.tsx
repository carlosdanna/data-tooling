import Link from 'next/link'
import { CompanySearch } from '@/components/company-search'
import { Typography } from '@/components/ui/typography'

export default function Home() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Typography variant="h1">EDGAR Filings</Typography>
        <Typography variant="lead">Find a company by name or ticker.</Typography>
      </div>
      <CompanySearch autoFocus className="w-full max-w-xl" />
      <Link href="/summary">
        <Typography as="span" size="sm" color="muted" className="hover:underline">
          Compare companies →
        </Typography>
      </Link>
    </div>
  )
}
