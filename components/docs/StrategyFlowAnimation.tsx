'use client'
/**
 * StrategyFlowAnimation — the full Aave ↔ Uniswap loop, looping.
 *
 * Static: Wallet / HedgeHog account / Aave V3 / Uniswap V3 nodes + the six
 * rails, always complete. The animated layer runs one deposit's journey around
 * the loop — supply ETH, borrow USDC, provide liquidity, fees return,
 * harvest — with a phase caption that cycles. Reduced motion → the complete
 * flow, no tokens.
 */
import { motion, useTransform } from 'motion/react'
import { Wallet, Lock } from 'lucide-react'
import CryptoIcon from '@/components/CryptoIcon'
import DexIcon from '@/components/DexIcon'
import { DiagramShell } from '@/components/docs-ui/DiagramShell'
import { useDiagramLoop } from '@/lib/diagram/useDiagramLoop'
import { Node, RailToken, railPath, type Pt, type Rail } from './autoFlow'

const WALLET: Pt = { x: 0.13, y: 0.5 }
const ACCOUNT: Pt = { x: 0.42, y: 0.5 }
const AAVE: Pt = { x: 0.73, y: 0.26 }
const UNI: Pt = { x: 0.73, y: 0.76 }

const R_DEPOSIT: Rail = [WALLET, { x: 0.23, y: 0.5 }, { x: 0.31, y: 0.5 }, ACCOUNT]
const R_SUPPLY: Rail = [ACCOUNT, { x: 0.52, y: 0.4 }, { x: 0.6, y: 0.32 }, AAVE]
const R_BORROW: Rail = [AAVE, { x: 0.6, y: 0.32 }, { x: 0.52, y: 0.4 }, ACCOUNT]
const R_LP: Rail = [ACCOUNT, { x: 0.52, y: 0.6 }, { x: 0.6, y: 0.68 }, UNI]
const R_FEES: Rail = [UNI, { x: 0.6, y: 0.68 }, { x: 0.52, y: 0.6 }, ACCOUNT]
const R_HARVEST: Rail = [ACCOUNT, { x: 0.31, y: 0.5 }, { x: 0.23, y: 0.5 }, WALLET]

const RAILS: { rail: Rail; window: [number, number]; symbol: string; size?: number }[] = [
  { rail: R_DEPOSIT, window: [0.02, 0.09], symbol: 'ETH' },
  { rail: R_SUPPLY, window: [0.1, 0.17], symbol: 'ETH' },
  { rail: R_BORROW, window: [0.2, 0.27], symbol: 'USDC' },
  { rail: R_LP, window: [0.3, 0.37], symbol: 'USDC' },
  { rail: R_FEES, window: [0.42, 0.51], symbol: 'USDC', size: 16 },
  { rail: R_HARVEST, window: [0.6, 0.67], symbol: 'ETH', size: 16 },
]

const CAPTIONS: { text: string; window: [number, number] }[] = [
  { text: 'Supply ETH to Aave', window: [0.06, 0.16] },
  { text: 'Borrow USDC', window: [0.18, 0.28] },
  { text: 'Provide liquidity', window: [0.3, 0.4] },
  { text: 'Auto-repay & compound', window: [0.44, 0.56] },
  { text: 'Harvest to your wallet', window: [0.6, 0.7] },
]

export default function StrategyFlowAnimation() {
  const { scope, t, reduce } = useDiagramLoop({ period: 8200, amount: 0.25 })
  const drawDeposit = useTransform(t, [0, 0.07], [0, 1], { clamp: true })
  const drawRest = useTransform(t, [0.08, 0.5], [0, 1], { clamp: true })

  return (
    <DiagramShell label="The automated Aave ↔ Uniswap loop" ref={scope}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        {RAILS.map(({ rail }, i) => (
          <g key={i}>
            <path d={railPath(rail)} fill="none" stroke="rgb(var(--line))" strokeWidth={0.5} />
            <motion.path
              d={railPath(rail)}
              fill="none"
              stroke="rgb(var(--brand))"
              strokeOpacity={0.5}
              strokeWidth={0.6}
              strokeLinecap="round"
              style={{ pathLength: i === 0 ? drawDeposit : drawRest }}
            />
          </g>
        ))}
      </svg>

      {RAILS.map((r, i) => (
        <RailToken key={i} rail={r.rail} t={t} window={r.window} symbol={r.symbol} size={r.size ?? 20} />
      ))}

      {/* Phase caption */}
      <Node x={0.5} y={0.09} width={260}>
        <p className="text-center text-[10.5px] font-semibold text-fg-muted">
          {CAPTIONS.map((c, i) => (
            <Caption key={i} text={c.text} window={c.window} t={t} reduce={!!reduce} />
          ))}
        </p>
      </Node>

      {/* Wallet */}
      <Node x={WALLET.x} y={WALLET.y} width={110}>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface-panel p-2.5 shadow-panel-elevated">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-card text-fg-secondary">
            <Wallet className="h-3.5 w-3.5" aria-hidden />
          </span>
          <p className="text-[10.5px] font-semibold text-fg-primary">Your wallet</p>
        </div>
      </Node>

      {/* HedgeHog account */}
      <Node x={ACCOUNT.x} y={ACCOUNT.y} width={130}>
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-brand/40 bg-surface-panel p-2.5 shadow-panel-elevated ring-1 ring-brand/20">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-card text-brand">
            <Lock className="h-3.5 w-3.5" aria-hidden />
          </span>
          <p className="text-[10.5px] font-semibold text-fg-primary">HedgeHog account</p>
          <p className="text-[9px] text-fg-muted">owns every position</p>
        </div>
      </Node>

      {/* Aave */}
      <Node x={AAVE.x} y={AAVE.y} width={120}>
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface-panel p-2 shadow-panel-elevated">
          <DexIcon protocol="Aave" size={18} />
          <div className="min-w-0">
            <p className="truncate text-[10.5px] font-semibold text-fg-primary">Aave V3</p>
            <p className="truncate text-[9px] text-fg-muted">supply · borrow</p>
          </div>
        </div>
      </Node>

      {/* Uniswap */}
      <Node x={UNI.x} y={UNI.y} width={120}>
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface-panel p-2 shadow-panel-elevated">
          <DexIcon protocol="Uniswap" size={18} />
          <div className="min-w-0">
            <p className="truncate text-[10.5px] font-semibold text-fg-primary">Uniswap V3</p>
            <p className="truncate text-[9px] text-fg-muted">LP · fees</p>
          </div>
        </div>
      </Node>
    </DiagramShell>
  )
}

function Caption({ text, window, t, reduce }: { text: string; window: [number, number]; t: ReturnType<typeof useDiagramLoop>['t']; reduce: boolean }) {
  const [s, e] = window
  const opacity = useTransform(
    t,
    [s - 0.04, s, e, e + 0.04],
    reduce ? [0, 0, 0, 0] : [0, 1, 1, 0]
  )
  return <motion.span style={{ opacity }}>{text} </motion.span>
}