import { Suspense } from 'react'
import { Typography } from '@/components/ui/typography'
import { api } from '@/lib/api'

async function Health() {
  const { data, error } = await api.health.get()
  if (error) {
    return (
      <Typography color="destructive">API unreachable (status {String(error.status)})</Typography>
    )
  }
  return (
    <Typography>
      API status: <Typography variant="code">{data.status}</Typography>
    </Typography>
  )
}

export default function Home() {
  return (
    <div className="flex flex-col gap-4">
      <Typography variant="h1">EDGAR Filings</Typography>
      <Suspense fallback={<Typography variant="muted">Checking API…</Typography>}>
        <Health />
      </Suspense>
    </div>
  )
}
