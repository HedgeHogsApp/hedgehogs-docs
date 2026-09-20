'use client'
/**
 * AutoCompoundAnimation — fees → reinvest → growth, looping.
 * Static: the LP node (grown) + orbit + caption. Animated: a fee coin orbits
 * the LP and the LP pulses larger. Reduced motion → the grown, complete frame.
 */
import { motion, useTransform } from 'motion/react'
import { DiagramShell } from '@/components/docs-ui/DiagramShell'
import { useDiagramLoop } from '@/lib/diagram/useDiagramLoop'
import { Chip, Node, RailToken, railPath, type Pt, type Rail } from './autoFlow'

const LP: Pt = { x: 0.5, y: 0.42 }
const ORBIT: Rail = [
  LP,
  { x: 0.76, y: 0.16 },
  { x: 0.86, y: 0.5 },
  { x: 0.76, y: 0.84 },
]

export default function AutoCompoundAnimation() {
  const { scope, t, reduce } = useDiagramLoop({ period: 5000 })
  const lpPulse = useTransform(t, [0, 0.5, 1], reduce ? [1, 1, 1] : [1, 1.1, 1])
  const draw = useTransform(t, [0.06, 0.7], [0, 1], { clamp: true })

  return (
    <DiagramShell label="Auto-compound" ref={scope}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d={railPath(ORBIT)} fill="none" stroke="rgb(var(--line))" strokeWidth={0.5} strokeDasharray="3 3" />
        <motion.path
          d={railPath(ORBIT)}
          fill="none"
          stroke="rgb(var(--brand))"
          strokeOpacity={0.5}
          strokeWidth={0.7}
          strokeLinecap="round"
          style={{ pathLength: draw }}
        />
      </svg>

      <RailToken rail={ORBIT} t={t} window={[0.1, 0.8]} symbol="USDC" />

      <motion.div style={{ scale: lpPulse }}>
        <Node x={LP.x} y={LP.y} width={150}>
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-brand/40 bg-surface-panel px-4 py-3 shadow-panel-elevated ring-1 ring-brand/20">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-[12px] font-bold text-fg-primary">
              LP
            </span>
            <p className="text-[11px] font-semibold text-fg-primary">Position</p>
            <p className="text-[10px] text-success">reinvesting fees</p>
          </div>
        </Node>
      </motion.div>

      <Chip x={0.5} y={0.88}>Reinvest fees for exponential growth</Chip>
    </DiagramShell>
  )
}