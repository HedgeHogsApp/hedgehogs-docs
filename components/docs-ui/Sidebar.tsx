'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { DURATION_S, EASE_OUT_QUART } from '@/lib/motion/tokens'
import type { NavSection } from '@/lib/docs/nav'

interface SidebarProps {
  sections: NavSection[]
  onNavigate?: () => void
}

function NavTree({ sections, onNavigate, current }: { sections: NavSection[]; current: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.key}>
          <p className="px-2 pb-2 text-3xs font-semibold uppercase tracking-wider text-fg-muted">
            {section.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = current === item.slug
              const href = `/docs/${item.slug}`
              return (
                <li key={item.slug} className="relative">
                  {active && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      transition={{ duration: DURATION_S.base, ease: EASE_OUT_QUART }}
                      className="absolute inset-0 rounded-lg bg-surface-overlay/70"
                      aria-hidden="true"
                    />
                  )}
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className="relative flex min-h-11 items-center rounded-lg px-3 py-2 text-2xs text-fg-secondary transition-colors duration-fast hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[current=true]:text-fg-primary"
                    data-current={active || undefined}
                    data-motion="on"
                  >
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function Sidebar({ sections, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const current = pathname.replace(/^\/docs\//, '')

  return (
    <nav aria-label="Documentation" className="scrollbar-hide h-full overflow-y-auto px-3 py-6">
      <NavTree sections={sections} current={current} onNavigate={onNavigate} />
    </nav>
  )
}