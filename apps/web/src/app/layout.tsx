import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { Typography } from '@/components/ui/typography'
import './globals.css'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'EDGAR Filings',
  description: 'Browse and compare SEC EDGAR filings',
}

const nav = [
  { href: '/companies/AAPL', label: 'Filings' },
  { href: '/summary', label: 'Summary' },
] as const

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full font-sans antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/">
              <Typography as="span" variant="h4">
                EDGAR Filings
              </Typography>
            </Link>
            {nav.map(({ href, label }) => (
              <Link key={href} href={href}>
                <Typography
                  as="span"
                  variant="small"
                  color="muted"
                  className="hover:text-foreground"
                >
                  {label}
                </Typography>
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
