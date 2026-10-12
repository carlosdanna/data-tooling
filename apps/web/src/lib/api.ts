import 'server-only'
import { treaty } from '@elysiajs/eden'
import type { App } from 'server'

// no-store: the Elysia cache is the only cache layer.
export const api = treaty<App>(process.env.API_URL ?? 'http://localhost:3001', {
  fetch: { cache: 'no-store' },
})
