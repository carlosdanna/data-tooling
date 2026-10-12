import { Elysia } from 'elysia'
import { env } from './env'
import { NotFoundError, UpstreamError } from './errors'
import { getTickers } from './edgar/tickers'
import { logger } from './logger'
import { companies } from './routes/companies'
import { documents } from './routes/documents'
import { filings } from './routes/filings'

export const app = new Elysia()
  .onAfterResponse(({ request, path, set }) => {
    logger.info({ method: request.method, path, status: set.status }, 'request')
  })
  // status() (not set.status + return) keeps the error body out of each route's success type.
  .onError(({ code, error, status }) => {
    const fail = (statusCode: 400 | 404 | 500 | 502, errorCode: string, message: string) =>
      status(statusCode, { error: { code: errorCode, message } })
    if (error instanceof NotFoundError) return fail(404, 'NOT_FOUND', error.message)
    if (error instanceof UpstreamError) return fail(502, 'UPSTREAM_ERROR', error.message)
    if (code === 'VALIDATION')
      return fail(400, 'VALIDATION_ERROR', error.all[0]?.summary ?? 'Invalid request')
    if (code === 'NOT_FOUND') return fail(404, 'NOT_FOUND', 'Route not found')
    logger.error({ err: error }, 'unhandled error')
    return fail(500, 'INTERNAL_ERROR', 'Internal server error')
  })
  .get('/health', () => ({ status: 'ok' }))
  .use(companies)
  .use(filings)
  .use(documents)

export type App = typeof app

if (import.meta.main) {
  app.listen(env.PORT)
  logger.info(`server listening on http://localhost:${env.PORT}`)
  // warm the ticker list so the first search doesn't wait on SEC
  getTickers().catch((err: unknown) => logger.warn({ err }, 'ticker warm-up failed'))
}
