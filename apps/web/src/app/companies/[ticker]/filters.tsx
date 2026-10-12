'use client'

import { useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Typography } from '@/components/ui/typography'
import { filingsHref, type FilingsParams } from './params'

type Props = {
  ticker: string
  forms: { form: string; count: number }[]
  selected: string[]
  sort: FilingsParams['sort']
  children: ReactNode
}

/** Filter and sort controls; state comes from the page's search params, changes go back to the URL. */
export function Filters({ ticker, forms, selected, sort, children }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Any filter or sort change starts again at page 1.
  const update = (next: Partial<Pick<FilingsParams, 'form' | 'sort'>>) =>
    startTransition(() =>
      router.replace(filingsHref(ticker, { form: selected, sort, ...next, page: 1 }), {
        scroll: false,
      }),
    )

  const toggle = (form: string) =>
    update({
      form: selected.includes(form) ? selected.filter((f) => f !== form) : [...selected, form],
    })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="max-w-xs justify-between">
              <span className="truncate">
                {selected.length ? selected.join(', ') : 'All forms'}
              </span>
              <ChevronsUpDownIcon className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-0">
            <Command>
              <CommandList>
                {selected.length > 0 && (
                  <>
                    <CommandGroup>
                      <CommandItem onSelect={() => update({ form: [] })}>Clear filter</CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}
                <CommandGroup>
                  {forms.map(({ form, count }) => (
                    <CommandItem
                      key={form}
                      value={form}
                      data-checked={selected.includes(form)}
                      onSelect={toggle}
                    >
                      {form}
                      <Typography as="span" variant="muted" className="text-xs">
                        {count}
                      </Typography>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          onClick={() => update({ sort: sort === 'desc' ? 'asc' : 'desc' })}
        >
          {sort === 'desc' ? <ArrowDownIcon /> : <ArrowUpIcon />}
          {sort === 'desc' ? 'Newest first' : 'Oldest first'}
        </Button>
        {pending && (
          <Typography as="span" variant="muted" role="status">
            Loading…
          </Typography>
        )}
      </div>
      <div className={pending ? 'opacity-50 transition-opacity' : undefined}>{children}</div>
    </div>
  )
}
