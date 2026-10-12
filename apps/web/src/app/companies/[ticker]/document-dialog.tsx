'use client'

import { useState } from 'react'
import { ExternalLinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'

type Props = { url: string; form: string; description: string; filingDate: string }

export function DocumentDialog({ url, form, description, filingDate }: Props) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Dialog onOpenChange={(open) => !open && setLoaded(false)}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[90vh] flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {form} · {description}
          </DialogTitle>
          <DialogDescription>Filed {filingDate}</DialogDescription>
        </DialogHeader>
        <div className="relative flex-1 overflow-hidden rounded-lg border bg-white">
          {!loaded && (
            <Typography
              variant="muted"
              role="status"
              className="absolute inset-0 grid place-items-center"
            >
              Loading document…
            </Typography>
          )}
          <iframe
            src={`/documents?url=${encodeURIComponent(url)}`}
            title={`${form} ${description}`}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            onLoad={() => setLoaded(true)}
            className="size-full"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              Open on sec.gov <ExternalLinkIcon />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
