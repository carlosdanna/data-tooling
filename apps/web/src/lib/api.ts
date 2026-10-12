import 'server-only'
import { treaty } from '@elysiajs/eden'
import type { App } from 'server'

// no-store: the Elysia cache is the only cache layer.
// parseDate: false: Eden would turn "2025-10-31" into a Date at runtime while the types still say string.
export const api = treaty<App>(process.env.API_URL ?? 'http://localhost:3001', {
  fetch: { cache: 'no-store' },
  parseDate: false,
})
