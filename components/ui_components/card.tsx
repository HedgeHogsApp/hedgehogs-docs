import * as React from 'react'

import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Shared design tokens                                               */
/* ------------------------------------------------------------------ */

/** Modern subtle shadow — used on cards and elevated surfaces */
const depthShadow = 'shadow-xs'

/* ------------------------------------------------------------------ */
/*  Corner decorations (DEPRECATED — render nothing)                   */
/* ------------------------------------------------------------------ */

/** @deprecated CornerDots removed in slick-ui redesign. Renders nothing. */
function CornerDots({ className: _className }: { className?: string }) {
  return null
}

/** @deprecated CornerBrackets removed in slick-ui redesign. Renders nothing. */
function CornerBrackets({ className: _className }: { className?: string }) {
  return null
}

/* ------------------------------------------------------------------ */
/*  Outer / Inner card pair                                            */
/* ------------------------------------------------------------------ */

/**
 * OuterCard — Clean container card with subtle border and rounded corners.
 * Inspired by Aave/Uniswap's minimal card aesthetic.
 */
const OuterCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative rounded-lg border border-line bg-surface-card backdrop-blur-xs',
      className
    )}
    {...props}
  >
    {children}
  </div>
))
OuterCard.displayName = 'OuterCard'

/**
 * InnerCard — Content area inside an OuterCard.
 * Now renders as a clean div with subtle background differentiation.
 */
const InnerCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative rounded-lg bg-card p-4 sm:p-5',
      className
    )}
    {...props}
  >
    {children}
  </div>
))
InnerCard.displayName = 'InnerCard'

/* ------------------------------------------------------------------ */
/*  Base Card (shadcn)                                                 */
/* ------------------------------------------------------------------ */

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative rounded-lg bg-surface-card text-card-foreground border border-line',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 border-b border-line p-5 sm:p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-5 sm:p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-5 sm:p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  OuterCard,
  InnerCard,
  CornerDots,
  CornerBrackets,
  depthShadow,
}
