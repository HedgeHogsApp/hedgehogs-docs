'use client'

import { forwardRef } from 'react'

interface DiagramShellProps {
  label?: string
  caption?: string
  children: React.ReactNode
}

/** Shared chrome for every diagram: label + panel + the scene area. */
export const DiagramShell = forwardRef<HTMLDivElement, DiagramShellProps>(
  function DiagramShell({ label, caption, children }, ref) {
    return (
      <div
        ref={ref}
        className="my-8 rounded-2xl border border-line bg-surface-panel/60 p-4 sm:p-6"
        data-diagram-shell=""
      >
        {label && (
          <p className="mb-4 text-3xs font-semibold uppercase tracking-wider text-fg-muted">
            {label}
          </p>
        )}
        <div className="relative mx-auto aspect-[5/3] w-full max-w-3xl">{children}</div>
        {caption && <p className="mt-4 text-center text-3xs text-fg-muted">{caption}</p>}
      </div>
    )
  }
)

export default DiagramShell