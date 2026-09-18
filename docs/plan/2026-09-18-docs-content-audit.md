# hedgehogs-docs — content audit (source mapping)

**Date:** 2026-09-18 · Companion to `2026-09-18-docs-ia.md` and
`2026-09-18-docs-design-spec.md`. For every page in the IA, this lists the
source material, a verdict, and what must be verified/written fresh.

Verdicts:
- **REUSE** — copy the content with light copy edit; conceptually current.
- **REUSE+EDIT** — carry the concept, but rewrite: figures/numbering changed,
  UI moved, or the voice is too marketing-y for a usage page (the product voice
  is "refined, honest"; no superlatives, D2).
- **MANQUANT** — no usable source; must be written from the current app + specs.

Sources (short names):
`G#` = old GitBook (`hedgehogs-docs` repo, `HedegeHogs/…`); `APP` = the in-app
`/docs` (`pages/docs.tsx` + `components/docs/*`); `PROD` =
`docs/Product.md`; `SCI` = `SMART_CONTRACT_INTEGRATION.md`; `ACT` =
`docs/superpowers/portfolio/2026-09-16-actions-inventory.md`; `DS` =
`docs/design-system/*` (component recipes).

---

## Get started

| New page | Source | Verdict | Carry over / write |
|---|---|---|---|
| `quick-start` | G2 README, PROD Journey 1, ACT | **REUSE+EDIT** | The 3-step first run (connect → deploy → first supply). Rewrite: the connect/deploy flow is `useForkBetaConnect` + `ProxyOnboarding` now, not the GitBook button. Keep it to one screen of steps + next links. |
| `deploy-account` | G2 `creating-a-proxy.md`, ACT | **REUSE+EDIT** | What a proxy is + why (non-custodial, JIT). Rewrite numbers: GitBook says $10-15 gas / 87% savings / 67-85% — inconsistent with the locked "95% cheaper" claim. Verify against current product before printing any figure (D2: never guess). |
| `dashboard-tour` | APP (the whole `/docs` page), G2 `dashboard.md` | **MANQUANT** | The dashboard is the rebuilt portfolio surface (banner + panels). Write from the portfolio spec (§13) + screenshots. The in-app `/docs` "How it works" 5-step + Key Benefits content folds in here. |

## How it works (non-custodial architecture)

| New page | Source | Verdict | Carry over / write |
|---|---|---|---|
| `architecture` | G5 README, SCI §1 | **REUSE+EDIT** | The architecture diagram (wallet → proxy → connectors/strategies → protocols) + the non-custodial line ("funds sit in YOUR proxy; you are the owner; bots cannot withdraw"). G5's deep-dives (Aave/Uniswap flows) are accurate and valuable — keep the flows, drop the fee figures until verified. |
| `proxy-model` | G5 `key-components.md`, `position-linking.md`, G2 `creating-a-proxy.md` | **REUSE+EDIT** | Account model: one proxy per user, what it owns (aTokens, LP NFTs), what the owner can do vs what bots can/cannot. Drop multi-sig + "deploy new proxy on upgrade" unless the current product has it (verify). |
| `approvals` | G5 README §JIT, G2 `creating-a-proxy.md`, PROD | **REUSE+EDIT** | The JIT story: approve your proxy once, proxy handles protocol approvals. The "95% cheaper" figure is the locked claim — use it, not GitBook's inconsistent 67-85%. |
| `automation` | G5 README §Strategy Engine, G3 README, APP (`StrategyFlowAnimation`) | **REUSE+EDIT** | How automation works (bot monitors positions, executes enabled strategies on-chain, permissionless). Embeds `<StrategyFlowAnimation />`. The 5-step + Key Benefits text from the in-app page folds in here. |

## Portfolio (usage)

| New page | Source | Verdict | Carry over / write |
|---|---|---|---|
| `overview` | portfolio spec §13 (D64–D78), ACT | **MANQUANT** | Write from the spec: banner (net worth, chart, HF) + panels (Liquidity, Lending, Strategies, Idle, Activity). `<!-- re-sync on portfolio merge -->`. |
| `reading-positions` | ACT, DS `entity-row` / `DataTable` | **MANQUANT** | Rows (name + chain/protocol badges), the detail side-panel, what each figure means. Say once: band words live in tooltips; measured vs `—`. |
| `activity` | portfolio handoffs (per-event feed), ACT | **MANQUANT** | The per-event activity feed, opening a transaction, USD only where measured. |

