'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Search as SearchIcon, FileText } from 'lucide-react'
import { DURATION_S, EASE_OUT_QUART } from '@/lib/motion/tokens'

interface IndexEntry {
  title: string
  description: string
  url: string
}

function highlight(text: string, query: string): React.ReactNode {
  const q = query.trim().toLowerCase()
  if (!q) return text
  const i = text.toLowerCase().indexOf(q)
  if (i === -1) return text
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-brand/15 text-fg-primary">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

export function Search() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<IndexEntry[] | null>(null)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/search-index.json')
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => setIndex([]))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
    else setActive(0)
  }, [open])

  const results = useMemo(() => {
    if (!index) return []
    const q = query.trim().toLowerCase()
    if (!q) return index.slice(0, 6)
    return index
      .filter((e) => (e.title + ' ' + e.description).toLowerCase().includes(q))
      .slice(0, 8)
  }, [index, query])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-40 items-center gap-2 rounded-lg border border-line bg-surface-panel px-3 text-2xs text-fg-muted transition-colors duration-fast hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-motion="on"
      >
        <SearchIcon className="h-4 w-4" />
        <span>Search</span>
        <kbd className="ml-auto rounded border border-line bg-surface-card px-1.5 py-0.5 text-3xs text-fg-muted">
          ⌘K
        </kbd>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-floating" onClick={() => setOpen(false)} />
          <motion.div
            role="dialog"
            aria-label="Search documentation"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: DURATION_S.base, ease: EASE_OUT_QUART }}
            className="absolute right-0 top-12 z-floating w-80 overflow-hidden rounded-xl border border-line bg-surface-overlay shadow-panel-elevated"
            data-motion="on"
          >
            <div className="flex items-center gap-2 border-b border-line px-3">
              <SearchIcon className="h-4 w-4 text-fg-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActive((a) => Math.min(a + 1, results.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActive((a) => Math.max(a - 1, 0))
                  } else if (e.key === 'Enter' && results[active]) {
                    window.location.href = results[active].url
                  }
                }}
                placeholder="Search the docs…"
                className="h-12 flex-1 bg-transparent text-sm text-fg-primary placeholder:text-fg-muted focus:outline-none"
                aria-label="Search query"
              />
            </div>
            <ul role="listbox" aria-label="Search results" className="max-h-80 overflow-y-auto py-1">
              {results.length === 0 && (
                <li className="px-3 py-3 text-2xs text-fg-muted">
                  {index === null ? 'Loading index…' : 'No results.'}
                </li>
              )}
              {results.map((r, i) => (
                <li key={r.url} role="option" aria-selected={i === active}>
                  <Link
                    href={r.url}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-start gap-2.5 px-3 py-2.5 transition-colors duration-fast ${
                      i === active ? 'bg-surface-card' : ''
                    }`}
                    data-motion="on"
                  >
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-muted" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-fg-primary">
                        {highlight(r.title, query)}
                      </span>
                      <span className="block truncate text-2xs text-fg-muted">
                        {r.description || r.url}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </>
      )}
    </div>
  )
}