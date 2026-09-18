import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { MotionConfig } from 'motion/react'
import { DarkModeProvider } from '@/contexts/ThemeContext'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.hedgehogs.app'),
  title: {
    default: 'HedgeHogs Docs',
    template: '%s · HedgeHogs Docs',
  },
  description:
    'How to use HedgeHogs — the command center for your DeFi positions. The non-custodial account, lending, liquidity, automations and the protocols behind it.',
  openGraph: {
    title: 'HedgeHogs Docs',
    description: 'How to use the HedgeHogs command center for your DeFi positions.',
    type: 'website',
    images: [{ url: '/landing/overview-hero.png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body>
        <DarkModeProvider>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </DarkModeProvider>
      </body>
    </html>
  )
}