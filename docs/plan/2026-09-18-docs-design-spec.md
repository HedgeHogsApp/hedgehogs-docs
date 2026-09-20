# hedgehogs-docs — design spec (tokens, layout, components, motion)

**Date:** 2026-09-18 · Companion to `2026-09-18-docs-ia.md`. This is the
contract the renderer implements. Every component below lists its tokens,
states, motion and a11y so the implementation pass is mechanical.

Sources of truth reused (do not re-derive): `styles/globals.css` (frontend,
the locked token set), `lib/motion/tokens.ts`, `docs/design-system/tokens.md`,
`docs/design-system/COMPONENT_INDEX.md`, `docs/design-system/do-and-dont.md`.

---

## 1. Theme

**Dark-only.** The docs shell mounts the same `DarkModeProvider` semantics as
`hedgehogs-marketing` (owner, 2026-07-06): `.dark` on `<html>`, setters inert.
The `globals.css` token block is copied wholesale — including the `--anim-*`
tokens the ported animations read. No light theme is reachable.

## 2. Color rules (from tokens.md / do-and-dont)

- **Brand cyan** (`rgb(var(--brand))`, `#3dd8c9`) is the only accent on a docs
  page. Uses: primary CTAs, in-prose links, active nav item, focus rings, TOC
  active bar, code copy hover. **Never** decorative borders or chrome.
- **Status colors** (`success`/`warning`/`danger`) only for callouts and status
  dots. `--danger-fg` (not `--danger`) for danger *text*.
- Surfaces: page `--surface-page` · panels/code/`GuideCard` `--surface-panel` ·
  nested (callouts, code inside prose) `--surface-card`. 3-level depth, no
  same-color nesting.
- Hairlines only (`--border-subtle`), 1px. No shadows (tokens: cards are flat;
  the shadow utilities resolve to transparent). No glassmorphism.
- Text: `--text-primary` / `--text-secondary` / `--text-muted` (4.5:1 floor
  already met on every dark surface); `--text-disabled` disabled only.
- Figures use `font-data` + `tabular-nums` (Inter numerals), never body roman.

## 3. Type

- Font: Inter via `next/font/google`, exposed as `--font-inter` on `<html>`
  (marketing pattern). `font-sans` = Inter; `font-data` for numerals.
- Docs prose scale (all existing tokens):
  - Page title (`Prose h1`): `--text-2xl` 600
  - Section head (`h2`): `--text-xl` 600
  - Subhead (`h3`): `--text-base` 600
  - Body: `--text-sm`/`--text-base`, `--text-secondary`, `leading-relaxed`
  - Caption/meta (`h4`, table captions, code labels): `--text-2xs`,
    `--text-muted`, sentence-case (no all-caps except the microcopy tier:
    `uppercase tracking-wider` reserved for the smallest labels).
- Measure: content column `max-w-[720px]`, paragraph `max-w-[65ch]`.
- No arbitrary type values in `className` (tokens only).

## 4. Layout — the Uniswap 3-column shell

```
1440px
┌──────────────────────────────────────────────────────────────────────────┐
│ topbar (sticky): wordmark · [App|Status|GitHub]        [search ⌘K]        │
├──────────────┬───────────────────────────────────────────┬───────────────┤
│ sidebar 280px │  content 720px (measure)        │  toc rail 200px       │
│ GET STARTED  │  h1  Page title                  │  On this page         │
│  • quick-start│  lede paragraph                  │  • Intro              │
│  • deploy…   │  h2 Section head                 │  • Section head       │
│ HOW IT WORKS │  Callout ▸ …                     │  • Subhead            │
│  • archit…   │  Steps (numbered)                │                       │
│ PORTFOLIO    │  CodeBlock (copy)                │  (scroll-spy, brand   │
│ LENDING      │  Table                           │   left bar on active) │
│  …           │  ────────────────                │                       │
│  prev/next   │  ← prev        next →            │                       │
├──────────────┴───────────────────────────────────────────┴───────────────┤
│ footer: GitHub · App · Status · feedback                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

- **<1024px**: sidebar collapses to a drawer (hamburger), TOC rail hidden,
  content full-width, topbar keeps search. No horizontal scroll at any width.
- Sticky layers use the existing z-index utilities (`z-header`, `z-sticky`,
  `z-drawer`, `z-floating`, `z-toast`).

## 5. Components (each: tokens · states · motion · a11y)

### `DocsLayout`
- Sticky topbar + the 3-column grid; renders `Sidebar`, `TocRail`, `PrevNext`.
- States: none (SSG — no loading/error/empty; content is authored markdown).
- Motion: content crossfade on route change (200ms, `EASE_OUT_QUART`, opacity +
  8px `translateY`, `data-motion`).
- A11y: `<header>`/`<nav>`/`<main>`/`<aside>` landmarks; skip link to `#main`.

