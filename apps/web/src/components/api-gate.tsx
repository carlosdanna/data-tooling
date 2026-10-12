import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { api } from '@/lib/api'

const TIMEOUT_MS = 2000

/** Renders the page only when the API answers /health; otherwise an error instead of a page that hangs. */
export async function ApiGate({ children }: { children: ReactNode }) {
  const up = await api.health
    .get({ fetch: { signal: AbortSignal.timeout(TIMEOUT_MS) } })
    .then(({ error }) => !error)
    .catch(() => false)
  if (up) return children

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center"
    >
      <Typography variant="h2">The API is not available</Typography>
      <Typography color="muted">
        The data server is not responding. Make sure it is running (
        <Typography variant="code">bun run dev</Typography>) and reload the page.
      </Typography>
    </div>
  )
}
