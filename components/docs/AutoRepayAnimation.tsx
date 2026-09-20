'use client'
/**
 * AutoRepayAnimation — LP fees → repay debt → health factor recovers, looping.
 * Static: LP node, the debt bar (already repaid), the Health Factor ↑ chip.
 * Animated: a fee coin travels to the debt and the bar shrinks. Reduced motion
 * → the repaid, complete frame.
 */
import { motion, useTransform } from 'motion/react'
import { DiagramShell } from '@/components/docs-ui/DiagramShell'
import { useDiagramLoop } from '@/lib/diagram/useDiagramLoop'
import { Chip, Node, RailToken, railPath, type Pt, type Rail } from './autoFlow'

const LP: Pt = { x: 0.28, y: 0.5 }
const DEBT: Pt = { x: 0.72, y: 0.5 }
const RAIL: Rail = [LP, { x: 0.44, y: 0.5 }, { x: 0.56, y: 0.5 }, DEBT]

export default function AutoRepayAnimation() {
  const { scope, t, reduce } = useDiagramLoop({ period: 5000 })
  // Debt fill starts full and shrinks to ~35% as the coin repays.
  const debtFill = useTransform(t, [0.3, 0.62], reduce ? [0.35, 0.35] : [1, 0.35])
  const chipOpacity = useTransform(t, [0.5, 0.66], reduce ? [1, 1] : [0, 1])
  const draw = useTransform(t, [0.2, 0.5], [0, 1], { clamp: true })

  return (
    <DiagramShell label="Auto-repay" ref={scope}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d={railPath(RAIL)} fill="none" stroke="rgb(var(--line))" strokeWidth={0.5} />
        <motion.path
          d={railPath(RAIL)}
          fill="none"
          stroke="rgb(var(--brand))"
          strokeOpacity={0.5}
          strokeWidth={0.7}
          strokeLinecap="round"
          style={{ pathLength: draw }}
        />
      </svg>

      <RailToken rail={RAIL} t={t} window={[0.24, 0.5]} symbol="USDC" />

      <Node x={LP.x} y={LP.y} width={140}>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface-panel px-3 py-3 shadow-panel-elevated">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card text-[11px] font-bold text-fg-primary">
            LP
          </span>
          <p className="text-[11px] font-semibold text-fg-primary">Fees earned</p>
        </div>
      </Node>

      <Node x={DEBT.x} y={DEBT.y} width={150}>
        <div className="rounded-2xl border border-line bg-surface-panel px-4 py-3 shadow-panel-elevated">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-fg-primary">Debt</p>
            <p className="text-[10px] text-fg-muted">repaying</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <motion.div className="h-full origin-left rounded-full bg-warning" style={{ scaleX: debtFill }} />
          </div>
        </div>
      </Node>

      <motion.div style={{ opacity: chipOpacity }}>
        <Chip x={0.72} y={0.18} tone="text-success">Health factor ↑</Chip>
      </motion.div>
    </DiagramShell>
  )
}