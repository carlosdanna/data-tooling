import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import Link from 'next/link'
import { Suspense } from 'react'
import { ApiGate } from '@/components/api-gate'
import { Typography } from '@/components/ui/typography'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'EDGAR Filings',
  description: 'Browse and compare SEC EDGAR filings',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={cn('h-full', 'antialiased', geistMono.variable, 'font-sans', inter.variable)}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/">
              <Typography as="span" variant="h4">
                EDGAR Filings
              </Typography>
            </Link>
            <Link href="/summary">
              <Typography as="span" size="sm" color="muted" className="hover:text-foreground">
                Summary
              </Typography>
            </Link>
          </nav>
        </header>
        {/* password-manager extensions (e.g. Proton Pass) tag the form container before hydration */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8" suppressHydrationWarning>
          <Suspense>
            <ApiGate>{children}</ApiGate>
          </Suspense>
        </main>
      </body>
    </html>
  )
}
