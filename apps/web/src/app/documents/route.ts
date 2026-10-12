import type { NextRequest } from 'next/server'
import { api } from '@/lib/api'

/** Serves a sec.gov filing document (via the API) so the document dialog can frame it; sec.gov forbids framing. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') ?? ''
  const { data, error } = await api.documents.get({ query: { url } })
  if (error) {
    const body = error.value as { error?: { message?: string } } | undefined
    return new Response(body?.error?.message ?? 'Could not load document', {
      status: error.status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
  // <base> resolves the document's relative images against sec.gov and opens its links in a new tab.
  const base = `<base href="${url}" target="_blank">`
  return new Response(base + data, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // No scripts from the filing run on our origin; popups let its links open.
      'Content-Security-Policy': 'sandbox allow-popups allow-popups-to-escape-sandbox',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
