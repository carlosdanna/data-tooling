import { Typography } from '@/components/ui/typography'
import { api } from '@/lib/api'
import { parseTickers, topForms } from './params'
import { type SummaryRow, SummaryTable } from './summary-table'
import { TickerPicker } from './ticker-picker'

export default async function SummaryPage({ searchParams }: PageProps<'/summary'>) {
  const tickers = parseTickers((await searchParams).tickers)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Typography variant="h2">Compare filings</Typography>
        <Typography variant="muted">Form counts over the last 12 months</Typography>
      </div>
      <TickerPicker tickers={tickers} />
      {tickers.length === 0 ? (
        <Typography color="muted">Add a company to compare.</Typography>
      ) : (
        <Summary tickers={tickers} />
      )}
    </div>
  )
}

async function Summary({ tickers }: { tickers: string[] }) {
  const { data, error } = await api.filings.summary.get({ query: { tickers: tickers.join(',') } })
  if (error)
    return (
      <Typography color="destructive" role="alert">
        Could not load summary:{' '}
        {(error.value as { error?: { message?: string } } | undefined)?.error?.message ??
          `status ${String(error.status)}`}
      </Typography>
    )

  const companies = new Map(data.data.map((c) => [c.ticker, c]))
  const errors = new Map(data.errors.map((e) => [e.ticker, e.message]))
  const rows: SummaryRow[] = tickers.map((t) => {
    const c = companies.get(t)
    return c
      ? { ...c, error: null }
      : {
          ticker: t,
          name: null,
          formCounts: {},
          latest10K: null,
          error: errors.get(t) ?? 'No data',
        }
  })

  return (
    <div className="flex flex-col gap-2">
      <SummaryTable rows={rows} forms={topForms(data.data)} />
      {data.data.some((c) => !c.latest10K) && (
        <Typography variant="muted" size="xs">
          Foreign private issuers (e.g. Spotify) file an annual 20-F instead of a 10-K.
        </Typography>
      )}
    </div>
  )
}