### `Sidebar`
- Nav tree derived from `meta.json` (root + per-section), never hand-written.
- Active item: **shared `layoutId` pill** slides beneath the label (200ms,
  `EASE_OUT_QUART`) — the `ExploreHeader` precedent; `aria-current="page"`.
- Groups collapsible (chevron rotate, 200ms).
- Mobile: slide-in drawer (`z-drawer`), backdrop dim 150ms, Escape closes,
  focus trapped, reduced motion disables slide.
- Targets ≥ 44px.

### `TocRail`
- "On this page" list from the page's `h2`/`h3`.
- Scroll-spy: IntersectionObserver; active link gains a 2px brand left bar +
  `--text-primary` (150ms `EASE_OUT_QUART`). `aria-current="location"`.
- Hidden <1024px.

### `Prose`
- Semantic styles for markdown: h1–h4, p, ul/ol (markers `--text-secondary`),
  `a` (brand, underline on hover, focus ring brand), `table` (panel chrome:
  `border --border-subtle`, `rounded-lg`, sticky header, `border-b` rows,
  `tabular-nums` on numeric cells), `blockquote` (2px brand left rule, muted),
  `code` inline (`--surface-panel` bg, `font-mono`), `hr` (`--border-subtle`).
- `img`: `rounded-lg border --border-subtle`.

### `CodeBlock`
- `--surface-panel` bg, `--border-subtle` hairline, `rounded-lg`, `font-mono`.
- Header row: filename + **copy** button (44px target). Copy success draws the
  check via the existing `hh-check-draw` keyframe (300ms, reduced-motion off).
- Syntax: single-hue restrained palette — base `--text-secondary`, keywords
  brand, strings `--success`, comments `--mark-muted`, numbers `--text-primary`.
- Long lines scroll *inside* the block (`overflow-x-auto`), the page never does.

### `Callout`
- Tones: info (brand), success, warning, danger. **One tone per callout**, icon
  (lucide) + words. `--surface-card` bg, tone-tinted left rule or border at
  40% alpha. Danger text uses `--danger-fg`. Used sparingly — a callout is a
  promise ("before you act", "if this fails").

### `GuideCard` (homepage guide grid)
- `--surface-panel`, `rounded-lg`, hairline; icon + title + one line + arrow.
- Hover: `bg-surface-card-hover` step + hairline → `--border-strong` (100ms).
- Whole card clickable via stretched link (`::after`), nested controls
  `relative` above it; never `role="button"` on the container.

### `Steps`
- Numbered how-to (the in-app `/docs` 5-step pattern, componentized): brand
  index circle + title + one-line description. Static; no per-step motion.

### `TabStrip`
- Code language / inline-variant tabs (PageTabBar pattern): active = brand
  text + 2px brand underline, inactive muted, 200ms `EASE_OUT_QUART`. 44px.

### `Search`
- pagefind; trigger in the topbar (`⌘K`), input + results dropdown
  (`z-floating`). Open/close 200ms `EASE_OUT_QUART`, results stagger 50ms.
  Combobox pattern (aria-expanded, listbox, Esc, arrows). Reduced motion:
  no slide.

### `PrevNext`
- Previous / next from `meta.json` order at the content's foot; hairline top
  rule; `←` / `→`; labels `--text-muted` + titles `--text-primary`.

### `Breadcrumb` · `Feedback`
- Breadcrumb: `Section · Page`, muted, on the content column above h1.
- Feedback: "Was this helpful?" → yes/no → opens a prefilled GitHub issue +
  mailto. Static, no backend, no state.

## 6. Motion inventory (all from `lib/motion/tokens.ts`)

| Motion | Duration | Easing | Trigger |
|---|---|---|---|
| Content crossfade on route change | 200ms | `EASE_OUT_QUART` | `[data-motion]` |
| Active nav pill slide | 200ms | `EASE_OUT_QUART` | `layoutId` |
| Group collapse chevron + region | 200ms | `EASE_OUT_QUART` | click |
| Mobile drawer slide / backdrop dim | 200ms / 150ms | `EASE_OUT_QUART` | open/close |
| TOC scroll-spy active bar | 150ms | `EASE_OUT_QUART` | observer |
| Search dropdown open / result stagger | 200ms / 50ms | `EASE_OUT_QUART` | open |
| Copy success check draw | 300ms | `ease-out` | `hh-check-draw` |
| Hover lifts (cards, links) | 100ms | `EASE_OUT_QUART` | hover |

