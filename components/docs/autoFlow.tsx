'use client'

import { motion, useTransform, type MotionValue } from 'motion/react'
import CryptoIcon from '@/components/CryptoIcon'

export type Pt = { x: number; y: number }
export type Rail = readonly [Pt, Pt, Pt, Pt]

export function bezier(rail: Rail, t: number, axis: 'x' | 'y'): number {
  const u = 1 - t
  const [p0, p1, p2, p3] = rail
  return (
    u * u * u * p0[axis] + 3 * u * u * t * p1[axis] + 3 * u * t * t * p2[axis] + t * t * t * p3[axis]
  )
}

export function railPath(rail: Rail): string {
  const [p0, p1, p2, p3] = rail
  const X = (v: number) => (v * 100).toFixed(2)
  const Y = (v: number) => (v * 60).toFixed(2)
  return `M ${X(p0.x)} ${Y(p0.y)} C ${X(p1.x)} ${Y(p1.y)} ${X(p2.x)} ${Y(p2.y)} ${X(p3.x)} ${Y(p3.y)}`
}

export function Node({ x, y, width = 130, children }: { x: number; y: number; width?: number; children: React.ReactNode }) {
  return (
    <div
      className="absolute"
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, width, transform: 'translate(-50%, -50%)' }}
    >
      {children}
    </div>
  )
}

export function RailToken({
  rail,
  t,
  window,
  size = 20,
  symbol = 'USDC',
}: {
  rail: Rail
  t: MotionValue<number>
  window: [number, number]
  size?: number
  symbol?: string
}) {
  const local = useTransform(t, window, [0, 1], { clamp: true })
  const x = useTransform(local, (v) => bezier(rail, v, 'x'))
  const y = useTransform(local, (v) => bezier(rail, v, 'y'))
  const opacity = useTransform(local, [0, 0.08, 0.85, 1], [0, 1, 1, 0])
  const scale = useTransform(local, [0, 0.12, 1], [0.7, 1, 0.82])
  const left = useTransform(x, (v) => `${v * 100}%`)
  const top = useTransform(y, (v) => `${v * 60}%`)
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 rounded-full ring-2 ring-surface-page/80 shadow-panel-elevated"
      style={{ left, top, x: '-50%', y: '-50%', opacity, scale, width: size, height: size }}
    >
      <CryptoIcon symbol={symbol} size={size} />
    </motion.span>
  )
}

/** Animated horizontal fill (a value that rises/falls with a window). */
export function HBar({
  t,
  window,
  className,
}: {
  t: MotionValue<number>
  window: [number, number]
  className?: string
}) {
  const width = useTransform(t, window, [0, 1], { clamp: true })
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-line">
      <motion.div className={`h-full origin-left rounded-full ${className ?? 'bg-brand'}`} style={{ scaleX: width }} />
    </div>
  )
}

/** A static label pill (the "result" chip), complete in the static frame. */
export function Chip({
  x,
  y,
  children,
  tone = 'text-brand',
}: {
  x: number
  y: number
  children: React.ReactNode
  tone?: string
}) {
  return (
    <Node x={x} y={y} width={140}>
      <p className={`text-center text-[11px] font-semibold ${tone}`}>{children}</p>
    </Node>
  )
}