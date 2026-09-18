# hedgehogs-docs — code-verified facts register

**Date:** 2026-09-18 · The single source of truth every docs page consults
before printing a number or a claim. Each fact was verified against code on
2026-09-18. When a page contradicts this register, the register wins.

Sources: `hedgehogs-contracts` (src + HASHLOCK_FIX.md + Hashlock report),
`hedgehogs-frontend` (config/contracts.ts, useStrategies.ts, lib/copy/*).

---

## 1. Audit status (Hashlock — what the docs may say)

**Verified 2026-09-18.**

| Fact | Value | Evidence |
|---|---|---|
| Audit firm | Hashlock Pty Ltd, Preliminary Report v1 | `docs/Hedgehogs_Deal_Smart_Contract_Audit_Report_Preliminary_Report_v1.pdf` |
| Date / scope | May 2026 · commit `e8def2ed…` · all of `src/` | PDF p.7, scope |
| Rating | **Vulnerable** | PDF §Security Rating |
| Findings | **1 High · 13 Medium · 22 Low**, all **Unresolved** at report time | PDF §Audit Findings |
| H-01 | `AutomationStrategy._validateSlippage` raw-unit ratio breaks cross-decimal swaps → bot cannot repay/exit dominant LP+borrow patterns | PDF p.16-17 |
| Conclusion | "sound and well-tested code base", findings must be resolved | PDF §Conclusion |
| Re-verification | **NOT done** — "Fix Review GitHub Commit Hash" field empty; Hashlock has not re-verified any finding | PDF p.7 + HASHLOCK_FIX.md §Pending E1 |
| Fix tracker | `HASHLOCK_FIX.md` claims **36/36 resolved** in code + regression tests | HASHLOCK_FIX.md:15 |
| H-01 fix verified in code | **Yes** — `_validateSlippage` is price-aware via `directory.priceOracle()` (USD-value floor, 5% max), grace-degradation only on `emergencyExit` | `src/strategies/AutomationStrategy.sol:111-145` |

**Docs wording (honest, no marketing):** the docs site says the Hashlock
preliminary audit found 1 High / 13 Medium / 22 Low; all were fixed in code
and regression-tested, tracked in `HASHLOCK_FIX.md`; Hashlock re-verification
is pending — no clean/passing audit is published. **Never** say "audited" or
"battle-tested" as a security claim.

## 2. Fees — the authoritative schedule

**Verified against `src/libraries/FeeSchedule.sol` (seeded rates) +
`src/libraries/FeeConstants.sol` + `src/HHDirectory.sol`.**

Two contexts: `USER_CONTEXT` (owner-callable) vs `BOT_CONTEXT` (approved bot).
Rates are **governance-set** (`feeRegistry`, `onlyAdmin`), not immutable —
`defaultFeeBPS = 0` ("OFF by default — governance opts in"). `MAX_FEE_BPS = 400` (4%).

| Operation | Context | BPS | % | Line |
|---|---|---|---|---|
| Supply / borrow (Aave) | USER | 0 | **0%** | `FeeSchedule.sol:40` |
| LP provision (UniV3) | USER | 0 | **0%** | `FeeSchedule.sol:42` |
| Migration | USER | 0 | 0% | `FeeSchedule.sol:52` |
| Zap (single-token → LP) | USER | 10 | 0.1% | `FeeSchedule.sol:44` |
| Manual rebalance | USER | 1 | 0.01% | `FeeSchedule.sol:48` |
| Harvest (manual) | USER | 50 | 0.5% | `FeeSchedule.sol:50` |
| Emergency exit | BOT | 100 | 1% | `FeeSchedule.sol:46` |
| Auto-harvest | BOT | 100 | 1% | `FeeSchedule.sol:27` |
| Auto-compound | BOT | 100 | 1% | `FeeSchedule.sol:29` |
| Auto-rebalance | BOT | 1 | 0.01% | `FeeSchedule.sol:31` |
| Auto-collateralize | BOT | 5 | 0.05% | `FeeSchedule.sol:33` |
| Auto-repay | BOT | 5 | 0.05% | `FeeSchedule.sol:35` |
| Auto stop-loss / take-profit | BOT | 50 | 0.5% | `FeeSchedule.sol:67,69` |
| Perp hedging | BOT | 50 | 0.5% | `FeeSchedule.sol:56` |
| FY hedging | — | 50 | **not shipped** (Pendle roadmap) | `FeeSchedule.sol:58-62` |

Referral/discounts (`HHDirectory.sol`): invitee discount 5% (`:295`), referrer
share 10% (`:298`), max combined discount 50% (`MAX_DISCOUNT_BPS=5000`).

**The old GitBook fee table (0.5% user / 0.1–0.3% bot) is WRONG.** Lending and
LP provision are 0%. The selector→BPS on-chain mapping is in
`script/Deploy/lib/FeeSeeder.sol:96-210` — not the `.env.example` fee vars,
which conflict and are not authoritative.

## 3. Chains — what's live

**Verified against `hedgehogs-frontend/config/contracts.ts:476-500` and
`hedgehogs-contracts/script/Deploy/NetworkConfig.sol:38-50`.**

| Chain | Chain ID | Status | Notes |
|---|---|---|---|
| Ethereum Mainnet | 1 | **NOT deployed** (`config/contracts.ts:306-307`) | "Mainnet is NOT deployed yet" — docs say *in preparation* |
| Base | 8453 | Live | Local fork dev id 31338 |
| BNB Smart Chain | 56 | Live | Local fork dev id 31339 |
| Arbitrum / Optimism | 42161 / 10 | Config exists | No live deployment evidence |
| Local forks | 31337/31338/31339 | Dev only | Never documented as user chains |

Protocol→chain manifest (`config/contracts.ts:489-500`): aave Mainnet/Base/BSC;
morpho + compound Mainnet/Base; uniswap-v3 Mainnet/Base; curve all three;
pancake-v3 BSC+Base; aerodrome + slipstream Base; yearn Mainnet; balancer
Mainnet/Base.

## 4. The account model (what the UI calls it)

- **UI noun: `HedgeHog account`** (never "proxy" to the user) —
  `hedgehogs-frontend/lib/copy/account.ts:12-13`. Deploy surface:
  `ProxyRequiredPanel` — title **"Deploy your HedgeHog account"**, CTA
  **"Deploy HedgeHog account"** (`ProxyRequiredPanel.tsx:155,173`).
  Legacy `ProxyOnboarding.tsx` ("Smart Proxy") is dead code — do not cite it.
- Proxy = EIP-1167 deterministic clone (`Clones.cloneDeterministic`,
  `HHFactory.sol:181`), owner-set at initialize. `HH.sol` (385 lines) routes
  `delegatecall` multicalls only to whitelisted protocol targets, max 50 steps,
  caller = owner or approved strategy (`HH.sol:133-203`).
- **Non-custodial (verified):** admin can pause + set fee rates + manage
  whitelists, but **cannot move user funds**. Asset-out functions are
  `onlyOwner` (`transferERC20/ETH/NFT/sweepToken`, `HH.sol:212-276`) and work
  during a pause. The only admin-directed flow is the fee to
  `directory.collector()`. Strategies return proceeds to the proxy owner.

## 5. JIT approvals — the real mechanism

- User → proxy: **one-time unlimited approval**; the proxy pulls via
  `safeTransferFrom(owner, …)` (`TransferLib.sol:97`).
- Proxy → protocols: **approve → call → reset-to-zero** per operation inside
  the connectors (e.g. `UniswapV3Connector.sol:60-81`), gated on an admin
  router allowlist (`RouterGuard.requireApprovedRouter`, `RouterGuard.sol:48`).
- The "95% cheaper approvals" figure is **not code-verified** — do not print a
  savings % without a source. The mechanism (one approval per token, no
  per-protocol approvals) is real.

## 6. Emergency exit — the real paths

- `AutomationStrategy.emergencyExit` is **bot-only** (`onlyAuthorizedBot` +
  `flashLoanProtection`, `AutomationStrategy.sol:293-301`); sequence: close LP
  → repay all Aave debt (optional collateral→debt swap) → withdraw remaining
  collateral → return every token to the user; fee 1%. **No `force` flag.**
- User-facing exit paths that exist: per-strategy **"Exit & Uninstall"** in
  `/strategies` (closes linked positions, sweeps funds to the EOA) and the
  owner-only sweep functions on the proxy.
- The GitBook "user eject button" (`emergencyExit(forceExit)`) does **not**
  exist as documented.

## 7. The strategy surface (what's real)

Bot-only automations (all `onlyAuthorizedBot`): Auto Compound, Auto Harvest,
Auto Rebalance, Auto Repay, Auto Collateralize, Auto Hedge, Auto Stop-Loss,
Auto Take-Profit, Auto Sweep & Deposit, Auto Refinance, Auto Migrate Yearn,
Aerodrome Auto-Stake. User+bot (UniV3-family): UniswapV3 / PancakeSwapV3 /
Aerodrome Slipstream strategies. User-callable: Aave V3 Lending, Morpho
Lending, Compound V3, Curve, Yearn V3, Balancer V2, Aerodrome V2, PCS Staking,
Orchestrated Multicall. (Full list + one-liners in the contracts investigation,
2026-09-18.)

The docs' Automations section covers the 5 classic primitives in depth and
**mentions the rest by name** (AutoHedge, Stop-Loss, Take-Profit, Sweep,
Refinance, Migrate) without inventing details.

## 8. The app vocabulary (docs MUST use these exact words)

From `hedgehogs-frontend`:
- Account: **HedgeHog account(s)** · Deploy CTA **Deploy HedgeHog account**
- Banner: **Net worth** · panels **Liquidity · Lending · Vaults · Strategies ·
  Idle · Activity**
- Explore tabs: **Lend · Borrow · Pools · Vaults**
- Nav: **Explore · Portfolio · Wallet · Strategies · Gallery · Swap · Docs ·
  Settings**
- Row actions: **Supply · Borrow · Repay · Repay with aTokens · Withdraw ·
  Use as collateral · Supply more · Add collateral · Collect fees · Add ·
  Remove · Rebalance · Deposit · Swap · Add liquidity with Zap In · View on
  explorer · View in Strategies · Pause · Resume**
- Account actions: **Account actions · Repay · Supply more · Use as collateral ·
  Change E-Mode**
- Strategies: **No active automations yet · Create automation · New
  automation** (steps Name → Entities → Routing → Protections → [Authorize] →
  Review)
- Alerts: **Near liquidation · HF X · <acct>** · **Out of range · <pair>** ·
  **Rewards claimable · $X** · **Automations paused** · **Data may be delayed**

## 9. Editorial rules that follow from all this

- **No marketing superlatives, no fake promises** (owner, 2026-09-18). Docs
  are for users AND developers.
- Print a figure only if it is in this register or verified at write time.
  Missing = `—`, never a guess (D2).
- Fees are governance-set; the docs present the seeded schedule with that
  caveat, not as a promise.
- Security page says what the audit found and what was fixed, with no
  "audited & safe" claim.