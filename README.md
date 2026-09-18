# hedgehogs-docs

The HedgeHogs documentation site — `docs.hedgehogs.app`. A Uniswap-style
developer/usage docs site, dark-only, built with Next.js 16 + MDX on the
shared HedgeHogs design tokens.

## Stack

- Next 16 (app router) + TypeScript + Tailwind v4
- MDX via `next-mdx-remote/rsc`, content in `content/` with `meta.json` per section
- `motion` for the shell, `gsap` for the ported process animations
- three / R3F for the dither hero background
- pagefind-free search: a build-time JSON index served at `/search-index.json`
- `/llms.txt` for agent-readable navigation

## Getting started

```bash
npm install
npm run dev        # http://localhost:3022
```

## Checks (before pushing)

```bash
npx tsc --noEmit
npx eslint . --quiet
npm test
npm run build
```

## Structure

```
content/            # the docs — meta.json per section + .mdx pages
components/docs-ui/ # the shell: Sidebar, TocRail, Prose, CodeBlock, Callout, Search…
components/docs/    # ported process animations (gsap, reduced-motion guarded)
components/landing/ # Dither backdrop + the architecture / approvals diagrams
lib/docs/nav.ts     # meta.json → nav tree, frontmatter, prev/next, TOC, search index
app/                # layout, homepage, /docs/[...slug], /llms.txt, /search-index.json
legacy-gitbook/     # the old GitBook content (source material only)
docs/plan/          # the spec that built this site (IA, design spec, facts register, COPY_KIT)
```

## Design

- Dark-only, the shared token system (`styles/globals.css`), brand cyan as the
  one accent.
- 3-column layout (sidebar / content / TOC) with a mobile drawer below `lg`.
- Every figure in the content traces to `docs/plan/2026-09-18-docs-code-verified-facts.md`
  — no marketing numbers, no false promises (owner rule).