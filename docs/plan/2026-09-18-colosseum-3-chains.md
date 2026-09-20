# Colosseum Crypto World's Fair — 3 Chains (Arbitrum + HyperEVM + Robinhood Chain)

> One file that explains everything: the hackathon, the strategy, what we already have per chain, the
> full implementation plan (contracts → bot → indexer → prices → frontend → UI/UX → optimisation),
> the roadmap, and the executable tickets.
>
> **Hackathon:** Colosseum Crypto World's Fair, online, **2026-09-14 → 2026-10-12** (winners ~2026-12-05).
> **Goal:** win the **Hyperliquid track** ($100k / 10 products). Also registered: **Base** ($25k/5, already live — free) + **Arbitrum** ($25k/5). **Robinhood Chain** is built as an integration/demo, not a registered track (3-track cap).
> **Team:** 2–3 devs full-time. **Deadline pressure:** ~24 days at capture (2026-09-18).

---

## Table of contents

1. [Context: the hackathon & the strategy](#1-context-the-hackathon--the-strategy)
2. [What we can integrate](#2-what-we-can-integrate)
3. [What already exists per chain](#3-what-already-exists-per-chain)
4. [Key decisions](#4-key-decisions)
5. [User stories](#5-user-stories)
6. [Contracts repo (`hedgehogs-contracts`)](#6-contracts-repo)
7. [Bot repo (`hedgehogs-bot`)](#7-bot-repo)
8. [Indexer repo (`hedgehogs-indexer`)](#8-indexer-repo)
9. [Prices repo (`hedgehogs-prices`)](#9-prices-repo)
10. [Frontend repo (`hedgehogs-frontend`)](#10-frontend-repo)
11. [Frontend UI / UX](#11-frontend-ui--ux)
12. [Optimisation](#12-optimisation)
13. [Roadmap (24 days)](#13-roadmap-24-days)
14. [Tickets](#14-tickets)
15. [Acceptance criteria](#15-acceptance-criteria)
16. [Risks & open questions](#16-risks--open-questions)

---

## 1. Context: the hackathon & the strategy

**Colosseum Crypto World's Fair** is the first cross-ecosystem Colosseum competition. Prize tracks are
per-ecosystem, and every submission is also eligible for the general pool:

| Track | Prize | Fit |
|---|---|---|
| **Hyperliquid** (integrates **Hypercore or HyperEVM**) | $100k / 10 | 🟢 excellent — the target |
| Base | $25k / 5 | 🟢 already live — free |
| Arbitrum | $25k / 5 | 🟢 cheap (all connectors exist) |
| Robinhood Chain | $25k / 5 | 🟡 integration + demo only |
| Ethereum L1 / Solana / Tempo / Zcash | $25–100k | 🟡/🔴 |
| General pool | $30k grand champion + 20×$15k | 🟡 additive to any track |

**Two strategic facts that shape everything:**

1. **The Colosseum accelerator ($250k) backs Solana founders.** We are an EVM product → the real target is
   the **Hyperliquid track** + the general pool, not the accelerator.
2. **Both HyperEVM and Robinhood Chain are 100% EVM-compatible.** HyperEVM (chain 999) is EVM-equivalent
   Solidity on Hyperliquid's L1; Robinhood Chain (chain 4663) is an Arbitrum-Orbit L2. Our connectors are
   Sickle-pattern (stateless) → **this is an add-a-chain playbook, not new-protocol work.** The heavy lifting
   (proxy, JIT approvals, automation bot, indexer, prices, UI) already exists and is chain-agnostic.

**The pitch:** "HedgeHogs = the automation layer that's missing on Hyperliquid" — proxy + bot + JIT approvals
that compose with the CLOB (perps/spot orderbook via precompiles + CoreWriter). Nobody else has that on HyperEVM.

## 2. What we can integrate

### HyperEVM (999) — the flagship
- **HyperLend** (Aave-style money market) → reuse the Aave connector if the interface matches (spike).
- **The CLOB** (perps + spot orderbook) via CoreWriter / precompiles → delta-neutral auto-hedge,
  orderbook-priced rebalance. **This is the differentiator that wins the track.**
- **USDT0** (canonical stable, LayerZero OFT), LSTs (Staked HYPE / Kinetiq / Looped) → auto-compound.
- Oracle precompiles give CLOB prices natively → the prices service can read them without external feeds.

### Robinhood Chain (4663) — the demo bonus
- **Chainlink CCIP / Data Streams / Data Feeds** live day-one → prices + automation triggers.
- **Stock tokens** (RHJ ERC-20s) → automated rebalancing on tokenized equities — unique angle.
- Early DEX/AMM + RFQ routes (spike to confirm what's live).

### Arbitrum (42161) — the cheap win
- All existing connectors already live there: Aave V3, UniV3 (canonical NPM), KyberSwap, Balancer.
- Optional differentiator if time allows: GMX v2 (perps) delta-neutral, Pendle auto-roll.

## 3. What already exists per chain

| | Arbitrum (42161) | HyperEVM (999) | Robinhood Chain (4663) |
|---|---|---|---|
| Chain type | EVM L2 (Arbitrum One) | EVM L1 (Hyperliquid, HyperBFT, dual-block) | EVM L2 (Arbitrum Orbit), ~100ms blocks |
| Gas | ETH | HYPE (EIP-1559) | ETH |
| RPC | `ARBITRUM_RPC_URL` env + foundry alias | `https://rpc.hyperliquid.xyz/evm` | `https://rpc.mainnet.chain.robinhood.com` / `rpc.robinhoodchain.io` |
| Explorer | Arbiscan | hyperevmscan.io / purrsec.com / hyperscan.com | robinhoodchain.blockscout.com |
| Contracts | ✅ `NetworkConfig` branch, Aave provider const, foundry alias, env var | ❌ nothing | ❌ nothing |
| Frontend `chains.ts` | ✅ commented block (Arbitrum already written) | ❌ | ❌ |
| Frontend `ChainIcon` | ✅ logo present | ❌ | ❌ |
| Frontend `token-icon` API | ✅ present | ❌ | ❌ |
| Bot / Indexer / Prices | ❌ (viem `arbitrum` exists) | ❌ | ❌ |
| Protocols available | Aave, UniV3, Kyber, Balancer. No Morpho/Aerodrome/PCS/Yearn | HyperLend, USDT0, LSTs, CLOB. DEX/Kyber = **spike** | Chainlink + stock tokens. Aave/UniV3/Kyber = **likely absent** |

**Bottom line:** Arbitrum is mostly uncommenting + deploy. HyperEVM and Robinhood are greenfield config + a
feasibility spike to source protocol addresses.

## 4. Key decisions

1. **Tracks:** register `Hyperliquid + Base + Arbitrum` (3-track cap). Robinhood Chain built, not registered.
2. **Deploy scope:** `DeployAll.s.sol` requires `aaveV3Pool` + `uniswapV3PositionManager` + `kyberRouter`
   non-null and gates the whole deploy on an Aave sanity check (DeployAll `:309-312`). If a chain lacks these,
   ship a **scoped deploy** (`DEPLOY_SCOPE=core|full`) — core + directory + connectors whose protocols exist +
   Chainlink-seeded `PriceFeedRegistry`.
3. **Mainnet (1)** stays in V0 as a parallel workstream (Hashlock P0.2 reverts) — not on this plan's critical path.
4. **Dev forks:** anvil fork for Arbitrum (31340) for local/e2e parity. HyperEVM + Robinhood: mainnet/testnet direct.

## 5. User stories

- **US-1** — I see Arbitrum / HyperEVM / Robinhood Chain in the chain selector with correct icon, name, chainId, explorer.
- **US-2** — I can deploy my HedgeHog proxy on each new chain.
- **US-3** — My `/portfolio` net worth + chain breakdown aggregate all supported chains.
- **US-4** — I see live USD prices for tokens on the new chains.
- **US-5** — My on-chain activity is indexed on each new chain (Ponder).
- **US-6** — I can supply/borrow, add liquidity and swap on chains where connectors exist.
- **US-7** — I can configure automation (auto-repay/compound/rebalance/TP-SL) where strategies are deployed.
- **US-8** — A chain with no deployed protocols renders a clean empty state — no dead controls.

## 6. Contracts repo

Single deploy script, config-driven. **No connector code changes** (stateless Sickle pattern).

- **`script/Deploy/NetworkConfig.sol`** — add `HYPEREVM = 999`, `ROBINHOOD = 4663` constants (ARBITRUM at `:40`);
  add `getConfig()` branches for 999/4663 (Arbitrum branch exists `:69-84`); add to `isSupported()` (`:145-148`).
  Per-chain addresses sourced in the spike (HyperLend pool + interface, DEX NPM, kyberRouter, WETH-equivalent,
  Chainlink feeds). Arbitrum's are already present.
- **`script/Deploy/DeployAll.s.sol`** — add `AAVE_ADDRESSES_PROVIDER_HYPEREVM`/`_ROBINHOOD` constants + resolver
  branches (`:1580-1600`; Arbitrum const exists `:157`). If HyperLend isn't Aave-V3-interface-compatible, the B2
  sanity check (`:309-312`) fails → add a HyperLend adapter connector (new Sickle contract, ~1-2d + tests) or use
  the scoped deploy. `_seedApprovedRouters` (`:1083-1120`) seeds kyberRouter always + per-chain routers when non-zero.
- **`script/Deploy/SeedPriceFeeds.s.sol`** — add `seed()` branches for 42161/999/4663 (`:175-185`). **Arbitrum is
  missing today and reverts — this blocks Arbitrum first.**
- **`foundry.toml`** `[rpc_endpoints]` — add `hyperevm`/`robinhood` (arbitrum alias exists). `.env.example` — RPC
  URLs + explorer verify keys.

## 7. Bot repo

The bot is **single-chain-per-process** → one instance per chain via env, no multi-chain loop.

- **`src/services/chain.ts`** — `CHAIN_MAP` (`:33-61`): add `42161: arbitrum` (viem built-in) + custom viem `Chain`
  objects for 999/4663 (needs id, name, nativeCurrency, rpcUrls, blockExplorers, multicall3).
- **`src/config.ts`** — per-chain env blocks (addresses from `deployments/{chainId}.json`). New chains stay EIP-1559
  by default (correct). Chain-conditional detectors are hardcoded to 1/8453/56 — new chains get none by default.
- **`src/services/price-oracle.ts:13-66` `KNOWN_TOKENS`** — **mandatory** entry per chain (gas valuation zeroes otherwise).
- **`src/services/kyberswap-client.ts:29-48`** — add arbitrum host; HyperEVM/Robinhood return `null` until confirmed.
- **`src/services/opportunity-detector.ts:124-138` `SWEEP_REWARD_TOKENS`** — per-chain reward tokens.
- **Infra** — one container/instance per chain (pattern: `HEARTBEAT_FILE`, `BOT_DB_PATH`).

## 8. Indexer repo

Prod mode is already single-chain via `PONDER_CHAIN` — **do not** add new chains to the fork default tuple.

- **`src/utils/chains.ts`** — `CHAIN_IDS` (`:7-20`), `getChainContracts()` cases (`:139-353`), `EXTERNAL_PROTOCOL_ADDRESSES`
  (`:386-495`), factory maps (`:696-725`). **Watch the `default:` branch (`:350-351`) that silently falls back to
  LOCALHOST_CONTRACTS** — add explicit cases so unknown chains error.
- **`ponder.config.ts`** — `PONDER_RPC_URL_<id>`, `EXTERNAL_START_BLOCK_<id>`; run via `PONDER_CHAIN=<id>`.
- **Tests** — `test/config/multichain-config.test.ts:31-44, 184-195` hardcode the 3-fork set → extend.

## 9. Prices repo

- **`src/types.ts`** — `ChainId` union (`:9`) + `resolveChainId` (`:17-22`, extend if 31340 fork added).
- **`src/registry/chains.ts`** — `CHAIN_CONFIGS` (`:52-56`) + `getSupportedChainIds()` (`:68-70`): viem chain
  (arbitrum built-in; custom 999/4663), `blockTimeMs` (HyperEVM ~1s; Robinhood ~100ms), `defillamaSlug`.
- **`src/registry/tokens.ts`** — `chains[<id>]` per token (`address`, `chainlinkFeed?`, `uniV3Pool?`,
  `coingeckoId`, `defillamaId`). **DeFiLlama + CoinGecko cover most prices** → minimal Chainlink sourcing.
- **`src/config.ts:12-14` + `src/index.ts:62-87`** — RPC envs + viem clients. **`src/api/rest.ts:69-74`** —
  supportedChainIds Set. **`src/oracles/balancer-dynamic.ts:43`** — add 42161 to `BALANCER_VAULT_CHAINS`.

## 10. Frontend repo

Seven file groups, all driven by the canonical hub `utils/chains.ts`:

1. **`utils/chains.ts`** — uncomment the Arbitrum block (enum `:21-25`, `ChainToChainId` `:47-51`,
   `chainConfigs` `:456-523`, `AaveV3Arbitrum` import `:6-10`, `chains` array `:542-546`, `getBaseCurrencySymbol`).
   Add `HyperEVM` + `Robinhood` enum members, chainIds 999/4663, full `chainConfig` rows (Aave addresses as sourced,
   dex/dexV3, explorer, icon, rpcUrl, displayName). Extend fork maps only if 31340 added.
2. **`config/wagmi.ts`** — `productionChainsTuple` (`:91-98`) + transports (`:145-156`): `arbitrum` + **custom
   `WagmiChain` objects for 999/4663** (not in `wagmi/chains`). `erpcURL(chainId)` reuse.
3. **`config/deployed-addresses.ts`** (auto-generated) — const blocks for `ARBITRUM_42161`/`HYPEREVM_999`/
   `ROBINHOOD_4663` starting all-null (mirror `MAINNET_1` `:391-440`) + `DEPLOYED_ADDRESSES` map (`:456-465`).
4. **`scripts/sync-deployed-addresses.ts`** — `CHAIN_CONFIGS` rows (`:93-129`) for `42161.json`/`999.json`/`4663.json`.
5. **`config/contracts.ts`** — per-chain maps (~55 fields), `CHAIN_ADDRESSES` (`:411-418`), `PRODUCTION_CHAINS`
   (`:476`), `PROTOCOL_FALLBACK_CHAINS` (`:489-500`).
6. **Chain-scoped lists** — `components/proxy/proxyDisplay.ts:15-17` `SUPPORTED_PROXY_CHAINS`;
   `hooks/useWalletAssets.ts:74-79` `getSupportedWalletChains()` + `MAJOR_TOKENS_BY_BACKEND_ID`;
   `hooks/useLivePrices.ts:183-185` `PRICE_SERVICE_CHAINS` + `ADDRESS_TO_SYMBOL_BY_CHAIN` + `FORK_TO_CANONICAL_CHAIN_ID`;
   `lib/indexer-config.ts:40-41` `PROD_CHAIN_IDS`; `components/ChainIcon.tsx:16-77` logos (arbitrum present);
   `pages/api/token-icon.ts:19-42`.
7. **Fan-out** — `usePortfolioMetrics.ts:3309-3317` destructures exactly 3 chains → generalise to N (filter by proxy).

**Tests to update (pins "exactly three"):** `test/hooks/usePortfolioMetricsIndexerFlicker.test.ts:1050-1060`,
`test/fixtures/demoPortfolio.test.ts:359-363`, `e2e/fixtures/fork.ts`/`web3.ts`/`positions.ts` (if 31340 added).

## 11. Frontend UI / UX

Match, don't invent — the new chains flow through existing primitives.

| Surface | Behaviour |
|---|---|
| `ChainSelector` / `SquaredChainPicker` | New chains appear in "Production" automatically via `resolveAvailableChains` — only when the user has a proxy there |
| `/portfolio` | Net worth + chain breakdown aggregating all chains; `resolveActiveChain` fallback stays mainnet |
| `/explore` `/lend` `/borrow` `/pools` `/strategies` | Chain filters iterate `Object.values(Chain)`; absent protocols masked by `chainsForProtocol` — inert-safe |
| `/swap` | `SwapCard.tsx:43-52` gas-padding map + `SwapLive` chain pill row |
| Settings → proxy deploy | `SUPPORTED_PROXY_CHAINS` → "Deploy" CTA on all chains |
| Status page | `pages/status.tsx:86-93` `CHAIN_LABELS` |
| Empty / unsupported chain | `isHedgehogDeployed` gates surfaces; empty states from `components/dashboard/empty-states/` |

## 12. Optimisation

- **Frontend fan-out:** never query all chains by default — filter by proxy presence (`resolveAvailableChains`),
  keep `Promise.all` bounded, prefer one batched `usePortfolioMetrics` loop.
- **Bundle:** custom `WagmiChain` objects are a few lines each; no Hyperliquid/Robinhood SDKs client-side. CLOB
  features stay server-side (API routes / bot).
- **Indexer:** prod chains single-chain (`PONDER_CHAIN`), never in the fork tuple — protects fork-cache perf.
- **Prices:** DeFiLlama + CoinGecko first; Chainlink only for critical tokens.
- **Bot:** instance-per-chain = infra scaling.
- **RPC:** route new chains through `rpc.hedgehogs.app` eRPC (`erpcURL`) or direct public RPC.

## 13. Roadmap (24 days)

- **W1 (18→25/09):** register tracks; **spike** HyperEVM + Robinhood feasibility (T1, T2); **Arbitrum** config
  (contracts/bot/indexer/prices/frontend) + mainnet Hashlock reverts in parallel; portfolio + user-actions wiring.
- **W2 (25/09→02/10):** **Arbitrum live** (deploy → sync-addresses → smoke automation); **HyperEVM** config +
  deploy (testnet→mainnet); docs minimal site.
- **W3 (02→09/10):** **CLOB differentiator** (auto-hedge via CoreWriter); demo video + deck + pitch.
- **W4 (09→12/10):** **Robinhood Chain** (timeboxed, same playbook, scoped deploy); **Arbitrum** if not done;
  submission package before **2026-10-12 23:59 PT**.
- **Gates:** working demo every Friday.

## 14. Tickets

All ticket file refs are in the sections above. Effort: S ≤4h · M 1-3d · L 1-2w. Risk: ✅ cosmetic · ⚠️ logic · 🚨 contracts.

### Spike (blocking — W1, days 1-2)

- **T1 — HyperEVM protocol inventory (S, blocks T11-T17).** Verify: HyperLend interface (Aave V3 Pool/AddressesProvider
  compatible?), DEX + kyberRouter present, WETH-equivalent, CLOB oracle precompiles, block time/gas HYPE, RPC + testnet.
  Deliverable: scoped-vs-full deploy decision table.
- **T2 — Robinhood Chain protocol inventory (S, blocks T18-T20).** DEX/AMM + RFQ routes live, Chainlink Data
  Streams/Feeds addresses, stock tokens RHJ, block time, testnet 46630, RPC rate limits. Same deliverable.

### Arbitrum (42161) — priority path

- **T3 — Contracts: `SeedPriceFeeds` branch 42161 (S).** `SeedPriceFeeds.s.sol:175-185` reverts today → blocks all
  Arbitrum deploys. Add branch + Chainlink feeds. Acceptance: seed runs on Arbitrum fork.
- **T4 — Contracts: deploy Arbitrum testnet→mainnet (M, deps T3).** `forge script DeployAll --rpc-url $ARBITRUM_RPC_URL
  --broadcast --via-ir --slow` + SeedPriceFeeds + artifact `deployments/42161.json`. Acceptance: `isHedgehogDeployed(42161)`.
- **T5 — Frontend config: uncomment Arbitrum (M, deps T4).** `chains.ts`, `wagmi.ts` (+`erpcURL(42161)`),
  `deployed-addresses.ts` + sync script, `contracts.ts`, chain-scoped lists, `useLivePrices`/`indexer-config`/`useWalletAssets`.
- **T6 — Frontend: generalise portfolio fan-out (M, deps T5).** `usePortfolioMetrics.ts:3309-3317` 3→N chains filtered by
  proxy; update pins (`usePortfolioMetricsIndexerFlicker`, `demoPortfolio`). Acceptance: tsc/eslint/vitest green.
- **T7 — Bot: Arbitrum config (M).** `chain.ts` (viem `arbitrum`), env block, `KNOWN_TOKENS`, kyberswap host, sweep
  tokens, compose instance. Acceptance: 1 automation cycle (auto-repay on HF).
- **T8 — Indexer: Arbitrum config (M).** `CHAIN_IDS`, `getChainContracts` case, external addresses, factory maps,
  `PONDER_CHAIN=42161`; update `multichain-config.test.ts`.
- **T9 — Prices: Arbitrum config (S/M).** `ChainId` union, `ChainConfig`, token entries (WETH/ETH/USDC), RPC clients,
  `rest.ts`, `balancer-dynamic.ts:43`. Acceptance: USD prices for WETH/ETH/USDC.
- **T10 — UI: Arbitrum surface (M, deps T6).** Chain selector, portfolio breakdown, swap gas padding, status labels,
  `SUPPORTED_PROXY_CHAINS`.

### HyperEVM (999)

- **T11 — Contracts: config 999 (M, deps T1).** `NetworkConfig` branch, Aave/HyperLend provider const + resolver,
  `DEPLOY_SCOPE=core|full` flag, `SeedPriceFeeds` branch.
- **T12 — Contracts: deploy HyperEVM testnet→mainnet (M, deps T11).**
- **T13 — Frontend: config 999 (M).** `chains.ts` (chainConfig + explorer hyperevmscan), custom `WagmiChain`,
  deployed-addresses + sync, contracts.ts, `ChainIcon` logo, `token-icon` API.
- **T14 — Bot: config 999 (M).** custom viem chain, `KNOWN_TOKENS`, kyberswap → null.
- **T15 — Indexer: config 999 (M).** `CHAIN_IDS` + cases + RPC + start block; `PONDER_CHAIN=999`.
- **T16 — Prices: config 999 (S/M).** union + ChainConfig (defillamaSlug, ~1s blockTime) + tokens (HYPE/USDC/USDT0) + clients.
- **T17 — Differentiator: CLOB auto-hedge (L, deps T1/T12).** Contract + bot placing the CLOB hedge via CoreWriter
  (limit order, Action ID 1) above a delta threshold; fallback = read-only precompile price. Separate from chain plumbing.

### Robinhood Chain (4663) — W4, timeboxed

- **T18 — Contracts: config 4663 (M, deps T2).** `NetworkConfig` + `SeedPriceFeeds` + scoped deploy (likely `core`).
- **T19 — Contracts: deploy Robinhood testnet→mainnet (M).**
- **T20 — Full stack 4663 (M).** Frontend (custom `WagmiChain`, Blockscout explorer, logos), bot (custom viem), indexer,
  prices (Chainlink day-one). Acceptance: smoke on an ETH or stock-token flow.

### Cross-cutting

- **T21 — Docs + marketing "supported chains" (S).** `content/protocols/supported-chains.mdx` + marketing page.
- **T22 — Demo/e2e (M).** anvil fork 31340 (Arbitrum) in `config/wagmi.ts`, `/api/fork-rpc/local_arbitrum`,
  `e2e/fixtures/*`; HyperEVM/Robinhood via self-skip (`isIndexerUp` pattern).

### Ticket order

```
W1: T1, T2 (spike) ─┐
     T3, T5, T7, T8, T9 (Arbitrum) ──▶ T4 deploy ▶ T6 fan-out ▶ T10 UI
W2: T11 ▶ T12 ▶ T13/T14/T15/T16 (HyperEVM)
W3: T17 (CLOB)
W4: T18 ▶ T19 ▶ T20, T21, T22
```

## 15. Acceptance criteria

1. Per chain: `isHedgehogDeployed(chain)` true on mainnet; deployments synced via `npm run sync-addresses`.
2. Per chain: bot runs an automation cycle (e.g. auto-repay on HF) against the indexer → position visible in frontend.
3. Per chain: prices service returns USD for native + USDC/ETH; `/api/v1/user/:address/portfolio?chainId=<id>` returns data.
4. Frontend: chain selector shows the new chains in Production; `/portfolio` aggregates all; lend/borrow/pools/swap/
   strategies render correct protocol availability; no dead controls.
5. Tests: `tsc --noEmit`, `eslint . --quiet`, `npm test` green (updated pins); contracts `forge fmt --check`,
   `forge build`, `forge test`.
6. Regression: existing Base + BSC + LocalMainnet surfaces unchanged; demo/e2e green.
7. Demo gate: a working demo at the end of each sprint week.

## 16. Risks & open questions

1. **HyperLend ≠ Aave V3 interface** → Aave strategies can't deploy on HyperEVM without an adapter connector (new
   contract + audit). Mitigation: scoped deploy; the CLOB differentiator carries the track regardless.
2. **No canonical UniV3/Kyber on HyperEVM/Robinhood** → LP + swap surfaces inert until a DEX is sourced. KyberSwap
   router is load-bearing in `DeployAll` + every auto-strategy — verify in the spike.
3. **Indexer `default:` silent fallback** (`getChainContracts`) → explicit cases required or unknown chains inherit
   localhost addresses.
4. **"Exactly three" test pins** → update in the same PR as the fan-out change.
5. **Robinhood ~100ms blocks / sequencer** → bot + indexer cadence should tolerate sub-second block times
   (check `waitForTransactionReceipt` timeouts).
6. **Gas valuation zeroes** if `KNOWN_TOKENS` missed → add in the same commit as chain config.
7. **Track cap (3)** → Hyperliquid + Base + Arbitrum registered; Robinhood Chain is integration-only.