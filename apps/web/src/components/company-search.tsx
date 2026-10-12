'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { rememberCompany, searchCompanies } from '@/app/actions'
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

type Company = NonNullable<Awaited<ReturnType<typeof searchCompanies>>>[number]

const DEBOUNCE_MS = 200

export function CompanySearch({
  autoFocus,
  className,
  onSelect,
}: {
  autoFocus?: boolean
  className?: string
  /** Defaults to navigating to the company's filings page. */
  onSelect?: (ticker: string) => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Company[]>([])
  const [active, setActive] = useState('')
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [failed, setFailed] = useState(false)
  const latest = useRef('')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    // Text typed before hydration is in the DOM but never reached onValueChange
    if (input.current?.value) search(input.current.value)
    return () => clearTimeout(timer.current)
  }, [])

  function search(q: string) {
    setQuery(q)
    setOpen(true)
    setSearching(true)
    latest.current = q
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const companies = q.trim() ? await searchCompanies(q).catch(() => null) : []
      if (latest.current !== q) return // a newer keystroke won the race
      setFailed(companies === null)
      setResults(companies ?? [])
      setActive(companies?.[0]?.ticker ?? '')
      setSearching(false)
    }, DEBOUNCE_MS)
  }

  function select(ticker: string) {
    const company = results.find((c) => c.ticker === ticker)
    if (company) void rememberCompany(company)
    setOpen(false)
    setQuery('')
    setResults([])
    if (onSelect) onSelect(ticker)
    else router.push(`/companies/${ticker}`)
  }

  return (
    <Command
      shouldFilter={false}
      value={active}
      onValueChange={setActive}
      className={cn('relative overflow-visible border', className)}
    >
      <CommandInput
        ref={input}
        value={query}
        onValueChange={search}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder="Search company or ticker…"
        aria-label="Search company or ticker"
        autoFocus={autoFocus}
        autoComplete="off"
        // password-manager extensions (e.g. Proton Pass) tag inputs before hydration
        suppressHydrationWarning
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
          ) : failed ? (
            <Typography color="destructive" role="alert" className="py-6 text-center">
              Search is unavailable. Is the API running?
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
