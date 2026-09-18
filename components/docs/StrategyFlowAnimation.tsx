'use client'

import React, { useLayoutEffect, useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(MotionPathPlugin)
}

/**
 * StrategyFlowAnimation - Theme-Aware Version with CSS Variables
 *
 * A highly animated Flow-style animation explaining the Aave v3 → Uniswap v3 strategy.
 * Now using CSS custom properties for seamless theme switching without remounting.
 *
 * Timeline: 16-second seamless loop with pauses between steps
 * Phases:
 *   A. Wallet Connection (0.0–2.0s)
 *   B. Supply ETH (2.5–4.5s)
 *   C. Borrow USDC (5.0–7.0s)
 *   D. LP Fees Emerge (7.5–9.0s)
 *   E. Auto-Repay (9.5–11.5s)
 *   F. Auto-Compound (12.0–13.5s)
 *   G. Harvest (14.0–15.5s)
 *   H. Hold and Reset (15.5–16s)
 */

// Modern glass card component with theme-aware styling via CSS variables
const ChipNode: React.FC<{
  id: string
  x: number
  y: number
  w?: number
  h?: number
  label: string
  sublabel?: string
}> = ({ id, x, y, w = 180, h = 100, label, sublabel }) => {
  return (
    <g id={id} transform={`translate(${x}, ${y})`}>
      {/* Subtle drop shadow */}
      <rect
        x={-w / 2 + 2}
        y={-h / 2 + 3}
        width={w}
        height={h}
        rx={16}
        fill="black"
        style={{ opacity: 'var(--anim-elev-shadow)' }}
        filter="blur(6px)"
      />

      {/* Main card surface */}
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={16}
        style={{
          fill: 'var(--anim-card)',
          stroke: 'var(--anim-ring)',
          strokeWidth: 1,
        }}
        className="chip-card"
      />

      {/* Top highlight gradient for depth */}
      <defs>
        <linearGradient
          id={`highlight-${id}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            style={{ stopColor: 'var(--anim-ring)', stopOpacity: 0.4 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: 'var(--anim-ring)', stopOpacity: 0 }}
          />
        </linearGradient>
      </defs>
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={12}
        rx={16}
        fill={`url(#highlight-${id})`}
      />

      {/* Labels */}
      {sublabel && (
        <text
          y={-14}
          fontFamily="liebling, ui-sans-serif, system-ui"
          fontSize={13}
          style={{ fill: 'var(--anim-ink)', opacity: 0.65 }}
          textAnchor="middle"
          fontWeight={600}
        >
          {sublabel}
        </text>
      )}
      <text
        y={sublabel ? 8 : 6}
        fontFamily="liebling, ui-sans-serif, system-ui"
        fontSize={17}
        fontWeight={700}
        style={{ fill: 'var(--anim-ink)' }}
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  )
}

// SVG asset with themed background plate for better contrast
const SVGAsset: React.FC<{
  src: string
  x: number
  y: number
  size: number
  id?: string
  withPlate?: boolean
}> = ({ src, x, y, size, id, withPlate = false }) => {
  if (withPlate) {
    return (
      <g>
        {/* Themed background plate */}
        <circle
          cx={x}
          cy={y}
          r={size / 2 + 4}
          style={{
            fill: 'var(--anim-card)',
            stroke: 'var(--anim-ring)',
            strokeWidth: 1.5,
          }}
        />
        <image
          id={id}
          href={src}
          x={x - size / 2}
          y={y - size / 2}
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    )
  }

  return (
    <image
      id={id}
      href={src}
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
    />
  )
}

const StrategyFlowAnimation: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Animation element refs
  const metamaskIcon = useRef<SVGGElement | null>(null)
  const rabbyIcon = useRef<SVGGElement | null>(null)
  const ethChainIcon = useRef<SVGGElement | null>(null)

  const ethToken = useRef<SVGImageElement | null>(null)
  const usdcToken = useRef<SVGImageElement | null>(null)
  const repayToken = useRef<SVGGElement | null>(null)
  const harvestToken = useRef<SVGGElement | null>(null)

  const ethPath = useRef<SVGPathElement | null>(null)
  const supplyToBorrowPath = useRef<SVGPathElement | null>(null)
  const usdcPath = useRef<SVGPathElement | null>(null)
  const repayPath = useRef<SVGPathElement | null>(null)
  const harvestPath = useRef<SVGPathElement | null>(null)

  const debtBar = useRef<SVGRectElement | null>(null)
  const walletGlow = useRef<SVGCircleElement | null>(null)

  // Phase tag refs
  const phaseConnect = useRef<SVGGElement | null>(null)
  const phaseSupply = useRef<SVGGElement | null>(null)
  const phaseBorrow = useRef<SVGGElement | null>(null)
  const phaseLPFees = useRef<SVGGElement | null>(null)
  const phaseRepay = useRef<SVGGElement | null>(null)
  const phaseCompound = useRef<SVGGElement | null>(null)
  const phaseHarvest = useRef<SVGGElement | null>(null)
  const debtMetric = useRef<SVGGElement | null>(null)

  // Fee generation animation
  const particles = useRef<SVGGElement | null>(null)
  const feeText = useRef<SVGTextElement | null>(null)

  useLayoutEffect(() => {
    if (!svgRef.current || !mounted) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: 'power2.inOut' },
    })

    // ViewBox animation object for camera movement
    const camera = { x: 0, y: 0, width: 1200, height: 600 }

    // Helper to zoom to an area
    const zoomTo = (
      x: number,
      y: number,
      width: number,
      height: number,
      time: string,
      duration = 0.8
    ) => {
      tl.to(
        camera,
        {
          x,
          y,
          width,
          height,
          duration,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (svgRef.current) {
              svgRef.current.setAttribute(
                'viewBox',
                `${camera.x} ${camera.y} ${camera.width} ${camera.height}`
              )
            }
          },
        },
        time
      )
    }

    // Helper: animate path stroke
    const animatePath = (
      path: SVGPathElement,
      duration: number,
      position: string
    ) => {
      const length = path.getTotalLength()
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })
      tl.to(
        path,
        { strokeDashoffset: 0, duration, ease: 'power1.inOut' },
        position
      )
    }

    // Helper: fade in/out phase tag
    const showPhase = (
      element: SVGGElement | null,
      startTime: string,
      duration = 1.0
    ) => {
      if (!element) return
      tl.fromTo(
        element,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
        startTime
      ).to(
        element,
        { opacity: 0, duration: 0.4, ease: 'power2.in' },
        `>${duration - 0.4}`
      )
    }

    // ==================== PHASE A: Wallet Connection (0.0–2.0s) ====================
    zoomTo(-50, 150, 600, 300, '0', 0.8)

    if (metamaskIcon.current && rabbyIcon.current && ethChainIcon.current) {
      tl.fromTo(
        metamaskIcon.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'back.out(2)' },
        0
      )

      tl.fromTo(
        rabbyIcon.current,
        { x: 100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'back.out(2)' },
        0.3
      )

      tl.fromTo(
        ethChainIcon.current,
        { scale: 0, rotation: -180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'back.out(2)',
        },
        0.6
      )

      tl.to(
        [metamaskIcon.current, rabbyIcon.current, ethChainIcon.current],
        {
          opacity: 0,
          duration: 0.4,
        },
        1.6
      )
    }
    showPhase(phaseConnect.current, '0.3', 1.5)

    // ==================== PHASE B: Supply ETH (2.5–4.5s) ====================
    tl.to({}, { duration: 0.3 }, 2.0)
    zoomTo(50, 50, 600, 300, '2.3', 0.7)

    if (ethPath.current && ethToken.current) {
      tl.to(ethPath.current, { opacity: 0.9, duration: 0.1 }, 2.5)

      animatePath(ethPath.current, 1.5, '2.5')
      tl.set(ethToken.current, { opacity: 1 }, 2.5)
      tl.to(
        ethToken.current,
        {
          duration: 1.5,
          motionPath: {
            path: ethPath.current,
            align: ethPath.current,
            alignOrigin: [0.5, 0.5],
          },
          ease: 'power1.inOut',
        },
        2.5
      )
      tl.to(
        ethToken.current,
        { scale: 1.4, duration: 0.5, ease: 'back.out(2)' },
        3.6
      )
      tl.to(ethToken.current, { opacity: 0, scale: 0.5, duration: 0.3 }, 4.1)
    }

    if (supplyToBorrowPath.current) {
      tl.to(supplyToBorrowPath.current, { opacity: 0.6, duration: 0.5 }, 4.2)
    }

    showPhase(phaseSupply.current, '2.6', 1.6)

    // ==================== PHASE C: Borrow USDC (5.0–7.0s) ====================
    tl.to({}, { duration: 0.3 }, 4.7)
    zoomTo(200, 200, 900, 450, '4.8', 0.7)

    if (usdcPath.current && usdcToken.current) {
      tl.to(usdcPath.current, { opacity: 0.9, duration: 0.1 }, 5.0)

      animatePath(usdcPath.current, 1.6, '5.0')
      tl.set(usdcToken.current, { opacity: 1 }, 5.0)
      tl.to(
        usdcToken.current,
        {
          duration: 1.6,
          motionPath: {
            path: usdcPath.current,
            align: usdcPath.current,
            alignOrigin: [0.5, 0.5],
          },
          ease: 'power1.inOut',
        },
        5.0
      )
      tl.to(
        usdcToken.current,
        { scale: 1.4, duration: 0.5, ease: 'back.out(2)' },
        6.2
      )
      tl.to(usdcToken.current, { opacity: 0, scale: 0.5, duration: 0.3 }, 6.7)
    }
    showPhase(phaseBorrow.current, '5.1', 1.6)

    // ==================== PHASE D: LP Fees Emerge (7.5–9.0s) ====================
    tl.to({}, { duration: 0.3 }, 7.2)
    zoomTo(650, 100, 700, 350, '7.3', 0.8)

    // Show "Generates Fees" with entire circle rotating
    if (particles.current && feeText.current) {
      tl.to(particles.current, { opacity: 1, duration: 0.4 }, 7.5)
      tl.to(feeText.current, { opacity: 1, duration: 0.4 }, 7.5)

      // Rotate the group (circle + USDC icon)
      tl.to(
        particles.current,
        {
          duration: 1.5,
          rotation: 360,
          ease: 'none',
          transformOrigin: 'center center',
        },
        7.5
      )

      tl.to(particles.current, { opacity: 0, duration: 0.4 }, 8.6)
      tl.to(feeText.current, { opacity: 0, duration: 0.4 }, 8.6)
    }

    showPhase(phaseLPFees.current, '7.6', 1.2)

    // ==================== PHASE E: Auto-Repay (9.5–11.5s) ====================
    tl.to({}, { duration: 0.3 }, 9.2)
    zoomTo(300, 250, 800, 400, '9.3', 0.7)

    if (repayPath.current && repayToken.current) {
      tl.to(repayPath.current, { opacity: 0.9, duration: 0.1 }, 9.5)

      animatePath(repayPath.current, 1.6, '9.5')
      tl.set(repayToken.current, { opacity: 1 }, 9.5)
      tl.to(
        repayToken.current,
        {
          duration: 1.6,
          motionPath: {
            path: repayPath.current,
            align: repayPath.current,
            alignOrigin: [0.5, 0.5],
          },
          ease: 'power1.inOut',
        },
        9.5
      )
      tl.to(repayToken.current, { opacity: 0, duration: 0.3 }, 11.1)
    }

    if (debtBar.current) {
      tl.to(
        debtBar.current,
        {
          width: 60,
          duration: 1.4,
          ease: 'power2.inOut',
        },
        9.6
      )
    }

    showPhase(phaseRepay.current, '9.6', 1.5)
    showPhase(debtMetric.current, '9.8', 1.2)

    // ==================== PHASE F: Auto-Compound (12.0–13.5s) ====================
    tl.to({}, { duration: 0.3 }, 11.7)
    zoomTo(650, 100, 700, 350, '11.8', 0.7)

    // Show "Generates Fees" with entire circle rotating twice
    if (particles.current && feeText.current) {
      // First rotation
      tl.to(particles.current, { opacity: 1, duration: 0.3 }, 12.0)
      tl.to(feeText.current, { opacity: 1, duration: 0.3 }, 12.0)
      tl.to(
        particles.current,
        {
          duration: 0.8,
          rotation: '+=360',
          ease: 'none',
          transformOrigin: 'center center',
        },
        12.0
      )
      tl.to(particles.current, { opacity: 0, duration: 0.2 }, 12.8)
      tl.to(feeText.current, { opacity: 0, duration: 0.2 }, 12.8)

      // Second rotation
      tl.to(particles.current, { opacity: 1, duration: 0.2 }, 12.95)
      tl.to(feeText.current, { opacity: 1, duration: 0.2 }, 12.95)
      tl.to(
        particles.current,
        {
          duration: 0.8,
          rotation: '+=360',
          ease: 'none',
          transformOrigin: 'center center',
        },
        12.95
      )
      tl.to(particles.current, { opacity: 0, duration: 0.2 }, 13.75)
      tl.to(feeText.current, { opacity: 0, duration: 0.2 }, 13.75)
    }

    showPhase(phaseCompound.current, '12.1', 1.3)

    // ==================== PHASE G: Harvest (14.0–15.5s) ====================
    tl.to({}, { duration: 0.3 }, 13.7)
    zoomTo(100, 200, 1000, 500, '13.8', 0.7)

    if (harvestPath.current && harvestToken.current) {
      tl.to(harvestPath.current, { opacity: 0.5, duration: 0.1 }, 14.0)

      animatePath(harvestPath.current, 1.3, '14.0')
      tl.set(harvestToken.current, { opacity: 0.9 }, 14.0)
      tl.to(
        harvestToken.current,
        {
          duration: 1.3,
          motionPath: {
            path: harvestPath.current,
            align: harvestPath.current,
            alignOrigin: [0.5, 0.5],
          },
          ease: 'power1.inOut',
        },
        14.0
      )
      tl.to(harvestToken.current, { opacity: 0, duration: 0.3 }, 15.2)
    }

    if (walletGlow.current) {
      tl.to(
        walletGlow.current,
        {
          opacity: 0.6,
          scale: 1.4,
          duration: 0.6,
          ease: 'power2.out',
        },
        15.0
      )
      tl.to(
        walletGlow.current,
        {
          opacity: 0,
          scale: 1,
          duration: 0.5,
        },
        15.6
      )
    }

    showPhase(phaseHarvest.current, '14.1', 1.3)

    // ==================== PHASE H: Hold and Reset (15.5–16s) ====================
    zoomTo(0, 0, 1200, 600, '15.4', 0.6)

    tl.to({}, { duration: 0.5 }, 15.5)

    tl.set(debtBar.current, { width: 120 }, 15.9)

    return () => {
      tl.kill()
    }
  }, [mounted])

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="w-full flex justify-center items-center p-4 sm:p-8 rounded-lg bg-surface-panel dark:bg-surface-page h-[600px]">
        <div className="text-fg-secondary dark:text-fg-muted">
          Loading animation...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center items-center rounded-lg bg-surface-panel dark:bg-surface-page overflow-hidden" data-motion="on">
      <svg
        ref={svgRef}
        viewBox="0 0 1200 600"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow for wallet harvest */}
          <radialGradient id="walletGlow" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              style={{ stopColor: 'var(--anim-primary)', stopOpacity: 0.6 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: 'var(--anim-primary)', stopOpacity: 0 }}
            />
          </radialGradient>
        </defs>

        {/* ==================== NODES ==================== */}

        {/* Wallet (left) with connection animation */}
        <g>
          <circle
            ref={walletGlow}
            cx={120}
            cy={300}
            r={60}
            fill="url(#walletGlow)"
            opacity={0}
          />

          {/* Wallet card */}
          <g id="wallet" transform="translate(120, 300)">
            {/* Inline wallet icon SVG for proper theming */}
            <svg x={-24} y={-24} width={48} height={48} viewBox="0 0 640 640">
              <path
                style={{ fill: 'var(--anim-ink)' }}
                d="M128 96C92.7 96 64 124.7 64 160L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 256C576 220.7 547.3 192 512 192L136 192C122.7 192 112 181.3 112 168C112 154.7 122.7 144 136 144L520 144C533.3 144 544 133.3 544 120C544 106.7 533.3 96 520 96L128 96zM480 320C497.7 320 512 334.3 512 352C512 369.7 497.7 384 480 384C462.3 384 448 369.7 448 352C448 334.3 462.3 320 480 320z"
              />
            </svg>
            <text
              y={70}
              fontFamily="liebling, ui-sans-serif, system-ui"
              fontSize={14}
              fontWeight={600}
              style={{ fill: 'var(--anim-ink)' }}
              textAnchor="middle"
            >
              Wallet
            </text>
          </g>

          {/* Wallet provider icons */}
          <g transform="translate(120, 300)">
            <g ref={metamaskIcon} opacity={0}>
              <image
                href="/wallets/metamask.svg"
                x={-130}
                y={-20}
                width={40}
                height={40}
              />
            </g>
            <g ref={rabbyIcon} opacity={0}>
              <image
                href="/wallets/rabby.svg"
                x={90}
                y={-20}
                width={40}
                height={40}
              />
            </g>
            <g ref={ethChainIcon} opacity={0}>
              <image
                href="/chains/eth.svg"
                x={-15}
                y={-75}
                width={30}
                height={30}
              />
            </g>
          </g>
        </g>

        {/* Aave Supply ETH (top middle) */}
        <g>
          <ChipNode
            id="aave-supply"
            x={420}
            y={180}
            label="Supply ETH"
            sublabel="Aave v3"
          />
          <SVGAsset
            src="/lendingprotocols/aave.svg"
            x={320}
            y={160}
            size={24}
          />
          <SVGAsset src="/chains/eth.svg" x={520} y={160} size={20} />
        </g>

        {/* Aave Borrow USDC (bottom middle) with debt bar */}
        <g id="aave-borrow">
          <ChipNode
            id="aave-borrow-chip"
            x={420}
            y={420}
            label="Borrow USDC"
            sublabel="Aave v3"
          />

          <SVGAsset
            src="/lendingprotocols/aave.svg"
            x={320}
            y={400}
            size={24}
          />

          {/* Debt bar */}
          <g transform="translate(420, 480)">
            <rect
              x={-60}
              y={0}
              width={120}
              height={12}
              rx={6}
              style={{
                fill: 'var(--anim-card)',
                stroke: 'var(--anim-ring)',
                strokeWidth: 1,
              }}
            />
            <rect
              ref={debtBar}
              x={-60}
              y={0}
              width={120}
              height={12}
              rx={6}
              style={{ fill: 'var(--anim-accent-repay)' }}
            />
            <text
              x={0}
              y={28}
              fontSize={11}
              fontFamily="liebling, ui-sans-serif, system-ui"
              fontWeight={600}
              style={{ fill: 'var(--anim-ink)', opacity: 0.7 }}
              textAnchor="middle"
            >
              Debt
            </text>
          </g>
        </g>

        {/* Uniswap LP (right) */}
        <g id="uniswap-lp" transform="translate(980, 300)">
          <ChipNode
            id="lp-chip"
            x={0}
            y={0}
            label="WBTC/USDC LP"
            sublabel="Uniswap v3"
          />

          <SVGAsset src="/dexes/uniswap.svg" x={-110} y={-10} size={28} />

          {/* Token pair */}
          <g transform="translate(95, -10)">
            <SVGAsset src="/icons/wbtc.svg" x={0} y={0} size={20} />
            <SVGAsset src="/icons/usdc.svg" x={18} y={0} size={20} />
          </g>

          {/* Fee generation - rotating circular arrow */}
          <g ref={particles} opacity={0}>
            {/* Dashed circular guide */}
            <circle
              cx={0}
              cy={0}
              r={85}
              fill="none"
              style={{
                stroke: 'var(--anim-accent-usdc)',
                strokeWidth: 2,
                strokeDasharray: '12 8',
                opacity: 0.4,
              }}
            />

            {/* USDC icon at top of circle */}
            <image
              href="/icons/usdc.svg"
              x={-12}
              y={-97}
              width={24}
              height={24}
              opacity={1}
            />
          </g>

          {/* "Generates Fees" text - outside rotating group */}
          <text
            ref={feeText}
            y={-110}
            fontSize={12}
            fontFamily="liebling, ui-sans-serif, system-ui"
            fontWeight={600}
            style={{ fill: 'var(--anim-accent-usdc)' }}
            textAnchor="middle"
            opacity={0}
          >
            Generates Fees
          </text>
        </g>

        {/* ==================== PATHS ==================== */}

        <path
          ref={ethPath}
          d="M 165,280 Q 260,220 370,185"
          fill="none"
          style={{
            stroke: 'var(--anim-accent-eth)',
            strokeWidth: 5,
            strokeLinecap: 'round',
          }}
          opacity={0}
        />

        <path
          ref={supplyToBorrowPath}
          d="M 420,230 L 420,370"
          fill="none"
          style={{
            stroke: 'var(--anim-primary)',
            strokeWidth: 4,
            strokeLinecap: 'round',
            strokeDasharray: '8 4',
          }}
          opacity={0}
        />

        <path
          ref={usdcPath}
          d="M 510,420 Q 650,390 780,370 Q 850,355 870,330"
          fill="none"
          style={{
            stroke: 'var(--anim-accent-usdc)',
            strokeWidth: 5,
            strokeLinecap: 'round',
          }}
          opacity={0}
        />

        <path
          ref={repayPath}
          d="M 890,330 Q 750,450 520,450"
          fill="none"
          style={{
            stroke: 'var(--anim-accent-repay)',
            strokeWidth: 5,
            strokeLinecap: 'round',
          }}
          opacity={0}
        />

        <path
          ref={harvestPath}
          d="M 920,350 Q 800,520 500,560 Q 300,580 150,340"
          fill="none"
          style={{
            stroke: 'var(--anim-primary)',
            strokeWidth: 5,
            strokeLinecap: 'round',
          }}
          opacity={0}
        />

        {/* ==================== MOVING TOKENS ==================== */}

        <image
          ref={ethToken}
          href="/icons/eth.svg"
          x={-16}
          y={-16}
          width={32}
          height={32}
          opacity={0}
        />

        <image
          ref={usdcToken}
          href="/icons/usdc.svg"
          x={-16}
          y={-16}
          width={32}
          height={32}
          opacity={0}
        />

        <g ref={repayToken} opacity={0}>
          <circle
            r={12}
            style={{ fill: 'var(--anim-accent-repay)', opacity: 0.95 }}
          />
          <text
            fontSize={10}
            fill="white"
            textAnchor="middle"
            dy={4}
            fontWeight={700}
          >
            $
          </text>
        </g>

        <g ref={harvestToken} opacity={0}>
          <circle
            r={12}
            style={{ fill: 'var(--anim-primary)', opacity: 0.9 }}
          />
          <text
            fontSize={14}
            fill="white"
            textAnchor="middle"
            dy={5}
            fontWeight={700}
          >
            ✓
          </text>
        </g>

        {/* ==================== PHASE TAGS ==================== */}

        <g ref={phaseConnect} opacity={0} transform="translate(120, 200)">
          <rect
            x={-42}
            y={-18}
            width={84}
            height={36}
            rx={8}
            style={{ fill: 'var(--anim-primary)', opacity: 0.95 }}
          />
          <text
            y={6}
            fontSize={14}
            fontWeight={700}
            fontFamily="liebling, ui-sans-serif, system-ui"
            fill="white"
            textAnchor="middle"
          >
            Connect
          </text>
        </g>

        <g ref={phaseSupply} opacity={0} transform="translate(280, 220)">
          <rect
            x={-35}
            y={-18}
            width={70}
            height={36}
            rx={8}
            style={{ fill: 'var(--anim-accent-eth)', opacity: 0.95 }}
          />
          <text
            y={6}
            fontSize={14}
            fontWeight={700}
            fontFamily="liebling, ui-sans-serif, system-ui"
            fill="white"
            textAnchor="middle"
          >
            Supply
          </text>
        </g>

        <g ref={phaseBorrow} opacity={0} transform="translate(600, 330)">
          <rect
            x={-38}
            y={-18}
            width={76}
            height={36}
            rx={8}
            style={{ fill: 'var(--anim-accent-usdc)', opacity: 0.95 }}
          />
          <text
            y={6}
            fontSize={14}
            fontWeight={700}
            fontFamily="liebling, ui-sans-serif, system-ui"
            fill="white"
            textAnchor="middle"
          >
            Borrow
          </text>
        </g>

        <g ref={phaseLPFees} opacity={0} transform="translate(980, 220)">
          <rect
            x={-42}
            y={-18}
            width={84}
            height={36}
            rx={8}
            style={{ fill: 'var(--anim-primary)', opacity: 0.95 }}
          />
          <text
            y={6}
            fontSize={14}
            fontWeight={700}
            fontFamily="liebling, ui-sans-serif, system-ui"
            fill="white"
            textAnchor="middle"
          >
            LP Fees
          </text>
        </g>

        <g ref={phaseRepay} opacity={0} transform="translate(680, 420)">
          <rect
            x={-52}
            y={-18}
            width={104}
            height={36}
            rx={8}
            style={{ fill: 'var(--anim-accent-repay)', opacity: 0.95 }}
          />
          <text
            y={6}
            fontSize={14}
            fontWeight={700}
            fontFamily="liebling, ui-sans-serif, system-ui"
            fill="white"
            textAnchor="middle"
          >
            Auto-Repay
          </text>
        </g>

        <g ref={debtMetric} opacity={0} transform="translate(350, 510)">
          <rect
            x={-28}
            y={-16}
            width={56}
            height={32}
            rx={6}
            style={{ fill: 'var(--anim-accent-repay)', opacity: 0.9 }}
          />
          <text
            y={4}
            fontSize={13}
            fontWeight={700}
            fontFamily="liebling, ui-sans-serif, system-ui"
            fill="white"
            textAnchor="middle"
          >
            Debt ↓
          </text>
        </g>

        <g ref={phaseCompound} opacity={0} transform="translate(1080, 380)">
          <rect
            x={-70}
            y={-18}
            width={140}
            height={36}
            rx={8}
            style={{ fill: 'var(--anim-primary)', opacity: 0.95 }}
          />
          <text
            y={6}
            fontSize={14}
            fontWeight={700}
            fontFamily="liebling, ui-sans-serif, system-ui"
            fill="white"
            textAnchor="middle"
          >
            Auto-Compound
          </text>
        </g>

        <g ref={phaseHarvest} opacity={0} transform="translate(500, 540)">
          <rect
            x={-42}
            y={-18}
            width={84}
            height={36}
            rx={8}
            style={{ fill: 'var(--anim-primary)', opacity: 0.95 }}
          />
          <text
            y={6}
            fontSize={14}
            fontWeight={700}
            fontFamily="liebling, ui-sans-serif, system-ui"
            fill="white"
            textAnchor="middle"
          >
            Harvest
          </text>
        </g>
      </svg>
    </div>
  )
}

export default StrategyFlowAnimation
