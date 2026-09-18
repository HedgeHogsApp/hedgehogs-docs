import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Bot,
  Boxes,
  BookOpen,
  Coins,
  Droplets,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  Network,
  Rocket,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { HomeHero } from '@/components/docs-ui/HomeHero'
import { GuideCard } from '@/components/docs-ui/GuideCard'
import { getNavTree } from '@/lib/docs/nav'

export const metadata: Metadata = {
  title: 'HedgeHogs Docs',
}

const SECTION_ICONS: Record<string, LucideIcon> = {
  'get-started': Rocket,
  'how-it-works': Network,
  portfolio: LayoutDashboard,
  lending: Landmark,
  liquidity: Droplets,
  automations: Bot,
  protocols: Boxes,
  reference: BookOpen,
  security: ShieldCheck,
  faq: HelpCircle,
}

export default function HomePage() {
  const sections = getNavTree()

  return (
    <div className="min-h-screen">
      <HomeHero />

      <div className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="text-xl font-semibold text-fg-primary">Explore the docs</h2>
        <p className="mt-1 max-w-xl text-sm text-fg-muted">
          Start with the onboarding path, or jump straight to the surface you use.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {sections.map((section) => {
            const Icon = SECTION_ICONS[section.key] ?? BookOpen
            const first = section.items[0]
            return (
              <GuideCard
                key={section.key}
                href={`/docs/${first?.slug ?? section.key}`}
                icon={<Icon className="h-4 w-4" aria-hidden />}
                title={section.title}
              >
                {first?.description ?? section.items.length + ' pages'}
              </GuideCard>
            )
          })}
        </div>

        <div className="mt-14 rounded-2xl border border-line bg-surface-panel p-6">
          <h3 className="text-sm font-semibold text-fg-primary">Resources</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: 'The app', href: 'https://hedgehogs.app' },
              { label: 'Status', href: 'https://status.hedgehogs.app' },
              { label: 'GitHub', href: 'https://github.com/HedgeHogsApp' },
            ].map((r) => (
              <a
                key={r.label}
                href={r.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-line bg-surface-card px-4 py-2 text-2xs text-fg-secondary transition-colors duration-fast hover:border-line-strong hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-motion="on"
              >
                {r.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-8 text-3xs text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} HedgeHogs</span>
          <span className="flex items-center gap-4">
            <Link href="/docs/security/overview" className="hover:text-fg-primary">
              Security
            </Link>
            <Link href="/docs/faq" className="hover:text-fg-primary">
              FAQ
            </Link>
            <span>docs.hedgehogs.app</span>
          </span>
        </div>
      </footer>
    </div>
  )
}