'use client'

import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
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
import { summaryHref } from './params'

export type SummaryRow = {
  ticker: string
  name: string | null
  formCounts: Record<string, number>
  latest10K: string | null
  error: string | null
}

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text },
})
const helper = createColumnHelper<typeof features, SummaryRow>()

export function SummaryTable({ rows, forms }: { rows: SummaryRow[]; forms: string[] }) {
  const router = useRouter()

  const columns = useMemo(() => {
    const tickers = rows.map((r) => r.ticker)
    const remove = (t: string) => router.push(summaryHref(tickers.filter((x) => x !== t)))
    return helper.columns([
      helper.accessor((r) => (r.error ? undefined : (r.name ?? r.ticker)), {
        id: 'company',
        header: 'Company',
        sortFn: 'text',
        sortUndefined: 'last',
        cell: ({ row: { original: r } }) =>
          r.error ? (
            <Badge variant="secondary" className="font-mono">
              {r.ticker}
            </Badge>
          ) : (
            <Link href={`/companies/${r.ticker}`} className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {r.ticker}
              </Badge>
              <Typography as="span" size="sm" className="hover:underline">
                {r.name}
              </Typography>
            </Link>
          ),
      }),
      ...forms.map((f) =>
        // undefined (error rows) always sorts last; a company without the form counts as 0
        helper.accessor((r) => (r.error ? undefined : (r.formCounts[f] ?? 0)), {
          id: `form:${f}`,
          header: f,
          sortUndefined: 'last',
          sortDescFirst: true,
          cell: ({ getValue }) => (
            <Typography as="span" size="sm" className="tabular-nums">
              {getValue() || '—'}
            </Typography>
          ),
        }),
      ),
      helper.accessor((r) => r.latest10K ?? undefined, {
        id: 'latest10K',
        header: 'Latest 10-K',
        sortFn: 'text',
        sortUndefined: 'last',
        sortDescFirst: true,
        cell: ({ getValue, row: { original: r } }) =>
          getValue() ? (
            <Typography as="span" size="sm" className="tabular-nums">
              {getValue()}
            </Typography>
          ) : (
            <Typography as="span" size="sm" color="muted">
              No 10-K{r.formCounts['20-F'] ? ' · files 20-F' : ''}
            </Typography>
          ),
      }),
      helper.display({
        id: 'remove',
        header: () => <span className="sr-only">Remove</span>,
        cell: ({ row: { original: r } }) => (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Remove ${r.ticker}`}
            onClick={() => remove(r.ticker)}
          >
            <XIcon />
          </Button>
        ),
      }),
    ])
  }, [rows, forms, router])

  const table = useTable({ features, columns, data: rows, getRowId: (r) => r.ticker })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => {
              const sorted = header.column.getIsSorted()
              const numeric = header.column.id.startsWith('form:')
              return (
                <TableHead
                  key={header.id}
                  className={numeric ? 'text-right' : undefined}
                  aria-sort={
                    sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined
                  }
                >
                  {header.column.getCanSort() ? (
                    <Button
                      variant="ghost"
                      size="xs"
                      className={numeric ? '-mr-2' : '-ml-2'}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <table.FlexRender header={header} />
                      {sorted === 'asc' ? (
                        <ArrowUpIcon />
                      ) : sorted === 'desc' ? (
                        <ArrowDownIcon />
                      ) : (
                        <ArrowUpDownIcon className="opacity-40" />
                      )}
                    </Button>
                  ) : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => {
          const cells = row.getAllCells()
          const [company, remove] = [cells[0]!, cells.at(-1)!]
          return (
            <TableRow key={row.id}>
              {row.original.error ? (
                <>
                  <TableCell>
                    <table.FlexRender cell={company} />
                  </TableCell>
                  <TableCell colSpan={cells.length - 2}>
                    <Typography as="span" size="sm" color="destructive" role="alert">
                      {row.original.error}
                    </Typography>
                  </TableCell>
                  <TableCell className="text-right">
                    <table.FlexRender cell={remove} />
                  </TableCell>
                </>
              ) : (
                cells.map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.id.startsWith('form:') || cell === remove
                        ? 'text-right'
                        : undefined
                    }
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
