'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Button — one CTA recipe, one flat secondary recipe.
 *
 * The `cta` recipe (sampled from the design system spec, 2026-05):
 *   • Pillow shape: subtle top→bottom gradient on the fill
 *   • Inset hairline ring (lighter top, darker bottom) for depth
 *   • Outer drop-shadow (10% black, Y:2 blur:4) for lift
 *   • 1px outer ring shadow as a hard border that respects opacity
 *
 * `cta` is the ONE primary action in a panel (brand cyan): "Add Liquidity",
 * "Connect wallet". Everything secondary is flat — `ghost` (quiet, no
 * chrome) or `outline` (bordered).
 *
 * `neutral` is RETIRED (owner feedback, 11 Sep 2026: "no gradient-pill
 * buttons anywhere"). It had been the black/white "BW" pillow — the same
 * gradient recipe as `cta` on a near-black fill — which made every
 * secondary control on a panel read as a primary one. It survives only as
 * an ALIAS of `ghost` so existing callers keep working; they now render a
 * ghost. Do not add new `neutral` call sites: reach for `ghost`/`outline`,
 * or `cta` for the one primary.
 *
 * Legacy variants (default / outline / secondary / destructive / link) are
 * preserved for backward-compat with existing consumers that haven't
 * migrated yet.
 */

// The secondary recipe. Shared by reference so `neutral` is an alias in the
// literal sense — `buttonVariants({ variant: 'neutral' })` and
// `buttonVariants({ variant: 'ghost' })` are the same string, and the test
// that pins this cannot drift from the definition.
const GHOST_RECIPE = 'text-fg-primary hover:bg-surface-card hover:text-fg-primary'

const buttonVariants = cva(
  // `aria-disabled:` mirrors `disabled:` (pointer-events-none + opacity-50 +
  // cursor-not-allowed): this design system's convention for a D49-forbidden
  // control is `aria-disabled` — never native `disabled`, which drops a
  // control out of the tab order and stops reliably exposing its own
  // `title`/`aria-describedby` (see `PositionPanel.tsx`'s "NEW-5" note) — so
  // without this, an aria-disabled Button kept the full live hover/press
  // face (gradient shift, shadow lift, translate-on-press) right up until
  // the click was refused. `pointer-events-none` is what actually silences
  // the hover/active pseudo-classes below (they are pointer-driven); the
  // reason itself must therefore never depend on this control's own hover
  // `title` — it is stated as visible text next to the control instead.
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // ─── Design-spec variants ───────────────────────────────────
        // `neutral` — RETIRED (11 Sep feedback). Kept as an alias of the
        // `ghost` recipe below: existing call sites keep working and
        // render a flat ghost, never the old BW pillow gradient. Its
        // gradient recipe is deleted, not commented out — under
        // Tailwind v4 a class left in the source is a class that ships.
        neutral: GHOST_RECIPE,
        // CTA — brand-cyan pillow. Foreground is near-black for AA
        // contrast on cyan. Used for the final submit action ("Add
        // Liquidity") and any other primary call to action — ONE per
        // panel.
        cta: [
          'bg-linear-to-b from-brand to-brand/90',
          'text-brand-foreground font-semibold',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.4),0_0_0_1px_#2EC4B6]',
          'hover:from-brand hover:to-brand',
          'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.5),0_0_0_1px_#2EC4B6]',
          'active:from-brand/90 active:to-brand/80',
          'active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25),0_0_0_1px_#28B5A8]',
        ].join(' '),

        // ─── Legacy variants (kept for backward compat) ─────────────
        default:
          'bg-brand text-fg-primary font-semibold hover:bg-brand/85 active:bg-brand/75',
        destructive:
          'bg-danger/10 text-danger font-semibold hover:bg-danger/20 active:bg-danger/15',
        outline:
          'border border-line-strong bg-transparent text-fg-primary hover:bg-surface-card hover:border-line-brand/50 disabled:text-fg-disabled disabled:border-line-subtle',
        secondary:
          'bg-surface-card text-fg-primary border border-line-subtle hover:bg-surface-panel hover:border-line-strong',
        // The secondary control: quiet, flat, no chrome. `neutral` aliases
        // this recipe (see GHOST_RECIPE) — the two are the same string.
        ghost: GHOST_RECIPE,
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 px-3',
        sm: 'h-7 px-2.5',
        lg: 'h-9 px-4',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
