# docs/infra — index

The infrastructure / domains / repos map. New infra documents are added here
in the same commit.

| Doc | What it is |
|---|---|
| [`2026-09-17-domains-and-repos.md`](./2026-09-17-domains-and-repos.md) | The domain & repo split (Uniswap model): app / web / docs / demo / api subdomains, what moves where, the sequencing. Owner-approved. |
| [`2026-09-18-docs-ia.md`](./2026-09-18-docs-ia.md) | `hedgehogs-docs` information architecture, repo layout (`content/` + `meta.json`), `/llms.txt`, coordination with the portfolio and homepage sessions. |
| [`2026-09-18-docs-design-spec.md`](./2026-09-18-docs-design-spec.md) | The docs renderer contract: theme (dark-only), colors, type, 3-column layout, every component's tokens/states/motion/a11y, the motion inventory, the anti-slop checklist. |
| [`2026-09-18-docs-content-audit.md`](./2026-09-18-docs-content-audit.md) | Page-by-page source mapping for the docs content (old GitBook, in-app `/docs`, Product.md, SMART_CONTRACT_INTEGRATION.md, actions-inventory) with reuse/stale/missing verdicts and the **code-verified answers** to the D2 questions. |
| [`2026-09-18-docs-code-verified-facts.md`](./2026-09-18-docs-code-verified-facts.md) | **The facts register** — every figure/claim verified against code on 2026-09-18: Hashlock audit status, the fee schedule, live chains, the account model, JIT approvals, emergency exit, the strategy/connector surface, and the exact app vocabulary. Single source of truth for the docs content. |
| [`2026-09-18-docs-recovery-plan.md`](./2026-09-18-docs-recovery-plan.md) | The recovery & optimization plan: how Uniswap documents its contracts, the harvest → triage → arbitrage → transform → provenance workflow, deliverables, and the content rules (no marketing, no false promises, users + devs). |
| [`COPY_KIT.md`](./COPY_KIT.md) | The integration manifest — every asset copied from `hedgehogs-marketing`/`hedgehogs-frontend` into the docs repo so it looks like the app + marketing: tokens, brand primitives, process animations (the 5 `components/docs/*`), the dither background for the homepage hero, the two new diagrams, and the package deps. |