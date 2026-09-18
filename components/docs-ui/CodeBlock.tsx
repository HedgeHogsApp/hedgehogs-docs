'use client'

import { useCallback, useState } from 'react'
import { Check, Copy } from 'lucide-react'

function childText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(childText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return childText((node as { props: { children?: React.ReactNode } }).props?.children)
  }
  return ''
}

export function CodeBlock({ children, title }: { children?: React.ReactNode; title?: string }) {
  const [copied, setCopied] = useState(false)
  const code = childText(children).replace(/\n$/, '')

  const copy = useCallback(() => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    })
  }, [code])

  return (
    <div className="my-5 overflow-hidden rounded-lg border border-line bg-surface-panel">
      {(title || true) && (
        <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
          <span className="text-3xs font-medium uppercase tracking-wider text-fg-muted">
            {title ?? 'Code'}
          </span>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? 'Copied' : 'Copy code'}
            className="flex h-9 w-9 items-center justify-center rounded text-fg-muted transition-colors duration-fast hover:bg-surface-overlay/60 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-motion="on"
          >
            {copied ? <Check className="hh-check-draw h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      )}
      <pre className="scrollbar-thin overflow-x-auto p-4 text-2xs leading-relaxed text-fg-secondary">
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  )
}