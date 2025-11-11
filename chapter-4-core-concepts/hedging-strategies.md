# Hedging Strategies

## What is Hedging?

**Hedging** is taking an offsetting position to reduce risk in your primary position.

**Simple analogy:**
- You own a house (exposed to real estate prices)
- You buy home insurance (hedge against fire/damage)
- Cost: insurance premium
- Benefit: limited downside risk

**In DeFi:**
- You provide ETH-USDC liquidity (exposed to ETH price)
- You borrow ETH from Aave (short ETH)
- Cost: borrow interest
- Benefit: reduced price exposure

## Why Hedge in DeFi?

**Problem: Everything is too correlated**

```
Market goes up:
- Your ETH LP earns fees ✅
- But you suffer impermanent loss ❌

Market goes down:
- Your ETH LP earns fees ✅
- But you suffer impermanent loss ❌
- Plus: liquidation risk if borrowed ❌

Without hedge:
- You're always exposed to market direction
- Can't earn yield without taking price risk
```

**Solution: Hedging**

```
Create offsetting positions:
- Long exposure (LP, collateral)
- Short exposure (borrowed assets)
- Net exposure: near zero
- Keep earning yield regardless of price
```

## Basic Hedging: Long/Short

### Simple Short Hedge

**Scenario:** You're bullish on ETH, but want to earn yield without price risk.

**Unhedged:**
```
Hold 1 ETH:
- ETH goes to $3,000: +$1,000 profit ✅
- ETH drops to $1,000: -$1,000 loss ❌
- No yield earned ❌
```

**Hedged:**
```
1. Hold 1 ETH (long)
2. Borrow 1 ETH from Aave and sell it (short)

ETH goes to $3,000:
- Your ETH: +$1,000 ✅
- Your debt: -$1,000 ❌
- Net P&L: $0 (hedged)
- Yield: Earn interest on collateral, pay borrow rate

ETH drops to $1,000:
- Your ETH: -$1,000 ❌
- Your debt: +$1,000 ✅
- Net P&L: $0 (hedged)
- Yield: Same as above
```

**Key point:** You're neutral to price but earning net interest.

## LP Hedging: The Hedgehog Way

### Problem: LP + Impermanent Loss

**Unhedged LP:**
```
Deposit: 1 ETH + $2,000 USDC
ETH doubles to $4,000:
- LP position value: $5,656
- HODL value: $6,000
- Impermanent Loss: $344

You earned fees, but lost $344 to IL
```

### Solution: Borrow the LP'd Asset

**Hedgehog Strategy:**
```
1. Supply $10,000 USDC to Aave
   └─ Earn 3% APY

2. Borrow $5,000 worth of ETH (2.5 ETH at $2,000)
   └─ Pay 2% APY
   └─ Health factor: 2.0 (safe)

3. Create LP with borrowed ETH + supplied USDC
   └─ 2.5 ETH + $5,000 USDC
   └─ Earn 40% APY from fees

4. Link positions for automation
   └─ Auto-repay uses LP fees to repay debt
   └─ Auto-rebalance keeps LP in range
```

**Price Change Analysis:**

**ETH doubles to $4,000:**
```
LP Position:
- Initial: 2.5 ETH + $5,000 USDC = $10,000
- After 2x: ~1.77 ETH + $7,071 USDC = $14,142
- IL: -$858 (compared to holding)

But debt also changed:
- Initial debt: 2.5 ETH = $5,000
- Final debt: 2.5 ETH = $10,000 (owe more in USD terms)
- Debt increase: -$5,000

Net position:
- LP value: $14,142
- Minus debt: -$10,000
- Net: $4,142
- Started with: $10,000 USDC
- Loss: $5,858

Wait, this is worse! What happened?
```

**Key insight:** This isn't fully hedged. Let's fix it.

### Properly Hedged LP

**The right ratio:**

```
For delta-neutral:
- LP 50% of collateral in Asset A
- LP 50% of collateral in Asset B
- Borrow 50% of Asset A

Example (proper):
1. Supply $10,000 USDC
2. Borrow $2,500 ETH (1.25 ETH at $2,000)
3. Pair borrowed ETH with $2,500 USDC for LP
4. Keep $7,500 USDC as collateral

Position breakdown:
- Long ETH: 1.25 ETH in LP
- Short ETH: 1.25 ETH debt
- Net ETH exposure: 0
- USDC exposure: Still long, but lower IL
```

**When ETH doubles:**
```
LP Position:
- 1.25 ETH + $2,500 USDC → ~0.88 ETH + $3,536 USDC
- Value: $7,072

Collateral:
- $7,500 USDC remains

Debt:
- 1.25 ETH now worth $5,000

Net:
- Assets: $7,072 (LP) + $7,500 (collateral) = $14,572
- Liabilities: $5,000 (debt)
- Net worth: $9,572
- Started with: $10,000
- Loss: $428 (mostly from IL)

But earned fees:
- 40% APY on $5,000 LP over 3 months = $500
- Net profit: $500 - $428 = $72

Plus interest differential:
- Earned on $10k USDC: 3% * 0.25 = $75
- Paid on $2.5k ETH: 2% * 0.25 = $12.50
- Net interest: $62.50

Total profit: $72 + $62.50 = $134.50 (5.4% quarterly)
```

## Advanced Hedging Strategies

### 1. Leveraged Neutral

**Goal:** Amplify yield without adding price risk

```
1. Supply $10,000 USDC to Aave
2. Borrow $7,000 USDC against it (70% LTV)
3. Supply borrowed $7,000 USDC to Aave again
4. Now earning on $17,000 instead of $10,000
5. Leverage: 1.7x

APY math:
- Earn: 3% * $17,000 = $510/year
- Pay: 2.5% * $7,000 = $175/year
- Net: $335/year on $10k = 3.35% APY

(Better than just holding USDC!)
```

