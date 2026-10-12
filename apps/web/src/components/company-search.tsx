'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { searchCompanies } from '@/app/actions'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

type Company = Awaited<ReturnType<typeof searchCompanies>>[number]

const DEBOUNCE_MS = 200

export function CompanySearch({
  autoFocus,
  className,
}: {
  autoFocus?: boolean
  className?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Company[]>([])
  const [active, setActive] = useState('')
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const latest = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  function search(q: string) {
    setQuery(q)
    setOpen(true)
    setSearching(true)
    latest.current = q
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const companies = q.trim() ? await searchCompanies(q) : []
      if (latest.current !== q) return // a newer keystroke won the race
      setResults(companies)
      setActive(companies[0]?.ticker ?? '')
      setSearching(false)
    }, DEBOUNCE_MS)
  }

  function select(ticker: string) {
    setOpen(false)
    setQuery('')
    setResults([])
    router.push(`/companies/${ticker}`)
  }

  return (
    <Command
      shouldFilter={false}
      value={active}
      onValueChange={setActive}
      className={cn('relative overflow-visible border', className)}
    >
      <CommandInput
        value={query}
        onValueChange={search}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="Search company or ticker…"
        aria-label="Search company or ticker"
        autoFocus={autoFocus}
      />
      {open && query.trim() && (
        <CommandList
          // keep focus in the input so a click doesn't blur and close the list first
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-50 mt-1 rounded-xl border bg-popover p-1 shadow-md"
        >
          {searching && results.length === 0 ? (
            <Typography variant="muted" role="status" className="py-6 text-center">
              Searching…
            </Typography>
          ) : (
            <CommandEmpty>No matching company</CommandEmpty>
          )}
          {results.map((c) => (
            <CommandItem key={c.ticker} value={c.ticker} onSelect={select}>
              <Badge variant="secondary" className="font-mono">
                {c.ticker}
              </Badge>
              <Typography as="span" size="sm" className="truncate">
                {c.name}
              </Typography>
            </CommandItem>
          ))}
        </CommandList>
      )}
    </Command>
  )
}
