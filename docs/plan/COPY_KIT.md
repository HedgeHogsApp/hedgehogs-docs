# hedgehogs-docs — COPY_KIT (integration manifest)

**Date:** 2026-09-18 · The exact list of files to copy from
`hedgehogs-marketing` (or `hedgehogs-frontend` — the two repos carry
**byte-identical** copies of every asset below, verified by md5) into the new
`hedgehogs-docs` repo, so the docs look like the app + marketing site while
staying dark-only and reading-focused.

Owner confirmed (2026-09-18): reuse the theme, reuse the automation process
animations in the docs, and carry the **dither background** onto the docs
homepage hero in the style of Uniswap's docs background.

---

## Tier 1 — copy as-is (byte-for-byte, then don't diverge)

### Design system
| Path (source) | In the docs repo | Why |
|---|---|---|
| `styles/globals.css` (866 lines) | `styles/globals.css` | The whole token system incl. `--anim-*`, keyframes, scrollbars, z-index utils. Keep the light `:root` block (harmless, door open) but the site is dark-only. |
| `lib/utils.ts` | `lib/utils.ts` | `cn()` with the extended tailwind-merge. |
| `lib/motion.ts` | `lib/motion.ts` | Interior spring configs (used by `interior/accordion`). |
| `lib/motion/tokens.ts` | `lib/motion/tokens.ts` | The duration/easing scale. |
| `contexts/ThemeContext.tsx` | `contexts/ThemeContext.tsx` | Dark-only provider (owner, 2026-07-06). |

### Brand primitives
| Path | Why |
|---|---|
| `components/ui_components/button.tsx` | `cta`/`ghost`/`outline` recipes (the `neutral` gradient is retired). |
| `components/ui_components/checkbox.tsx` | shadcn checkbox. |
| `components/ui_components/skeleton.tsx` | loading chrome. |
| `components/ui_components/card.tsx` | `Card` + `OuterCard`/`InnerCard` (used by the ported animations' wrappers). |
| `components/ui_components/stat-tile.tsx` | KPI tiles on the homepage (Net worth strip, protocol tiles). |
| `components/ui_components/accordion.tsx` + `components/interior/accordion.tsx` | FAQ accordion (needs `lib/motion.ts`). |
| `components/ui_components/automation-icons.ts` | The canonical automation icon map (used by homepage automations grid + Automations pages). |
| `components/DexIcon.tsx` + `components/CryptoIcon.tsx` + `hooks/useResponsiveIconSize.ts` + `contexts/TokensContext.tsx` (marketing stub) | Protocol + token marks with local SVG fallbacks. |
| `components/ui/LogoText.tsx` + `public/logo_text_dark.svg` + `public/logo_text_light.svg` | The wordmark. |

### Assets
| Path | Why |
|---|---|
| `public/dexes/` (18 files), `public/chains/` (7), `public/icons/` (subset the docs actually references: eth, usdc, wbtc, knc, aave…) | Protocol/chain/token marks. |
| `public/icons/generic-token.svg` | `CryptoIcon` terminal fallback. |
| `public/favicon.svg` | favicon. |
| `public/wallets/` (metamask, rabby), `public/lendingprotocols/` (aave), `public/dexes/uniswap.svg` | StrategyFlowAnimation assets. |

### Process animations (the owner's favourite)
| Path | Why |
|---|---|
| `components/docs/StrategyFlowAnimation.tsx` | The full Aave ↔ Uniswap automation loop → `how-it-works/automation`. |
| `components/docs/AutoCompoundAnimation.tsx` | → `automations/auto-compound`. |
| `components/docs/AutoRepayAnimation.tsx` | → `automations/auto-repay`. |
| `components/docs/AutoCollaterizeAnimation.tsx` | → `automations/auto-collateralize`. |
| `components/docs/AutoHarvestAnimation.tsx` | → `automations/auto-harvest`. |
| `components/landing/CapitalRouting.tsx` (`RoutingScene`) | **Adapt** → the new architecture + JIT diagrams (see Tier 2). |
| `components/landing/Dither.jsx` **+ `Dither.d.ts`** | The dither WebGL background → docs homepage hero (Uniswap-docs-style background, our dither). Keep the `.jsx`, keep both files. |

## Tier 2 — copy then adapt (do NOT copy blind)

| Item | Adaptation |
|---|---|
| The 5 `components/docs/*` animations | Add a **`prefers-reduced-motion` guard** (pause the gsap timeline + render a settled frame) and `data-motion` markers — today they loop forever. The docs spec bans persistent pulsing. `gsap.globalTimeline.pause()` when `matchMedia('(prefers-reduced-motion: reduce)')` matches, or a static final frame. |
| `RoutingScene` (CapitalRouting) | Wrap for a settled/reduced state (pass a constant progress `1`), then reuse as the base pattern for the two new diagrams. |
| **New: `ArchitectureDiagram`** | Animated non-custodial diagram — wallet → **your** proxy → connectors/strategies → protocols, bots labelled "automation" (cannot withdraw). Modelled on `RoutingScene`: one progress MotionValue, bezier rails, GPU transforms. For `how-it-works/architecture`. |
| **New: `ApprovalsDiagram`** | JIT approval flow — user approves the proxy once; the proxy approve→call→reset per protocol. Same pattern. For `how-it-works/approvals`. |
| Fonts | Inter via `next/font` (as marketing). The animations reference `liebling` in `<text>` fontFamily — keep the fallback chain (`liebling, ui-sans-serif, system-ui`); the docs repo does NOT load the Typekit script (Inter-only decision). |

## Tier 3 — do NOT copy

- `pages/index.tsx` landing (waitlist form, PreviewShell) — the docs homepage is rebuilt from the design spec.
- `pages/api/*`, `email-templates/`, waitlist plumbing.
- `e2e/`, `test/`, playwright config — repo-specific.
- The seeded `OverviewPreviewContent` / preview providers — docs shows the process animations, not a live preview.

## package.json additions (from the source package.json)

`motion@^12`, `gsap@^3.13`, `three@^0.185`, `@react-three/fiber@^9`, `@react-three/postprocessing@^3`, `postprocessing@^6`, `d3-scale`, `d3-shape`, `@radix-ui/react-checkbox`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tailwindcss@^4`, `tw-animate-css`, plus the pagefind deps for search and the MDX deps.

## Dither homepage background (owner request, 2026-09-18)

The docs homepage hero carries the marketing `Dither` backdrop the same way
the landing does: `next/dynamic(…, { ssr:false })`, mounted at low opacity
(`opacity-[0.28] mix-blend-screen`) with a bottom fade mask, `dpr={1}`,
`disableAnimation` under reduced motion. Uniswap-docs-style: an ambient
background that reads as brand, never competing with the text column.
Not used on inner docs pages (a reading surface stays calm).

## Provenance

When the docs repo exists, each copied file keeps a `// COPIED from
hedgehogs-marketing@<sha> (2026-09-18)` marker so a future sync can diff
against the source instead of guessing.