import type { Metadata } from 'next'
import Providers from './components/providers/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>

        {children}
        </Providers>
        </body>
    </html>
  )
}
