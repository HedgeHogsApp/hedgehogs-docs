'use client'
/**
 * DitherHero — the docs hero background in pure SVG/CSS. No WebGL, no three.
 * A soft brand glow + a dither dot-grid + a looping wave stroke. Autoplays and
 * loops; under `prefers-reduced-motion` the wave settles static. Fills its
 * parent (the hero's masked, dimmed container).
 */
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'motion/react'

const WAVE = 'M -2 32 C 10 20 20 44 34 32 C 48 20 58 44 72 32 C 86 20 96 44 110 32 C 124 20 134 44 148 32'

export function DitherHero() {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)

  useAnimationFrame((_, delta) => {
    if (reduce) return
    const step = (delta / 9000) * 76 // travel ~76 units per ~9s
    x.set(x.get() - step >= -76 ? x.get() - step : x.get() - step + 76)
  })

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden">
      {/* soft brand glow */}
      <div
        className="absolute left-1/2 top-1/3 h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl"
        aria-hidden
      />

      {/* dither dot grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.4]" aria-hidden>
        <defs>
          <pattern id="hh-dither-dots" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.9" fill="currentColor" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hh-dither-dots)" className="text-brand" />
      </svg>

      {/* looping wave */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[70%] w-[200%]"
        preserveAspectRatio="none"
        viewBox="0 0 148 64"
        aria-hidden
      >
        <motion.path
          d={WAVE}
          fill="none"
          stroke="var(--brand)"
          strokeOpacity={0.6}
          strokeWidth={1.2}
          style={{ x }}
        />
      </svg>
    </div>
  )
}

export default DitherHero