**Hedgehog version:**
```
1. Supply $10,000 USDC
2. Borrow $7,000 USDC
3. Create USDC-USDT LP with borrowed USDC
   └─ Earn 15% APY from LP fees (stable pair)
4. Enable Auto-Compound + Auto-Repay

APY math:
- Earn: 15% * $7,000 = $1,050/year from LP
- Earn: 3% * $10,000 = $300/year from lending
- Pay: 2.5% * $7,000 = $175/year from borrow
- Net: $1,175/year on $10k = 11.75% APY

(Much better than simple leverage!)
```

### 2. Basis Trade

**Goal:** Profit from funding rate arbitrage

```
Market condition:
- Perpetuals trading at 20% funding (annualized)
- Spot trading at $2,000
- Opportunity: "Sell" perp, hold spot

Traditional approach:
1. Buy 1 ETH spot for $2,000
2. Short 1 ETH perp
3. Earn 20% funding APY

Hedgehog approach:
1. Supply $4,000 USDC to Aave
2. Borrow 1 ETH ($2,000)
3. Hold borrowed ETH
4. Short 1 ETH perp on exchange
5. Earn funding rate + Aave interest - borrow cost

Net APY:
- Funding: 20%
- Aave supply: 3% on $4k = $120
- Aave borrow: -2% on $2k = -$40
- Net: $400 + $120 - $40 = $480 on $2k capital = 24% APY
```

### 3. Volatility Harvesting

**Goal:** Profit from rebalancing during volatility

```
Insight: AMMs constantly rebalance, which benefits from mean reversion

Setup:
1. Provide narrow-range LP in volatile pair
2. Enable Auto-Rebalance
3. Profit from:
   a. Fees from volatility (more trades)
   b. Rebalancing bonus (buy low, sell high)

Example:
- Price oscillates $1,900 → $2,100 → $1,900
- Each time crosses range: rebalance
- Each rebalance: collect fees + buy low / sell high
- Result: Profit from chop, even if price ends where it started
```

## Hedging Costs

**Every hedge has a cost:**

| Hedge Type | Cost | Benefit | Net |
|------------|------|---------|-----|
| **Borrow to hedge LP** | Borrow APY | Reduced IL | Positive if fees > IL + borrow cost |
| **Perp short** | Funding rate | Zero price risk | Positive if funding negative or LP fees > funding |
| **Options** | Premium | Defined max loss | Profitable if vol > implied vol |
| **Leveraged neutral** | Higher liquidation risk | Amplified yield | Positive if APY gap > risk premium |

**Key decision:**
```
Is: (Fees + Interest Earned) > (Borrow Cost + IL + Gas) ?
If YES: Hedge is profitable
If NO: Don't hedge, or use different strategy
```

## Hedgehog Automation Advantages

**Manual Hedging Pain Points:**
1. **Gas costs** - Each rebalance costs $15-50
2. **Timing** - Need to monitor 24/7
3. **Complexity** - Multi-step operations
4. **Liquidation risk** - Health factor management

**Hedgehog Solutions:**
1. **Auto-Rebalance** - Bot rebalances LP when out of range
2. **Auto-Repay** - Bot repays debt using LP fees to maintain health factor
3. **Auto-Compound** - Bot reinvests fees for compound growth
4. **Batched operations** - Save gas via multicall
5. **Linked positions** - Track relationships automatically

**Cost comparison:**
```
Manual:
- Rebalance: $30 gas
- Compound: $25 gas
- Repay: $20 gas
- Total: $75 per cycle
- 12 cycles/year: $900

Hedgehog:
- All operations: 0.1-0.3% automation fee
- On $10k position: $10-30 per cycle
- 12 cycles/year: $120-360

Savings: $540-780/year (60-87% reduction)
```

## Practical Example

**Build a Delta-Neutral LP Position:**

```javascript
// 1. Deploy your proxy (one-time)
const proxy = await factory.createProxy();

// 2. Create hedged position
await proxy.multicall([
  // Supply USDC as collateral
  aaveConnector.supply(USDC, 10000e6), // $10,000

  // Borrow ETH to hedge
  aaveConnector.borrow(
    WETH,
    ethers.utils.parseEther("1.25"), // 1.25 ETH at $2,000 = $2,500
    supplyPositionId
  ),

  // Create LP with borrowed ETH + USDC
  uniswapConnector.mintPosition(
    WETH,
    USDC,
    500, // 0.05% fee tier
    {
      amount0: ethers.utils.parseEther("1.25"),
      amount1: 2500e6,
      tickLower: -204240, // $1,900
      tickUpper: -201240, // $2,100
    },
    borrowPositionId // Link to borrow
  )
]);

// 3. Enable automation
await proxy.setStrategyEnabled(lpPositionId, AUTO_REBALANCE, true);
await proxy.setStrategyEnabled(lpPositionId, AUTO_COMPOUND, true);
await proxy.setStrategyEnabled(borrowPositionId, AUTO_REPAY, true);

// 4. Sit back and earn yield
// Bot handles:
// - Rebalancing when price exits range
// - Compounding LP fees
// - Repaying debt if health factor drops
```

## Key Takeaways

✅ Hedging reduces price exposure while keeping yield
✅ LP hedging: Borrow the asset you're LP'ing to offset IL
✅ Proper hedge ratio critical: aim for delta-neutral
✅ Hedging has costs (borrow interest, gas), must be < fees earned
✅ Hedgehog automates the tedious parts (rebalancing, health factor, compounding)

**Next:** Learn how to achieve true delta-neutral positions.

---

[Next: Delta-Neutral Positions →](delta-neutral.md)

[Back to Core Concepts](README.md)
