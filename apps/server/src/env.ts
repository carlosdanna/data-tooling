const port = Number(process.env.PORT || 3001)
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`PORT must be a positive integer, got "${process.env.PORT}"`)
}

const secUserAgent = process.env.SEC_USER_AGENT?.trim()
if (!secUserAgent) {
  throw new Error('SEC_USER_AGENT is required (e.g. "Jane Doe jane@example.com"); see .env.example')
}

export const env = { PORT: port, SEC_USER_AGENT: secUserAgent }
