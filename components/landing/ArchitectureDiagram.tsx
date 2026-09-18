'use client'
/**
 * ArchitectureDiagram — the non-custodial story, animated once on first view
 * then settled.
 *
 * Your wallet deposits into YOUR HedgeHog account (the proxy). The account
 * holds every position (aTokens, LP NFTs) and routes to the protocols through
 * connectors. The automation bot can execute enabled strategies but can never
 * move funds out — every withdrawal path is `onlyOwner`.
 *
 * Craft mirrors `RoutingScene`: one normalised coordinate space (0..1), rails
 * as SVG beziers in a 0..100 × 0..60 viewBox, GPU transforms only, and a single
 * `progress` MotionValue. Reduced motion renders the settled final frame.
 */
import { useEffect, useRef, useState } from 'react'
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { Lock, Unlock } from 'lucide-react'
import CryptoIcon from '@/components/CryptoIcon'
import DexIcon from '@/components/DexIcon'
import { DURATION_S } from '@/lib/motion/tokens'

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

function Node({
  x,
  y,
  width = 130,
  className,
  children,
}: {
  x: number
  y: number
  width?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`absolute ${className ?? ''}`}
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, width, transform: 'translate(-50%, -50%)' }}
    >
      {children}
    </div>
  )
}

function Token({
  progress,
  range,
  rail,
  size = 22,
  symbol = 'ETH',
}: {
  progress: MotionValue<number>
  range: [number, number]
  rail: Rail
  size?: number
  symbol?: string
}) {
  const width = useMotionValue(640)
  const t = useTransform(progress, range, [0, 1], { clamp: true })
  const x = useTransform([t, width], ([tv, w]: number[]) => bezier(rail, tv, 'x') * w - size / 2)
  const y = useTransform([t, width], ([tv, w]: number[]) => bezier(rail, tv, 'y') * (w * 0.6) - size / 2)
  const opacity = useTransform(t, [0, 0.08, 0.85, 1], [0, 1, 1, 0])
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 rounded-full ring-2 ring-surface-page/80 shadow-panel-elevated"
      style={{ x, y, opacity, width: size, height: size }}
    >
      <CryptoIcon symbol={symbol} size={size} />
    </motion.span>
  )
}

export function ArchitectureDiagram() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const reduce = useReducedMotion()
  const progress = useMotionValue(0)
  const width = useMotionValue(640)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => width.set(el.getBoundingClientRect().width || 640)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  useEffect(() => {
    if (!inView || started) return
    setStarted(true)
    if (reduce) {
      progress.set(1)
      return
    }
    const controls = animate(progress, 1, {
      duration: 4.2,
      ease: 'easeInOut',
    })
    return () => controls.stop()
  }, [inView, reduce, started, progress])

  const deposit = useTransform(progress, [0, 0.25], [0, 1], { clamp: true })
  const positions = useTransform(progress, [0.35, 0.85], [0, 1], { clamp: true })
  const drawDeposit = useTransform(progress, [0, 0.2], [0, 1], { clamp: true })
  const drawPositions = useTransform(progress, [0.3, 0.75], [0, 1], { clamp: true })
  const accountLift = useTransform(progress, [0.15, 0.4], [0.96, 1])

  return (
    <div ref={ref} className="my-8 rounded-2xl border border-line bg-surface-panel/60 p-4 sm:p-6">
      <div className="relative mx-auto aspect-[5/3] w-full max-w-3xl">
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
                style={{ pathLength: i === 0 ? drawDeposit : drawPositions }}
              />
            </g>
          ))}
        </svg>

        <Token progress={progress} range={[0.05, 0.25]} rail={RAIL_DEPOSIT} symbol="ETH" />
        <Token progress={progress} range={[0.4, 0.62]} rail={RAIL_AAVE} symbol="USDC" />
        <Token progress={progress} range={[0.62, 0.85]} rail={RAIL_UNI} symbol="USDC" />

        <Node x={WALLET.x} y={WALLET.y}>
          <div className="rounded-2xl border border-line bg-surface-panel p-3 shadow-panel-elevated">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-fg-muted">Your wallet</p>
            <p className="mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-fg-primary">
              <Unlock className="h-3.5 w-3.5 text-fg-muted" aria-hidden /> You stay in control
            </p>
          </div>
        </Node>

        <motion.div style={{ scale: accountLift }}>
          <Node x={ACCOUNT.x} y={ACCOUNT.y} width={150}>
            <div className="rounded-2xl border border-brand/40 bg-surface-panel p-3 shadow-panel-elevated ring-1 ring-brand/20">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-brand">
                HedgeHog account
              </p>
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
      </div>
    </div>
  )
}

export default ArchitectureDiagram