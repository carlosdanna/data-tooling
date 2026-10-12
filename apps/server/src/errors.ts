export class NotFoundError extends Error {
  override name = 'NotFoundError'
}

export class UpstreamError extends Error {
  override name = 'UpstreamError'
}
