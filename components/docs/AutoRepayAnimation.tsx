'use client'

import React, { useLayoutEffect, useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(MotionPathPlugin)
}

/**
 * AutoRepayAnimation
 * Shows the auto-repay strategy: LP fees → repay debt → health factor improves
 */

const AutoRepayAnimation: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const lpNode = useRef<SVGGElement | null>(null)
  const debtNode = useRef<SVGGElement | null>(null)
  const feeToken = useRef<SVGImageElement | null>(null)
  const repayPath = useRef<SVGPathElement | null>(null)
  const debtBar = useRef<SVGRectElement | null>(null)
  const healthText = useRef<SVGTextElement | null>(null)

  useLayoutEffect(() => {
    if (!svgRef.current || !mounted) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tl = gsap.timeline({
      repeat: -1,
      defaults: { ease: 'power2.inOut' },
    })

    // Phase 1: LP generates fee (0-1.5s)
    tl.fromTo(
      lpNode.current,
      { scale: 1 },
      { scale: 1.15, duration: 0.6, ease: 'power2.out' },
      0
    )

    if (feeToken.current) {
      tl.fromTo(
        feeToken.current,
        { opacity: 0, scale: 0, y: 0 },
        {
          opacity: 1,
          scale: 1,
          y: -30,
          duration: 0.7,
          ease: 'back.out(2)',
        },
        0.6
      )
    }

    // Phase 2: Fee moves to debt (1.5-3.5s)
    if (repayPath.current && feeToken.current) {
      const pathLength = repayPath.current.getTotalLength()
      gsap.set(repayPath.current, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
      })
      tl.to(
        repayPath.current,
        { strokeDashoffset: 0, duration: 1.5, ease: 'power1.inOut' },
        1.5
      )

      tl.to(
        feeToken.current,
        {
          duration: 1.5,
          motionPath: {
            path: repayPath.current,
            align: repayPath.current,
            alignOrigin: [0.5, 0.5],
          },
          ease: 'power1.inOut',
        },
        1.5
      )
    }

    // Phase 3: Debt reduces (3-4.5s)
    if (debtBar.current) {
      tl.to(
        debtBar.current,
        {
          width: 40,
          duration: 1.2,
          ease: 'power2.out',
        },
        3
      )
    }

    if (feeToken.current) {
      tl.to(feeToken.current, { opacity: 0, scale: 0, duration: 0.3 }, 3)
    }

    // Phase 4: Health factor improves (4-5.5s)
    if (healthText.current) {
      tl.fromTo(
        healthText.current,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        },
        4
      )
      tl.to(healthText.current, { opacity: 0, duration: 0.4 }, 5.3)
    }

    // Reset (5.5-6s)
    tl.to(lpNode.current, { scale: 1, duration: 0.3 }, 5.5)
    tl.set(debtBar.current, { width: 90 }, 5.8)
    tl.to({}, { duration: 0.2 }, 6)

    return () => {
      tl.kill()
    }
  }, [mounted])

  if (!mounted) {
    return (
      <div className="w-full h-[300px] flex justify-center items-center bg-surface-panel dark:bg-surface-page rounded-lg">
        <div className="text-fg-secondary dark:text-fg-muted text-sm">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center items-center rounded-lg bg-surface-panel dark:bg-surface-page overflow-hidden" data-motion="on">
      <svg
        ref={svgRef}
        viewBox="0 0 400 300"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* LP Position Left */}
        <g ref={lpNode} transform="translate(100, 150)">
          <circle
            r={35}
            style={{
              fill: 'var(--anim-card)',
              stroke: '#45B7D1',
              strokeWidth: 2,
            }}
          />
          <text
            y={-5}
            fontSize={13}
            fontWeight={700}
            style={{ fill: 'var(--anim-ink)' }}
            textAnchor="middle"
            fontFamily="liebling, ui-sans-serif, system-ui"
          >
            LP
          </text>
          <text
            y={10}
            fontSize={10}
            fontWeight={600}
            style={{ fill: 'var(--anim-ink)', opacity: 0.7 }}
            textAnchor="middle"
            fontFamily="liebling, ui-sans-serif, system-ui"
          >
            Fees
          </text>
        </g>

        {/* Loan Debt Node Right */}
        <g ref={debtNode} transform="translate(300, 150)">
          <rect
            x={-50}
            y={-30}
            width={100}
            height={60}
            rx={12}
            style={{
              fill: 'var(--anim-card)',
              stroke: '#45B7D1',
              strokeWidth: 2,
            }}
          />
          <text
            y={-5}
            fontSize={13}
            fontWeight={700}
            style={{ fill: 'var(--anim-ink)' }}
            textAnchor="middle"
            fontFamily="liebling, ui-sans-serif, system-ui"
          >
            Loan Debt
          </text>

          {/* Debt bar */}
          <g transform="translate(0, 12)">
            <rect
              x={-45}
              y={0}
              width={90}
              height={10}
              rx={5}
              style={{
                fill: 'var(--anim-card)',
                stroke: 'var(--anim-ring)',
                strokeWidth: 1,
              }}
            />
            <rect
              ref={debtBar}
              x={-45}
              y={0}
              width={90}
              height={10}
              rx={5}
              fill="#45B7D1"
            />
          </g>
        </g>

        {/* Fee token */}
        <image
          ref={feeToken}
          href="/icons/usdc.svg"
          x={100 - 12}
          y={150 - 12}
          width={24}
          height={24}
          opacity={0}
        />

        {/* Repay path */}
        <path
          ref={repayPath}
          d="M 130,120 Q 200,80 270,120"
          fill="none"
          stroke="#45B7D1"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.6}
        />

        {/* Health factor text */}
        <text
          ref={healthText}
          x={200}
          y={220}
          fontSize={14}
          fontWeight={700}
          style={{ fill: '#10B981' }}
          textAnchor="middle"
          fontFamily="liebling, ui-sans-serif, system-ui"
          opacity={0}
        >
          Health Factor ↑
        </text>

        {/* Label */}
        <text
          x={200}
          y={270}
          fontSize={16}
          fontWeight={700}
          style={{ fill: '#45B7D1' }}
          textAnchor="middle"
          fontFamily="liebling, ui-sans-serif, system-ui"
        >
          Auto Repay
        </text>
        <text
          x={200}
          y={288}
          fontSize={11}
          fontWeight={600}
          style={{ fill: 'var(--anim-ink)', opacity: 0.6 }}
          textAnchor="middle"
          fontFamily="liebling, ui-sans-serif, system-ui"
        >
          Automatically reduce debt and risk
        </text>
      </svg>
    </div>
  )
}

export default AutoRepayAnimation
