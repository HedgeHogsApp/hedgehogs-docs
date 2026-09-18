import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface GuideCardProps {
  href: string
  icon?: React.ReactNode
  title: string
  children: React.ReactNode
}

/** Homepage guide grid card — stretched link, hover lift, one accent. */
export function GuideCard({ href, icon, title, children }: GuideCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-2 rounded-lg border border-line bg-surface-panel p-4 transition-colors duration-fast hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-motion="on"
    >
      {icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-card text-brand">
          {icon}
        </span>
      )}
      <span className="text-sm font-semibold text-fg-primary group-hover:text-brand">
        {title}
      </span>
      <span className="text-2xs leading-relaxed text-fg-muted">{children}</span>
      <ArrowRight className="absolute right-4 top-4 h-4 w-4 text-fg-muted opacity-0 transition-opacity duration-fast group-hover:opacity-100" />
    </Link>
  )
}