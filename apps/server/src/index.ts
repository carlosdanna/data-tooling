import { Elysia } from 'elysia'
import { env } from './env'
import { logger } from './logger'

export const app = new Elysia()
  .onAfterResponse(({ request, path, set }) => {
    logger.info({ method: request.method, path, status: set.status }, 'request')
  })
  .get('/health', () => ({ status: 'ok' }))

export type App = typeof app

if (import.meta.main) {
  app.listen(env.PORT)
  logger.info(`server listening on http://localhost:${env.PORT}`)
}
