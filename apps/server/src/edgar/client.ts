import { env } from '../env'
import { UpstreamError } from '../errors'
import { logger } from '../logger'

const MIN_SPACING_MS = 100 // SEC fair access: ≤10 req/s
let slot = Promise.resolve()

function throttle(): Promise<void> {
  const turn = slot
  slot = turn.then(() => Bun.sleep(MIN_SPACING_MS))
  return turn
}

async function edgarFetch(url: string): Promise<Response> {
  await throttle()
  const start = performance.now()
  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': env.SEC_USER_AGENT, 'Accept-Encoding': 'gzip, deflate' },
    })
  } catch (err) {
    logger.error({ url, err }, 'edgar request failed')
    throw new UpstreamError(`EDGAR unreachable: ${url}`)
  }
  const ms = Math.round(performance.now() - start)
  logger.info({ url, status: res.status, ms }, 'edgar request')
  if (!res.ok) throw new UpstreamError(`EDGAR returned ${res.status} for ${url}`)
  return res
}

export async function fetchJson<T>(url: string): Promise<T> {
  return (await (await edgarFetch(url)).json()) as T
}

export async function fetchText(url: string): Promise<string> {
  return (await edgarFetch(url)).text()
}
