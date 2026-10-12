import { NextResponse, type NextRequest } from 'next/server'
import { parseTickers, summaryHref } from './app/summary/params'

const COOKIE = 'summary-tickers'

/** /summary remembers the last comparison: a bare visit restores it, any ?tickers= saves it. */
export function proxy(req: NextRequest) {
  const param = req.nextUrl.searchParams.get('tickers')
  if (param === null) {
    const saved = parseTickers(req.cookies.get(COOKIE)?.value)
    return saved.length
      ? NextResponse.redirect(new URL(summaryHref(saved), req.url))
      : NextResponse.next()
  }
  const res = NextResponse.next()
  res.cookies.set(COOKIE, parseTickers(param).join(','), {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return res
}

export const config = { matcher: '/summary' }
