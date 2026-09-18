'use client'

/**
 * Accordion — re-exported from the Interior.dev accordion.
 *
 * Plan Phase 4 (Interior.dev component adoption): the Radix-based composite
 * accordion was replaced by the Interior accordion
 * (`@/components/interior/accordion`), which adds spring-measured height via
 * ResizeObserver (`useAutoHeight`), roving focus with Home/End, `inert` on
 * closed panels, a configurable heading level, and a `meta` slot.
 *
 * API NOTE — the Interior accordion uses an ITEMS API instead of the old
 * compound API:
 *
 *   <Accordion type="single" collapsible
 *     items={[{ id, title, content, meta? }]} />
 *
 * For full behavioral control (custom visuals per row), use the headless
 * `useAccordion` hook directly.
 */

export {
  Accordion,
  useAccordion,
  useAutoHeight,
} from '@/components/interior/accordion'

export type {
  AccordionItem,
  AccordionProps,
  AccordionEntry,
  AccordionHeaderProps,
  AccordionPanelProps,
  UseAccordionOptions,
  UseAccordionResult,
  UseAutoHeightResult,
} from '@/components/interior/accordion'
