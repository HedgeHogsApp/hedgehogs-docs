'use client'
/**
 * ArchitectureDiagram — the non-custodial story, looping.
 *
 * Static content: wallet / HedgeHog account / Aave / Uniswap nodes, the
 * "Non-custodial" banner and the bot-lock pill — always complete. The animated
 * layer loops tokens along the rails (deposit, then positions) and pulses the
 * account. Under `prefers-reduced-motion` t stays at 1 → the complete frame.
 */
import { motion, useTransform } from 'motion/react'
import { Lock, Unlock } from 'lucide-react'
import CryptoIcon from '@/components/CryptoIcon'
import DexIcon from '@/components/DexIcon'
import { DiagramShell } from '@/components/docs-ui/DiagramShell'
import { useDiagramLoop } from '@/lib/diagram/useDiagramLoop'

type Pt = { x: number; y: number }
type Rail = readonly [Pt, Pt, Pt, Pt]

const WALLET = { x: 0.16, y: 0.5 }
const ACCOUNT = { x: 0.5, y: 0.5 }
const AAVE = { x: 0.84, y: 0.22 }
const UNI = { x: 0.84, y: 0.78 }

const RAIL_DEPOSIT: Rail = [WALLET, { x: 0.3, y: 0.5 }, { x: 0.4, y: 0.5 }, ACCOUNT]
const RAIL_AAVE: Rail = [ACCOUNT, { x: 0.64, y: 0.32 }, { x: 0.72, y: 0.22 }, AAVE]
const RAIL_UNI: Rail = [ACCOUNT, { x: 0.64, y: 0.68 }, { x: 0.72, y: 0.78 }, UNI]

function bezier(rail: Rail, t: number, axis: 'x' | 'y'): number {
  const u = 1 - t
  const [p0, p1, p2, p3] = rail
  return (
    u * u * u * p0[axis] + 3 * u * u * t * p1[axis] + 3 * u * t * t * p2[axis] + t * t * t * p3[axis]
  )
}

function railPath(rail: Rail): string {
  const [p0, p1, p2, p3] = rail
  const X = (v: number) => (v * 100).toFixed(2)
  const Y = (v: number) => (v * 60).toFixed(2)
  return `M ${X(p0.x)} ${Y(p0.y)} C ${X(p1.x)} ${Y(p1.y)} ${X(p2.x)} ${Y(p2.y)} ${X(p3.x)} ${Y(p3.y)}`
}

function useRailToken(
  rail: Rail,
  t: ReturnType<typeof useDiagramLoop>['t'],
  window: [number, number],
  size: number
) {
  const local = useTransform(t, window, [0, 1], { clamp: true })
  const x = useTransform(local, (v) => bezier(rail, v, 'x'))
  const y = useTransform(local, (v) => bezier(rail, v, 'y'))
  const opacity = useTransform(local, [0, 0.08, 0.85, 1], [0, 1, 1, 0])
  const scale = useTransform(local, [0, 0.12, 1], [0.7, 1, 0.82])
  const px = useTransform(x, (v) => `${v * 100}%`)
  const py = useTransform(y, (v) => `${v * 60}%`)
  return { px, py, opacity, scale, size }
}

function RailToken({
  rail,
  t,
  window,
  size = 22,
  symbol = 'ETH',
}: {
  rail: Rail
  t: ReturnType<typeof useDiagramLoop>['t']
  window: [number, number]
  size?: number
  symbol?: string
}) {
  const { px, py, opacity, scale } = useRailToken(rail, t, window, size)
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 rounded-full ring-2 ring-surface-page/80 shadow-panel-elevated"
      style={{ left: px, top: py, x: '-50%', y: '-50%', opacity, scale, width: size, height: size }}
    >
      <CryptoIcon symbol={symbol} size={size} />
    </motion.span>
  )
}

function Node({ x, y, width = 130, children }: { x: number; y: number; width?: number; children: React.ReactNode }) {
  return (
    <div
      className="absolute"
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, width, transform: 'translate(-50%, -50%)' }}
    >
      {children}
    </div>
  )
}

