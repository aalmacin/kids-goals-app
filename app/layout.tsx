import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import { Providers } from './providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Kids Goals',
  description: 'Track daily chores, earn points, and redeem rewards',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Nonce is set by proxy.ts and used by Next.js to attach to script/style tags automatically
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" {...(nonce ? { 'data-nonce': nonce } : {})}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