## Lending (usage)

| New page | Source | Verdict | Carry over / write |
|---|---|---|---|
| `supply` | ACT Panel 1–2 | **MANQUANT** | Entry from Explore Lend (fast link, filtered) vs manage from the account panel. What the form may state (supply APY, available liquidity, LTV). |
| `borrow` | ACT Panel 2 | **MANQUANT** | Borrow against collateral, HF projection, E-Mode. |
| `repay` | ACT Panel 3 | **MANQUANT** | The primary remedy near liquidation; repay from the account panel. |
| `withdraw-collateral` | ACT Panel 2–3 | **MANQUANT** | Withdraw, use-as-collateral toggle, E-Mode. |
| `health-factor` | G3 `health-factor.md` | **REUSE+EDIT** | What HF is, safe bands, near-liquidation behaviour. Rewrite against the app's band words + banner HF (spec §13). |

## Liquidity (usage)

| New page | Source | Verdict | Carry over / write |
|---|---|---|---|
| `add-liquidity` | G2 `zap.md`, PROD, ACT Panel 4 | **REUSE+EDIT** | Add liquidity (zap in, single-token entry) + the wizard. Rewrite steps against the current pools UI + side-panel kit. |
| `manage-range` | G4 `liquidity-pools.md`, G3 `auto-rebalance.md` | **REUSE+EDIT** | Range selection, out-of-range, when to rebalance. Carry the IL explainer lightly (link to the range concept, don't lecture). |
| `remove-and-fees` | ACT Panel 4 | **MANQUANT** | Remove liquidity, collect fees, close. Written from the current panel. |

## Automations (usage — one page per primitive)

Each embeds its animation component from `components/docs/*`. Source = the
matching G3 strategy file + the animation + the app's strategy surface.

| New page | Source | Verdict | Carry over / write |
|---|---|---|---|
| `overview` | G3 README, `configure-strategies.md` | **REUSE+EDIT** | What a strategy is, composition (the palette), chain flags, where it lives in the app. Drop the old JS config examples if the UI config differs. |
| `auto-compound` | G3 `strategies/auto-compound.md` + APP `<AutoCompound />` | **REUSE+EDIT** | Reinvest fees. The problem→solution prose is sound; trim to the usage page the owner asked for. |
| `auto-repay` | G3 `strategies/auto-repay.md` + APP `<AutoRepay />` | **REUSE+EDIT** | Pay down debt with earned fees. |
| `auto-rebalance` | G3 `strategies/auto-rebalance.md` + APP (has no standalone animation — reuse the strategy flow) | **REUSE+EDIT** | Keep LPs in range. **Automation-first** (owner 15 Sep). `<!-- re-sync on portfolio merge -->`. |
| `auto-harvest` | G3 `strategies/auto-harvest.md` + APP `<AutoHarvest />` | **REUSE+EDIT** | Move profits back to the wallet. |
| `auto-collateralize` | G3 `strategies/auto-collateralize.md` + APP `<AutoCollaterize />` | **REUSE+EDIT** | Strengthen collateral against liquidation. |

## Protocols & markets (brief)

| New page | Source | Verdict | Carry over / write |
|---|---|---|---|
| `supported-chains` | G FAQ, contracts config | **REUSE+EDIT** | Ethereum · Base · BNB. Verify the live list (local forks route differently in dev). Keep it one short table. |
| `aave-v3` | G6 `connectors.md`, SCI | **REUSE+EDIT** | What HedgeHogs reads (supply/borrow APY, LTV, HF) and writes (supply/borrow/repay/withdraw) on Aave. Brief — the owner wants an explainer, not a protocol essay. |
| `uniswap-v3` | G6 `connectors.md`, SCI | **REUSE+EDIT** | LP positions, ranges, fee tiers, why proxy ownership is required (G5's NFT argument). Brief. |
| `curve-and-others` | G README Stage 1, G6 `connectors.md` | **REUSE+EDIT** | Roadmap connectors (Compound, Curve, Balancer…). One short page; mark what is live vs roadmap. |

## Security

| New page | Source | Verdict | Carry over / write |
|---|---|---|---|
| `security/overview` | G `appendix/security.md`, `appendix/fees.md`, G2 `emergency-exit.md`, G6 `audits.md` | **REUSE+EDIT** | Non-custodial model, revoke anytime, emergency exit, audits. **Verify**: the audits page must name the real audit (there is a `hedgehogs-halborn-audit` repo) — GitBook says "audits (planned)" which is stale. Fees: GitBook's 0.5%/0.1-0.3% must be verified against the current directory fee config. |

## FAQ

| New page | Source | Verdict | Carry over / write |
|---|---|---|---|
| `faq` | G `appendix/faq.md`, `fees.md`, `support.md` | **REUSE+EDIT** | Skeleton is good; every placeholder (Discord, Immunefi, `#`) is replaced with the real destinations or dropped. Fee/risk answers verified against current product. Keep it short and linked from the rest of the site. |

---

## Cross-cutting verification — ANSWERS (code-verified 2026-09-18)

Every figure/flow below was resolved against the facts register
`2026-09-18-docs-code-verified-facts.md` (the single source of truth). These
answers replace the open questions; a page may only print a number it finds
there or re-verifies at write time.

1. **Deployment cost** — NOT code-verified; the savings claims (95% / 87% /
   67-85%) are contradictory marketing. **Removed from the docs** until a
   source is provided. The mechanism (one approval per token) is real; the % is
   not.
2. **Fees** — `FeeSchedule.sol` is authoritative: **lending 0% · LP 0% · zap
   0.1% · manual rebalance 0.01% · manual harvest 0.5% · emergency exit 1% ·
   auto-harvest/compound 1% · auto-repay/collateralize 0.05% · auto-rebalance
   0.01% · stop-loss/take-profit 0.5%**. `defaultFeeBPS = 0` (governance
   opt-in). The GitBook's 0.5%/0.1-0.3% is wrong.
3. **Supported chains** — production config: Mainnet (1), Base (8453), BSC
   (56) + local forks. **Mainnet is NOT deployed** (`config/contracts.ts:
   306-307`). Docs: *Base + BSC live, Mainnet in preparation*. Never list the
   `Local*` fork ids as user chains.
4. **Audits** — real audit = **Hashlock Preliminary Report (May 2026)**:
   rating *Vulnerable*, 1 High / 13 Med / 22 Low, all Unresolved at report
   time. `HASHLOCK_FIX.md` tracks 36/36 fixed in code (+ regression tests);
   H-01 fix verified in `AutomationStrategy.sol:111-145`. **Re-verification
   pending — no clean audit published.** `FINAL_AUDIT_REPORT.md` is
   internal ("Auditor: Claude") — not a third-party audit. `hedgehogs-halborn-audit`
   is the docs/audit-ready repo, not a Halborn report.
5. **Strategy configuration** — configuration is through the **app's strategy
   UI** (`/strategies` wizard: Name → Entities → Routing → Protections →
   [Authorize] → Review), not the old G3 `setConfig` API. The docs describe
   the app. Strategy names: Auto Compound / Auto Harvest / Auto Rebalance /
   Auto Repay / Auto Collateralize / Auto Hedge / Stop-Loss / Take-Profit /
   Auto Sweep / Auto Refinance / Auto Migrate Yearn (bot), plus per-protocol
   user strategies (Aave, Morpho, Compound, Curve, Yearn, Balancer, Aerodrome,
   PancakeSwap).
6. **Auto-rebalance** — automation-first since the 15 Sep round: docs say
   "Rebalance is for automation", never "instant rebalance" as a headline.
7. **Emergency exit** — code says bot-only (`onlyAuthorizedBot`), no `force`
   flag. The GitBook "user eject button" is wrong. Docs describe the real
   paths: bot automation exit + the app's per-strategy **Exit & Uninstall**.
8. **Vocabulary** — use the app's exact strings (HedgeHog account, Net worth,
   panel names, action labels — facts register §8). Never "proxy"/"Smart
   Proxy" to the user.

## Re-sync markers

Pages with `<!-- re-sync on portfolio merge -->` in the IA are checked against
the merged `feat/portfolio-truthful-hero` when it lands; the audit table here
is the checklist. The homepage app links `docs.hedgehogs.app` — the docs
Vercel/DNS should be live by then.