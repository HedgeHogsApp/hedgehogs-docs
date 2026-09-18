'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

const GITHUB_ISSUES = 'https://github.com/HedgeHogsApp/hedgehogs-docs/issues/new'

/** "Was this helpful?" — static, no backend: opens a prefilled GitHub issue. */
export function Feedback() {
  const [answered, setAnswered] = useState<'yes' | 'no' | null>(null)

  const body = (answer: string) =>
    encodeURIComponent(`**Page:** ${typeof window !== 'undefined' ? window.location.pathname : ''}\n**Vote:** ${answer}\n\nFeedback:`)

  return (
    <div className="mt-10 flex items-center gap-3 rounded-lg border border-line bg-surface-panel px-4 py-3">
      <span className="text-2xs text-fg-muted">
        {answered === null ? 'Was this page helpful?' : answered === 'yes' ? 'Thanks — glad it helped.' : 'Thanks — how can it be better?'}
      </span>
      {answered === null ? (
        <span className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAnswered('yes')}
            className="flex h-9 items-center rounded-md px-3 text-2xs text-fg-secondary transition-colors duration-fast hover:bg-surface-overlay/60 hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-motion="on"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setAnswered('no')}
            className="flex h-9 items-center rounded-md px-3 text-2xs text-fg-secondary transition-colors duration-fast hover:bg-surface-overlay/60 hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-motion="on"
          >
            No
          </button>
        </span>
      ) : (
        <a
          href={`${GITHUB_ISSUES}?title=Docs%20feedback&body=${body(answered)}`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex h-9 items-center gap-1.5 rounded-md px-3 text-2xs text-brand hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-motion="on"
        >
          Open a GitHub issue <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      )}
    </div>
  )
}