import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbProps {
  section: string
  sectionTitle: string
  pageTitle?: string
}

export function Breadcrumb({ section, sectionTitle, pageTitle }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-3xs text-fg-muted">
      <Link
        href="/"
        className="rounded py-1 transition-colors duration-fast hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Docs
      </Link>
      <ChevronRight className="h-3 w-3" aria-hidden="true" />
      <Link
        href={`/docs/${section}`}
        className="rounded py-1 transition-colors duration-fast hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {sectionTitle}
      </Link>
      {pageTitle && (
        <>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <span className="py-1 text-fg-primary">{pageTitle}</span>
        </>
      )}
    </nav>
  )
}