export function ArchitectureDiagram() {
  const { scope, t, reduce } = useDiagramLoop({ period: 5600 })
  const accountPulse = useTransform(t, [0.12, 0.3, 0.5], [1, 1.02, 1])
  const depositDraw = useTransform(t, [0, 0.16], [0, 1], { clamp: true })
  const positionsDraw = useTransform(t, [0.25, 0.6], [0, 1], { clamp: true })
  const glow = reduce ? 0 : 1

  return (
    <DiagramShell label="Non-custodial by construction" ref={scope}>
      <svg
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {[RAIL_DEPOSIT, RAIL_AAVE, RAIL_UNI].map((rail, i) => (
          <g key={i}>
            <path d={railPath(rail)} fill="none" stroke="rgb(var(--line))" strokeWidth={0.5} />
            <motion.path
              d={railPath(rail)}
              fill="none"
              stroke="rgb(var(--brand))"
              strokeOpacity={0.55}
              strokeWidth={0.7}
              strokeLinecap="round"
              style={{ pathLength: i === 0 ? depositDraw : positionsDraw }}
            />
          </g>
        ))}
      </svg>

      <RailToken rail={RAIL_DEPOSIT} t={t} window={[0.04, 0.18]} symbol="ETH" />
      <RailToken rail={RAIL_AAVE} t={t} window={[0.3, 0.46]} symbol="USDC" />
      <RailToken rail={RAIL_UNI} t={t} window={[0.52, 0.68]} symbol="USDC" />

      <Node x={WALLET.x} y={WALLET.y}>
        <div className="rounded-2xl border border-line bg-surface-panel p-3 shadow-panel-elevated">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-fg-muted">Your wallet</p>
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-fg-primary">
            <Unlock className="h-3.5 w-3.5 text-fg-muted" aria-hidden /> You stay in control
          </p>
        </div>
      </Node>

      <motion.div style={{ scale: accountPulse }}>
        <Node x={ACCOUNT.x} y={ACCOUNT.y} width={150}>
          <div className="rounded-2xl border border-brand/40 bg-surface-panel p-3 shadow-panel-elevated ring-1 ring-brand/20">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-brand">HedgeHog account</p>
            <p className="mt-1 text-[12.5px] font-semibold text-fg-primary">Your positions live here</p>
            <p className="mt-0.5 font-data text-[11px] tabular-nums text-fg-muted">you are the owner</p>
          </div>
        </Node>
      </motion.div>

      <Node x={AAVE.x} y={AAVE.y}>
        <div className="flex w-32 items-center gap-2 rounded-2xl border border-line bg-surface-panel p-2.5 shadow-panel-elevated">
          <DexIcon protocol="Aave" size={22} />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-fg-primary">Aave V3</p>
            <p className="truncate text-[10.5px] text-fg-muted">lending</p>
          </div>
        </div>
      </Node>

      <Node x={UNI.x} y={UNI.y}>
        <div className="flex w-32 items-center gap-2 rounded-2xl border border-line bg-surface-panel p-2.5 shadow-panel-elevated">
          <DexIcon protocol="Uniswap" size={22} />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-fg-primary">Uniswap V3</p>
            <p className="truncate text-[10.5px] text-fg-muted">liquidity</p>
          </div>
        </div>
      </Node>

      <div
        aria-hidden
        className="absolute rounded-full bg-brand/15 blur-xl"
        style={{ left: '42%', top: '40%', width: '16%', height: '26%', opacity: glow }}
      />

      <Node x={0.5} y={0.12} width={230}>
        <p className="text-center text-[10.5px] font-medium uppercase tracking-[0.1em] text-fg-muted">
          Non-custodial — funds never leave your account
        </p>
      </Node>

      <Node x={0.5} y={0.9} width={250}>
        <div className="flex items-center justify-center gap-1.5 rounded-full border border-line bg-surface-panel px-3 py-1.5 text-[10.5px] text-fg-secondary">
          <Lock className="h-3 w-3 text-brand" aria-hidden />
          Automation bot executes strategies — can never withdraw
        </div>
      </Node>
    </DiagramShell>
  )
}

export default ArchitectureDiagram