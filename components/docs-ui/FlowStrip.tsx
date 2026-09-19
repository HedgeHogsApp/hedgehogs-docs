import { ArrowRight } from 'lucide-react'

export interface FlowStep {
  icon: React.ReactNode
  label: string
  detail?: string
}

/** A compact horizontal flow: step chips joined by arrows (wallet → account → protocol). */
export function FlowStrip({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="my-6 flex flex-wrap items-center gap-y-3 rounded-lg border border-line bg-surface-panel p-4">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          {i > 0 && (
            <ArrowRight className="mx-3 h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
          )}
          <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-card px-3 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-panel text-fg-secondary">
              {step.icon}
            </span>
            <div className="min-w-0">
              <p className="text-2xs font-semibold text-fg-primary">{step.label}</p>
              {step.detail && <p className="truncate text-3xs text-fg-muted">{step.detail}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FlowStrip