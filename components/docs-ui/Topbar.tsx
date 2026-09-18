'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui_components/button'
import LogoText from '@/components/ui/LogoText'
import { Search } from '@/components/docs-ui/Search'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-header h-14 border-b border-line bg-surface-page/80 backdrop-blur-md">
      <div className="flex h-full items-center gap-3 px-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-fg-secondary hover:bg-surface-overlay/60 lg:hidden"
          data-motion="on"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogoText forceDark />
        </Link>
        <nav aria-label="Docs site" className="ml-4 hidden items-center gap-1 md:flex">
          {[
            { label: 'App', href: 'https://hedgehogs.app' },
            { label: 'GitHub', href: 'https://github.com/HedgeHogsApp' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="rounded-lg px-3 py-2 text-2xs text-fg-muted transition-colors duration-fast hover:bg-surface-overlay/60 hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-motion="on"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center">
          <Search />
        </div>
      </div>
    </header>
  )
}