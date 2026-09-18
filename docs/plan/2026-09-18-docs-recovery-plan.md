# hedgehogs-docs — recovery & optimization plan

**Date:** 2026-09-18 · Owner confirmed: docs are for **users and devs**, no
marketing phrases, no false promises. Companion to `2026-09-18-docs-ia.md`,
`2026-09-18-docs-design-spec.md`, `2026-09-18-docs-content-audit.md`, and the
facts register `2026-09-18-docs-code-verified-facts.md` (the single source of
truth for every number and claim).

---

## 1. Why a recovery plan

Documentation is scattered across every repo (contracts, indexer, bot,
backend, infra, halborn-audit, the old GitBook, the in-app `/docs`) with
**duplication and contradictions**:

- 4+ fee docs disagree; the code (`FeeSchedule.sol`) disagrees with all of them
  (lending & LP are 0%, not 0.5%).
- 3 different savings claims (95% / 87% / 67-85%) — none code-verified.
- "Ethereum mainnet live" vs `config/contracts.ts` (Mainnet not deployed).
- "User emergency-exit eject button" vs code (bot-only, no force flag).
- "Audited" claims vs Hashlock's "Vulnerable" preliminary rating (fixes in
  code, re-verification pending).
- The old GitBook is full of placeholders (Discord links, Immunefi, "#").

The docs site must publish only **code-verified, current** content.

## 2. The target: how Uniswap documents its contracts

Pattern observed on `developers.uniswap.org` (2026-09-18):

| Uniswap element | What it is | Our equivalent |
|---|---|---|
| **Concepts** | Architecture in prose + diagrams, not code dumps | `how-it-works/*` (architecture, proxy-model, approvals, automation) |
| **Guides** | Step-by-step "how to do X" with snippets | `lending/*`, `liquidity/*`, `portfolio/*`, `automations/*` |
| **Deployments** | Addresses per chain (`/deployments`) | `protocols/deployments` (new) |
| **Reference** | Generated API / contract reference, linked not re-printed | `protocols/contracts` (one line per strategy/connector + repo links), `reference/fees` |
| **Audits** | Transparent links to published audit reports, honest status | `security/overview` (Hashlock: what was found, what was fixed, re-verification pending) |
| **FAQ** | Collapsible, direct answers | `faq` |
| **/llms.txt** | Agent-readable markdown index | static route (planned in renderer) |

No code re-printing: the docs link the repos and explain concepts.

## 3. Workflow — five steps

### 3.1 Harvest
Copy every candidate doc into `hedgehogs-docs/archive/` once (git history
keeps them for the transform pass). Sources:
`hedgehogs-contracts/docs/**` (incl. `strategies/user-*.md`), `FINAL_AUDIT_REPORT.md`,
`HASHLOCK_FIX.md`, the Hashlock PDF; `hedgehogs-bot/docs/sc/**`;
`hedgehogs-indexer/docs/**`; the old GitBook; the in-app `/docs` animations +
copy; `hedgehogs-frontend/docs/Product.md`, `SMART_CONTRACT_INTEGRATION.md`.

### 3.2 Triage
Classify each file **public / source / internal**:
- **Public** → transformed into `content/`.
- **Source** → mined for facts, traced in `SOURCES.md`, not published raw.
- **Internal** → stays in its repo (handoffs, plans, specs, runbooks,
  deployment guides, test plans, backlogs, MCP-SCOPE, SIZE-BUDGET…). A public
  docs site never ships runbooks or credentials-adjacent material.

### 3.3 Arbitrage
Every disputed fact resolves against `2026-09-18-docs-code-verified-facts.md`
(the register), not against any marketing doc. Recorded decisions:
fees → `FeeSchedule.sol` · savings % → removed (unverified) · audit → Hashlock
preliminary + fix tracker + pending re-verification · chains → Base + BSC live,
Mainnet in preparation · vocabulary → `lib/copy/account.ts` + UI strings ·
emergency exit → bot automation + "Exit & Uninstall".

### 3.4 Transform
Write the 26 pages of `content/` from the triaged + arbitrated material, in
the app's exact vocabulary, following the design spec. Pages with animations
import `@/components/docs/<Name>`. Content rules: no superlatives, no fake
promises, D2 (missing = `—`), one fact once, users + devs audience.

### 3.5 Provenance
`SOURCES.md` in the docs repo: every page ← source repo + file + last-verified
date. Re-sync triggers: contracts merge, portfolio merge
(`feat/portfolio-truthful-hero`), homepage merge (`feat/app-homepage-split`),
and any `HASHLOCK_FIX`/audit update.

## 4. Deliverables & sequencing

| # | Artefact | Depends on | When |
|---|---|---|---|
| 1 | `2026-09-18-docs-code-verified-facts.md` (facts register) | code verification (done 09-18) | ✅ done |
| 2 | `2026-09-18-docs-recovery-plan.md` (this file) | — | ✅ done |
| 3 | Re-verdict the content audit against the register (edit `2026-09-18-docs-content-audit.md`) | facts register | next |
| 4 | Owner creates `hedgehogs-docs` repo (correct org) | owner | before Phase 1 |
| 5 | Phase 1 — harvest + triage + `SOURCES.md` skeleton in the docs repo | repo | after 4 |
| 6 | Phase 1 — content `content/` MDX (26 pages) from the audit + register | after 5 | big chunk |
| 7 | Phase 2 — renderer (design spec): shell, components, motion, animations, `/llms.txt`, pagefind | repo | parallel to 6 |
| 8 | Screenshots 1440 + 390 (usage pages) — stable surfaces now, portfolio after its merge | app | Phase 6/7 |
| 9 | Vercel + DNS `docs.hedgehogs.app`, app-homepage "Docs" link | owner + homepage merge | end |
| 10 | Browser pass, design-grill, code-review | — | end |

## 5. Content rules (from the owner's "no marketing, no false promises")

1. The docs address users AND developers. Usage pages are first-person-app
   ("you"), reference pages are neutral.
2. Every figure traces to the facts register or a write-time verification.
   No savings % without a source. No "audited & safe". No "revolutionizing".
3. Missing measurement renders `—`; never a plausible-looking number (D2).
4. Fees presented as the seeded schedule, governance-set, not a promise.
5. The app's vocabulary is used verbatim (HedgeHog account, Net worth, panel
   names, action labels).

## 6. Open decisions for the owner

- **Audit page**: use the honest wording from the register (fixed-in-code,
  re-verification pending) — confirmed by the owner's "no false promises".
- **Chains**: document Base + BSC live, Mainnet in preparation.
- **Savings claims**: removed from the docs unless a source (e.g. BP.pdf) is
  provided.
- **Repo org**: create `hedgehogs-docs` under the correct org (old is
  `HedegeHogs` typo; marketing has no remote yet).