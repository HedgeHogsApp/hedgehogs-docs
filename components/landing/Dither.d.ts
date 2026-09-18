/**
 * Hand-written type shim for the vendored WebGL Dither background (Dither.jsx).
 *
 * The import `@/components/landing/Dither` resolves to THIS declaration in tsc
 * (`.d.ts` outranks `.jsx`), so the project's typecheck never loads
 * `@react-three/fiber`'s global `JSX.IntrinsicElements` augmentation — which
 * otherwise collapses unrelated components' props to `never`. Webpack still
 * bundles the real `.jsx` at build time. See the note atop Dither.jsx.
 */
import type { FC } from 'react'

export interface DitherProps {
  /** Wave animation speed. */
  waveSpeed?: number
  /** Wave pattern frequency. */
  waveFrequency?: number
  /** Wave pattern amplitude. */
  waveAmplitude?: number
  /** Wave colour as a normalised RGB array (0–1 per channel). */
  waveColor?: [number, number, number]
  /** Number of quantised colour steps in the dither. */
  colorNum?: number
  /** Pixel size of the dither cells. */
  pixelSize?: number
  /** Freeze the wave animation (pass the reduced-motion preference here). */
  disableAnimation?: boolean
  /** Let the pointer distort the field. */
  enableMouseInteraction?: boolean
  /** Radius of the pointer interaction, in scene units. */
  mouseRadius?: number
}

declare const Dither: FC<DitherProps>
export default Dither
