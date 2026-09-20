'use client'
/**
 * AutoRebalanceAnimation — price drifts out of the band, the band re-centers,
 * looping. Static: the price history + the band re-centered on the price (the
 * result). Animated: the price dot climbs, the band slides to follow. Reduced
 * motion → the rebalanced, complete frame.
 */
import { motion, useTransform } from 'motion/react'
import { DiagramShell } from '@/components/docs-ui/DiagramShell'
import { useDiagramLoop } from '@/lib/diagram/useDiagramLoop'

const REBALANCE = '#A78BFA'
const PRICE = [
  [12, 44], [26, 41], [40, 38], [54, 33], [68, 29], [84, 24],
] as const

export default function AutoRebalanceAnimation() {
  const { scope, t, reduce } = useDiagramLoop({ period: 5600 })

  const dotX = useTransform(t, [0, 0.5], [PRICE[0][0], PRICE[PRICE.length - 1][0]])
  const dotY = useTransform(t, [0, 0.5], [PRICE[0][1], PRICE[PRICE.length - 1][1]])
  // Band starts centered on the start price, re-centers on the end price.
  const bandY = useTransform(t, [0, 0.55, 0.8], reduce ? [22, 22, 22] : [40, 40, 22])

  const inOpacity = useTransform(t, [0, 0.22, 0.32], reduce ? [0, 0, 0] : [1, 1, 0])
  const outOpacity = useTransform(t, [0.28, 0.38, 0.58], reduce ? [0, 0, 0] : [0, 1, 0])
  const doneOpacity = useTransform(t, [0.54, 0.66, 0.9], reduce ? [1, 1, 1] : [0, 1, 1])

  return (
    <DiagramShell label="Auto-rebalance" ref={scope}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        {/* Price history */}
        <polyline
          points={PRICE.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke="var(--anim-primary)"
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.85}
        />
        {/* The range band — translated as a group (band rect + boundary lines) */}
        <motion.g style={{ y: bandY }}>
          <rect x={8} width={88} height={9} rx={2} fill={REBALANCE} opacity={0.16} />
          <line x1={8} y1={0} x2={96} y2={0} stroke={REBALANCE} strokeWidth={1} strokeDasharray="3 3" />
          <line x1={8} y1={9} x2={96} y2={9} stroke={REBALANCE} strokeWidth={1} strokeDasharray="3 3" />
        </motion.g>
        <text x={9} y={18} fontSize={5} fontWeight={600} fill={REBALANCE} fontFamily="liebling, ui-sans-serif, system-ui">
          Your range
        </text>
        {/* Current price dot */}
        <motion.circle r={3.4} fill="var(--anim-primary)" stroke="var(--anim-card)" strokeWidth={1.4} style={{ cx: dotX, cy: dotY }} />

        {/* Phase tags */}
        <motion.text x={50} y={57} fontSize={7} fontWeight={700} fill="var(--anim-primary)" textAnchor="middle" style={{ opacity: inOpacity }} fontFamily="liebling, ui-sans-serif, system-ui">
          In range
        </motion.text>
        <motion.text x={50} y={57} fontSize={7} fontWeight={700} fill="#f59e0b" textAnchor="middle" style={{ opacity: outOpacity }} fontFamily="liebling, ui-sans-serif, system-ui">
          Out of range — rebalancing
        </motion.text>
        <motion.text x={50} y={57} fontSize={7} fontWeight={700} fill="var(--anim-primary)" textAnchor="middle" style={{ opacity: doneOpacity }} fontFamily="liebling, ui-sans-serif, system-ui">
          Rebalanced · back in range
        </motion.text>
      </svg>
    </DiagramShell>
  )
}