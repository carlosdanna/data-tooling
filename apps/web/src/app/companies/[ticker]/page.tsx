import Link from 'next/link'
import { ExternalLinkIcon } from 'lucide-react'
import { CompanySearch } from '@/components/company-search'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Typography } from '@/components/ui/typography'
import { api } from '@/lib/api'
import { Filters } from './filters'
import { filingsHref, parseFilingsParams } from './params'

export default async function CompanyPage({
  params,
  searchParams,
}: PageProps<'/companies/[ticker]'>) {
  const ticker = decodeURIComponent((await params).ticker).toUpperCase()
  const query = parseFilingsParams(await searchParams)
  const { data, error } = await api.companies({ ticker }).filings.get({ query })
  // Eden only types route-level errors (422); 404/502 come from the global onError mapper.
  const status: number | undefined = error?.status

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {data ? (
          <div className="flex flex-col gap-1">
            <Typography variant="h2">{data.company.name}</Typography>
            <Typography variant="muted">
              {data.company.ticker} · CIK {data.company.cik}
            </Typography>
          </div>
        ) : (
          <Typography variant="h2">{ticker}</Typography>
        )}
        <CompanySearch className="w-full sm:w-80" />
      </div>

      {status === 404 ? (
        <Typography color="muted">
          Unknown ticker <Typography variant="code">{ticker}</Typography>. Search for a company
          above.
        </Typography>
      ) : error ? (
        <Typography color="destructive" role="alert">
          Could not load filings:{' '}
          {(error.value as { error?: { message?: string } } | undefined)?.error?.message ??
            `status ${String(status)}`}
        </Typography>
      ) : (
        <Filters ticker={ticker} forms={data.forms} selected={query.form} sort={query.sort}>
          {data.data.length === 0 ? (
            <Typography color="muted">No filings match these filters.</Typography>
          ) : (
            <div className="flex flex-col gap-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form</TableHead>
                    <TableHead>Filing date</TableHead>
                    <TableHead>Report date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>
                      <span className="sr-only">Document</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((f) => (
                    <TableRow key={f.accessionNumber}>
                      <TableCell>
                        <Badge variant="secondary">{f.form}</Badge>
                      </TableCell>
                      <TableCell>
                        <Typography as="span" size="sm" className="tabular-nums">
                          {f.filingDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography as="span" size="sm" className="tabular-nums">
                          {f.reportDate ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        <Typography as="span" size="sm">
                          {f.primaryDocDescription ?? f.primaryDocument}
                        </Typography>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <a href={f.url} target="_blank" rel="noopener noreferrer">
                            View <ExternalLinkIcon />
                            <span className="sr-only">(opens sec.gov in a new tab)</span>
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination ticker={ticker} query={query} {...data.pagination} />
            </div>
          )}
        </Filters>
      )}
    </div>
  )
}

function Pagination({
  ticker,
  query,
  page,
  totalPages,
  total,
}: {
  ticker: string
  query: ReturnType<typeof parseFilingsParams>
  page: number
  totalPages: number
  total: number
}) {
  const link = (to: number, label: string) =>
    to >= 1 && to <= totalPages ? (
      <Button asChild variant="outline" size="sm">
        <Link href={filingsHref(ticker, { ...query, page: to })}>{label}</Link>
      </Button>
    ) : (
      <Button variant="outline" size="sm" disabled>
        {label}
      </Button>
    )

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      <Typography variant="muted">
        Page {page} of {totalPages} · {total} filings
      </Typography>
      <div className="flex gap-2">
        {link(page - 1, 'Previous')}
        {link(page + 1, 'Next')}
      </div>
    </nav>
  )
}
