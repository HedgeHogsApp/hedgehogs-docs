'use client'
/**
 * ApprovalsDiagram — the JIT approval story, looping.
 *
 * Static content: the You / HedgeHog account / Aave / Uniswap nodes and labels.
 * The animated layer loops three "approve" pulses along the rails (one-time
 * approval, then just-in-time approve→reset to Aave and Uniswap). Under reduced
 * motion t stays at 1 → the complete frame.
 */
import { motion, useTransform } from 'motion/react'
import { Check } from 'lucide-react'
import CryptoIcon from '@/components/CryptoIcon'
import DexIcon from '@/components/DexIcon'
import { DiagramShell } from '@/components/docs-ui/DiagramShell'
import { useDiagramLoop } from '@/lib/diagram/useDiagramLoop'

type Pt = { x: number; y: number }
type Rail = readonly [Pt, Pt, Pt, Pt]

const YOU = { x: 0.16, y: 0.5 }
const ACCOUNT = { x: 0.5, y: 0.5 }
const AAVE = { x: 0.84, y: 0.22 }
const UNI = { x: 0.84, y: 0.78 }

const RAIL_APPROVE: Rail = [YOU, { x: 0.3, y: 0.5 }, { x: 0.4, y: 0.5 }, ACCOUNT]
const RAIL_JIT_AAVE: Rail = [ACCOUNT, { x: 0.64, y: 0.32 }, { x: 0.72, y: 0.22 }, AAVE]
const RAIL_JIT_UNI: Rail = [ACCOUNT, { x: 0.64, y: 0.68 }, { x: 0.72, y: 0.78 }, UNI]

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

function Pulse({
  rail,
  t,
  window,
}: {
  rail: Rail
  t: ReturnType<typeof useDiagramLoop>['t']
  window: [number, number]
}) {
  const local = useTransform(t, window, [0, 1], { clamp: true })
  const x = useTransform(local, (v) => bezier(rail, v, 'x'))
  const y = useTransform(local, (v) => bezier(rail, v, 'y'))
  const opacity = useTransform(local, [0, 0.1, 0.85, 1], [0, 1, 1, 0])
  const px = useTransform(x, (v) => `${v * 100}%`)
  const py = useTransform(y, (v) => `${v * 60}%`)
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand text-surface-page"
      style={{ left: px, top: py, x: '-50%', y: '-50%', opacity }}
    >
      <Check className="h-2.5 w-2.5" />
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

export function ApprovalsDiagram() {
  const { scope, t } = useDiagramLoop({ period: 5400 })
  const approveDraw = useTransform(t, [0, 0.18], [0, 1], { clamp: true })
  const jitDraw = useTransform(t, [0.3, 0.8], [0, 1], { clamp: true })

  return (
    <DiagramShell label="One approval per token — no per-protocol approvals" ref={scope}>
      <svg
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {[RAIL_APPROVE, RAIL_JIT_AAVE, RAIL_JIT_UNI].map((rail, i) => (
          <g key={i}>
            <path d={railPath(rail)} fill="none" stroke="rgb(var(--line))" strokeWidth={0.5} />
            <motion.path
              d={railPath(rail)}
              fill="none"
              stroke="rgb(var(--brand))"
              strokeOpacity={0.55}
              strokeWidth={0.7}
              strokeLinecap="round"
              strokeDasharray={i === 0 ? undefined : '2 2'}
              style={{ pathLength: i === 0 ? approveDraw : jitDraw }}
            />
          </g>
        ))}
      </svg>

      <Pulse rail={RAIL_APPROVE} t={t} window={[0.05, 0.2]} />
      <Pulse rail={RAIL_JIT_AAVE} t={t} window={[0.34, 0.5]} />
      <Pulse rail={RAIL_JIT_UNI} t={t} window={[0.58, 0.74]} />

      <Node x={YOU.x} y={YOU.y}>
        <div className="w-28 rounded-2xl border border-line bg-surface-panel p-3 shadow-panel-elevated">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-fg-muted">Step 1</p>
          <p className="mt-1 text-[12.5px] font-semibold text-fg-primary">Approve once</p>
          <p className="mt-0.5 text-[10.5px] text-fg-muted">per token, unlimited</p>
        </div>
      </Node>

      <Node x={ACCOUNT.x} y={ACCOUNT.y} width={150}>
        <div className="rounded-2xl border border-brand/40 bg-surface-panel p-3 shadow-panel-elevated ring-1 ring-brand/20">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-brand">HedgeHog account</p>
          <p className="mt-1 text-[12.5px] font-semibold text-fg-primary">Just-in-time approvals</p>
          <p className="mt-0.5 text-[10.5px] text-fg-muted">approve exact amount · call · reset</p>
        </div>
      </Node>

      <Node x={AAVE.x} y={AAVE.y}>
        <div className="flex w-32 items-center gap-2 rounded-2xl border border-line bg-surface-panel p-2.5 shadow-panel-elevated">
          <DexIcon protocol="Aave" size={22} />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-fg-primary">Aave V3</p>
            <p className="truncate text-[10.5px] text-fg-muted">supply · borrow</p>
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

      <Node x={0.5} y={0.92} width={300}>
        <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-fg-secondary">
          <CryptoIcon symbol="ETH" size={14} />
          <span>You never approve each protocol directly</span>
        </div>
      </Node>
    </DiagramShell>
  )
}

export default ApprovalsDiagram