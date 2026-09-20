'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui_components/button'
import { DitherHero } from '@/components/docs-ui/DitherHero'

export function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-[0.28] mix-blend-screen [mask-image:linear-gradient(to_bottom,transparent,black_16%,black_55%,transparent)]">
        <DitherHero />
      </div>
      <div className="relative mx-auto flex max-w-4xl flex-col items-start gap-5 px-6 py-20 sm:py-28">
        <p className="rounded-full border border-line bg-surface-panel px-3 py-1 text-3xs font-medium uppercase tracking-wider text-fg-muted">
          HedgeHogs · Documentation
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold leading-tight text-fg-primary sm:text-4xl">
          Every protocol. One command center.
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-fg-secondary">
          How to use HedgeHogs — connect, deploy your account, and put your
          lending and liquidity on autopilot. Non-custodial: your positions
          live in <strong className="font-semibold text-fg-primary">your</strong>{' '}
          HedgeHog account, never with us.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button asChild variant="cta" size="lg">
            <Link href="/docs/get-started/quick-start">
              Get started <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/docs/how-it-works/architecture">How the account works</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}