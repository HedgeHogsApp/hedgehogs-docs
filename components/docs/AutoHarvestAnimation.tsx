'use client'
/**
 * AutoHarvestAnimation — rewards → wallet, looping.
 * Static: LP node + wallet node + caption. Animated: three reward coins travel
 * to the wallet and the wallet glows. Reduced motion → the complete frame.
 */
import { motion, useTransform } from 'motion/react'
import { Wallet } from 'lucide-react'
import { DiagramShell } from '@/components/docs-ui/DiagramShell'
import { useDiagramLoop } from '@/lib/diagram/useDiagramLoop'
import { Node, RailToken, railPath, type Pt, type Rail } from './autoFlow'

const LP: Pt = { x: 0.28, y: 0.5 }
const WALLET: Pt = { x: 0.74, y: 0.5 }
const RAIL: Rail = [LP, { x: 0.44, y: 0.5 }, { x: 0.56, y: 0.5 }, WALLET]

export default function AutoHarvestAnimation() {
  const { scope, t, reduce } = useDiagramLoop({ period: 5200 })
  const glow = useTransform(t, [0.5, 0.68], reduce ? [0, 0] : [0, 1])

  return (
    <DiagramShell label="Auto-harvest" ref={scope}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d={railPath(RAIL)} fill="none" stroke="rgb(var(--line))" strokeWidth={0.5} />
      </svg>

      {[
        [0.1, 0.34],
        [0.22, 0.46],
        [0.34, 0.58],
      ].map((w, i) => (
        <RailToken key={i} rail={RAIL} t={t} window={w as [number, number]} symbol={i === 1 ? 'ETH' : 'USDC'} size={18} />
      ))}

      <Node x={LP.x} y={LP.y} width={140}>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface-panel px-3 py-3 shadow-panel-elevated">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card text-[11px] font-bold text-fg-primary">
            LP
          </span>
          <p className="text-[11px] font-semibold text-fg-primary">Rewards earned</p>
        </div>
      </Node>

      <motion.div style={{ opacity: glow }}>
        <Node x={WALLET.x} y={WALLET.y} width={140}>
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-brand/40 bg-surface-panel px-3 py-3 shadow-panel-elevated ring-1 ring-brand/20">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card text-brand">
              <Wallet className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-[11px] font-semibold text-fg-primary">Your wallet</p>
            <p className="text-[10px] text-success">profits arrive</p>
          </div>
        </Node>
      </motion.div>
    </DiagramShell>
  )
}