- **Reduced motion**: `MotionConfig reducedMotion="user"` at the root;
  `prefers-reduced-motion: reduce` collapses durations to 0 (CSS-level for the
  keyframe utilities); `data-motion` on every JS-driven motion element.
- **Banned**: bounce, elastic, persistent pulsing, ease-in, layout-thrashing
  properties (animate transform/opacity only).
- No decorative page-load stagger on every nav (a docs page is read, not shown).

## 7. Accessibility floor

- Skip link; landmarks; `aria-current` on nav/toc; focus-visible brand ring on
  every interactive; 44px targets; drawer focus trap + Esc; combobox pattern
  on search; `tabular-nums` on figures; contrast on the token set is already
  locked (grill #4 / R2 rules) — do not re-tint.

## 8. Anti-slop checklist (docs)

- [ ] Nav sidebar + prev/next derived from `meta.json` — no hand-written nav.
- [ ] Tokens only: no arbitrary values, no hex, no legacy `hh-*`/`slate-*`.
- [ ] One brand accent per page; status colors only in callouts/status.
- [ ] Surfaces at 3 depth steps, never same-color nesting; hairline borders.
- [ ] Motion functional (nav pill, drawer, scroll-spy, copy draw), reduced-motion
      honored, `data-motion` markers present.
- [ ] No page-level horizontal scroll at 360/390/414/768/820/1024/1440 (code
      scrolls inside its block only).

## 9. Visual language in-theme (amendment 2026-09-18)

The docs must read as HedgeHogs, not as a generic docs template. Reuse the
app + marketing assets (manifest: `COPY_KIT.md`); the docs chrome (sidebar,
TOC, prose, code) is Uniswap-shaped but wears our tokens.

### 9.1 What carries the brand
- The full token set (`globals.css`), dark-only, brand cyan as the one accent.
- Brand primitives copied as-is: `Button` (`cta`/`ghost`), `Card`, `StatTile`,
  `Accordion` (FAQ), `DexIcon`/`CryptoIcon`, `automation-icons`, `LogoText`.
- **Process animations** (owner's call, 2026-09-18) live on the pages that
  explain a process — they are content, not decoration:
  `how-it-works/automation` → `StrategyFlowAnimation`; each `automations/*`
  page → its `Auto*` animation; `how-it-works/architecture` →
  `ArchitectureDiagram` (non-custodial); `how-it-works/approvals` →
  `ApprovalsDiagram` (JIT).
- **Homepage hero** carries `DitherHero` — a **pure SVG/CSS dither** (brand
  glow + dot-grid + looping wave), no WebGL/three. `opacity-[0.28]
  mix-blend-screen`, bottom fade mask, wave static under reduced motion.
  Inner docs pages stay calm (no backdrop).

### 9.2 Animation engine (2026-09-19 rework — motion/react only)
- **One stack, no gsap, no three.** Every diagram is built on
  `lib/diagram/useDiagramLoop` (autoplay + loop; `t ∈ [0,1)` driven on an
  animation frame) inside a `DiagramShell`.
- **Static frame first:** the diagram's structure (nodes, labels, tracks,
  captions) is static JSX — always complete. Only the *transient/result* layer
  (token positions, bar fills, band placement) derives from `t` via
  `useTransform(t, window, value, { clamp: true })`, windows ending before
  `t ≈ 0.95` so the 1→0 wrap is invisible.
- **Reduced motion = the complete final frame** (t stays 1): the result state
  is shown (e.g. repaid debt bar, re-centered band), transient tokens hidden.
  No element of the static content is ever at `opacity: 0`.
- `verify-diagrams.cjs` asserts, per diagram: content renders, the animated
  layer loops, no page errors, and the reduced-motion frame is complete.
- The chrome stays calm (no per-nav stagger — motion inventory §6).

### 9.3 Fonts
- Inter via `next/font` only. The animations' `<text fontFamily>` keeps its
  `liebling, ui-sans-serif, system-ui` fallback chain; the docs repo does not
  load Typekit (Inter-only decision).

### 9.4 Provenance
- Every copied file carries a `COPIED from hedgehogs-marketing@<sha>` marker
  (COPY_KIT.md §Provenance) so future syncs can diff against the source.
- [ ] 44px targets, `aria-current`, landmarks, skip link, focus rings.
- [ ] Prose measure ≤ 720px; figures `tabular-nums`.
- [ ] Browser proof at 1440 + 390 before done.