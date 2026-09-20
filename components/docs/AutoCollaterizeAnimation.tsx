'use client'
/**
 * AutoCollateralizeAnimation — fees → extra collateral, looping.
 * Static: LP node + the collateral bar (already raised) + the shield. Animated:
 * a fee coin travels to the collateral and the bar rises. Reduced motion → the
 * raised, complete frame.
 */
import { motion, useTransform } from 'motion/react'
import { Shield } from 'lucide-react'
import { DiagramShell } from '@/components/docs-ui/DiagramShell'
import { useDiagramLoop } from '@/lib/diagram/useDiagramLoop'
import { Node, RailToken, railPath, type Pt, type Rail } from './autoFlow'

const LP: Pt = { x: 0.28, y: 0.5 }
const COLLAT: Pt = { x: 0.74, y: 0.5 }
const RAIL: Rail = [LP, { x: 0.44, y: 0.5 }, { x: 0.56, y: 0.5 }, COLLAT]

export default function AutoCollaterizeAnimation() {
  const { scope, t, reduce } = useDiagramLoop({ period: 5000 })
  const barFill = useTransform(t, [0.3, 0.62], reduce ? [0.88, 0.88] : [0.45, 0.88])
  const shieldOpacity = useTransform(t, [0.5, 0.68], reduce ? [1, 1] : [0, 1])
  const draw = useTransform(t, [0.2, 0.5], [0, 1], { clamp: true })

  return (
    <DiagramShell label="Auto-collateralize" ref={scope}>
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

      <Node x={COLLAT.x} y={COLLAT.y} width={150}>
        <div className="rounded-2xl border border-line bg-surface-panel px-4 py-3 shadow-panel-elevated">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-fg-primary">Collateral</p>
            <p className="text-[10px] text-fg-muted">strengthening</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <motion.div className="h-full origin-left rounded-full bg-brand" style={{ scaleX: barFill }} />
          </div>
        </div>
      </Node>

      <motion.div style={{ opacity: shieldOpacity }}>
        <Node x={COLLAT.x} y={0.16} width={160}>
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-success">
            <Shield className="h-3.5 w-3.5" aria-hidden /> Health factor hardened
          </p>
        </Node>
      </motion.div>
    </DiagramShell>
  )
}