/**
 * Canonical automation-type iconography — ONE mapping for the whole product
 * (app surfaces + landing). Every surface showing an automation kind imports
 * from here; per-file icon maps drifting apart is how HARVEST ended up as
 * TrendingUp in one panel and Sprout in another.
 *
 * Icon rationale:
 * - harvest       Sprout     — yield collected (growth being picked)
 * - compound      RefreshCw  — the reinvest cycle
 * - rebalance     Shuffle    — the range being moved
 * - repay         CreditCard — debt being paid down
 * - collateralize Shield     — position being backed/protected
 * - exit          LogOut     — leaving in one click
 *
 * Tones follow the app convention set in P1: success/info/brand/warning are
 * status hues; collateralize keeps the categorical cyan-400 the automation
 * feeds already use (brand is claimed by rebalance).
 */
import {
  CreditCard,
  LogOut,
  RefreshCw,
  Shield,
  Shuffle,
  Sprout,
  type LucideIcon,
} from 'lucide-react'

export type AutomationKind =
  | 'harvest'
  | 'compound'
  | 'rebalance'
  | 'repay'
  | 'collateralize'
  | 'exit'

export const AUTOMATION_ICONS: Record<
  AutomationKind,
  { Icon: LucideIcon; label: string; tone: string; dot: string }
> = {
  harvest: { Icon: Sprout, label: 'Auto-harvest', tone: 'text-success', dot: 'bg-success' },
  compound: { Icon: RefreshCw, label: 'Auto-compound', tone: 'text-info', dot: 'bg-info' },
  rebalance: { Icon: Shuffle, label: 'Auto-rebalance', tone: 'text-brand', dot: 'bg-brand' },
  repay: { Icon: CreditCard, label: 'Auto-repay', tone: 'text-warning', dot: 'bg-warning' },
  collateralize: {
    Icon: Shield,
    label: 'Auto-collateralize',
    // decorative palette — intentional (categorical action hue; brand is
    // claimed by rebalance). Matches AutomationFeed's existing convention.
    tone: 'text-cyan-400',
    dot: 'bg-cyan-500',
  },
  exit: { Icon: LogOut, label: 'One-click exit', tone: 'text-danger', dot: 'bg-danger' },
}
