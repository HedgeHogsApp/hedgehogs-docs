import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

const TONES = {
  info: { Icon: Info, text: 'text-info', rule: 'border-brand/40', bg: 'bg-surface-card' },
  success: { Icon: CheckCircle2, text: 'text-success', rule: 'border-success/40', bg: 'bg-surface-card' },
  warning: { Icon: AlertTriangle, text: 'text-warning', rule: 'border-warning/40', bg: 'bg-surface-card' },
  danger: { Icon: AlertCircle, text: 'text-danger-fg', rule: 'border-danger/40', bg: 'bg-surface-card' },
} as const

interface CalloutProps {
  tone?: keyof typeof TONES
  title?: string
  children: React.ReactNode
}

export function Callout({ tone = 'info', title, children }: CalloutProps) {
  const { Icon, text, rule, bg } = TONES[tone]
  return (
    <div className={`my-5 rounded-lg border-l-2 ${rule} ${bg} p-4`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${text}`} aria-hidden="true" />
        <div className="min-w-0">
          {title && <p className="text-sm font-semibold text-fg-primary">{title}</p>}
          <div className="text-sm text-fg-secondary">{children}</div>
        </div>
      </div>
    </div>
  )
}