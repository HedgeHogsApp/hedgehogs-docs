import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { NavItem } from '@/lib/docs/nav'

interface PrevNextProps {
  prev: NavItem | null
  next: NavItem | null
}

export function PrevNext({ prev, next }: PrevNextProps) {
  if (!prev && !next) return null
  return (
    <nav aria-label="Previous and next pages" className="mt-12 border-t border-line pt-6">
      <div className="flex items-stretch justify-between gap-4">
        {prev ? (
          <Link
            href={`/docs/${prev.slug}`}
            className="group flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-line bg-surface-panel px-4 transition-colors duration-fast hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-motion="on"
          >
            <ChevronLeft className="h-4 w-4 shrink-0 text-fg-muted transition-colors duration-fast group-hover:text-brand" />
            <span className="min-w-0">
              <span className="block text-3xs uppercase tracking-wider text-fg-muted">Previous</span>
              <span className="block truncate text-2xs text-fg-primary group-hover:text-brand">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/docs/${next.slug}`}
            className="group flex min-h-11 flex-1 items-center justify-end gap-2 rounded-lg border border-line bg-surface-panel px-4 text-right transition-colors duration-fast hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-motion="on"
          >
            <span className="min-w-0">
              <span className="block text-3xs uppercase tracking-wider text-fg-muted">Next</span>
              <span className="block truncate text-2xs text-fg-primary group-hover:text-brand">{next.title}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-fg-muted transition-colors duration-fast group-hover:text-brand" />
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </div>
    </nav>
  )
}