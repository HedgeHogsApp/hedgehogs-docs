'use client'

import { useEffect, useState } from 'react'

export interface TocHeading {
  id: string
  title: string
  level: number
}

interface TocRailProps {
  headings: TocHeading[]
}

export function TocRail({ headings }: TocRailProps) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)

  useEffect(() => {
    if (headings.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-80px 0px -70% 0px' }
    )
    for (const h of headings) {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <aside aria-label="On this page" className="hidden w-52 shrink-0 lg:block">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto py-2 pl-4">
        <p className="pb-2 text-3xs font-semibold uppercase tracking-wider text-fg-muted">
          On this page
        </p>
        <ul className="flex flex-col gap-0.5">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                aria-current={activeId === h.id ? 'location' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  const el = document.getElementById(h.id)
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    history.replaceState(null, '', `#${h.id}`)
                  }
                }}
                className="relative block rounded px-3 py-1.5 text-2xs leading-snug text-fg-muted transition-colors duration-fast hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ paddingLeft: h.level === 3 ? '2rem' : undefined }}
                data-motion="on"
              >
                {activeId === h.id && (
                  <span
                    className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-brand"
                    aria-hidden="true"
                  />
                )}
                {h.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}