# Delta-Neutral Positions

## The Holy Grail of DeFi Yield

**Delta-neutral** means your position has **zero exposure to price changes** in the underlying asset while still earning yield.

**The Dream:**
- ETH goes up 100%? Your position stays flat.
- ETH crashes 50%? Your position stays flat.
- Market sideways? You're earning yield the whole time.

## What is Delta?

**Delta** measures how much your position value changes for a $1 change in asset price.

```
Delta = Change in position value / Change in asset price

Examples:
- Hold 1 ETH: Delta = +1 (gain $1 for every $1 ETH rises)
- Short 1 ETH: Delta = -1 (lose $1 for every $1 ETH rises)
- Hold 0.5 ETH + short 0.5 ETH: Delta = 0 (delta-neutral!)
```

**Delta-neutral = Delta of 0**

## Building Delta-Neutral Positions

### Example 1: Simple Long/Short

**Goal:** Earn yield without ETH price exposure

```
1. Supply $10,000 USDC to Aave
   └─ Earn 3% APY
   └─ Delta: 0 (stablecoin)

2. Borrow $5,000 worth of ETH (2.5 ETH at $2,000)
   └─ Pay 2% APY
   └─ Delta: -2.5 (short 2.5 ETH via debt)

3. Provide liquidity: 2.5 ETH + $5,000 USDC
   └─ Earn 40% APY
   └─ Delta: ~+1.25 (roughly 50% exposure to each asset)

Total Delta: -2.5 + 1.25 = -1.25 (not neutral yet!)

4. To neutralize: Add 1.25 ETH to position OR reduce borrow
```

**Adjusting to neutral:**
```
Option A: Borrow less ETH
- Borrow only 1.25 ETH instead
- LP: 1.25 ETH + $2,500 USDC
- Delta from LP: +0.625
- Delta from borrow: -1.25
- Total delta: -0.625 (closer, but not perfect)

Option B: Perfect hedge
- LP delta is NOT exactly 0.5 due to IL mechanics
- Need to calculate effective delta considering price impact
- Generally: borrow less than 50% of LP value for neutral
```

## LP Delta Calculation

**Why LP delta isn't simply 0.5:**

AMMs rebalance automatically as price changes, which affects delta:

```
At price P, LP position:
- x tokens of Asset A
- y tokens of Asset B
- Value = x * P + y

Delta = d(Value)/dP = x + y * d(y)/dP

For constant product: x * y = k
Therefore: y = k/x = k/(L * sqrt(P))

d(y)/dP = -k/(2 * L * P^(3/2))

Effective delta = x - |d(y)/dP * y|
```

**Simplified:** LP delta for ETH-USDC position is roughly equal to:
```
Delta ≈ (% of position in ETH) - (0.5 * IL_factor)
```

**Practical approach:**
- For 50/50 LP: effective delta ≈ 0.4-0.5 depending on price and range
- To neutralize: borrow slightly less than 50% of LP value
- Monitor and rebalance as needed

## Hedgehog's Delta-Neutral Strategy

### The Standard Setup

```solidity
// 1. Supply collateral
await proxy.multicall([
  aaveConnector.supply(USDC, 10000e6) // $10,000 USDC
]);

// 2. Borrow hedge asset (less than 50% of intended LP)
await proxy.multicall([
  aaveConnector.borrow(
    WETH,
    ethers.utils.parseEther("1.25"), // $2,500 worth
    supplyPositionId
  )
]);

// 3. Create LP position
await proxy.multicall([
  uniswapConnector.mintPosition(
    WETH,
    USDC,
    500, // 0.05% fee tier
    {
      amount0: ethers.utils.parseEther("1.25"),
      amount1: 2500e6, // $2,500
      tickLower: -204240,
      tickUpper: -201240
    },
    borrowPositionId
  )
]);
```

**Position Analysis:**
```
Assets:
- $10,000 USDC collateral in Aave
- $5,000 LP position (1.25 ETH + $2,500 USDC)
Total: $15,000

Liabilities:
- $2,500 ETH debt

Net worth: $12,500

Delta:
- Long via LP: ~+0.625 ETH exposure
- Short via borrow: -1.25 ETH exposure
- Net: ~-0.625 ETH exposure (slightly short)

To perfect: reduce borrow to ~1.0 ETH or increase LP size
```

### Monitoring Delta Drift

**Problem:** Delta changes as price moves due to:
1. **IL rebalancing** - LP automatically rebalances
2. **Debt value changes** - Borrowed amount stays constant in token terms
3. **Range boundaries** - V3 LP delta changes at range edges

**Example:**
```
Initial (ETH = $2,000):
- LP: 1.25 ETH + $2,500 USDC (delta ≈ +0.625)
- Borrow: 1.25 ETH (delta = -1.25)
- Net delta: -0.625

After 20% rise (ETH = $2,400):
- LP rebalances: ~1.1 ETH + $2,640 USDC (delta ≈ +0.55)
- Borrow: still 1.25 ETH (delta = -1.25)
- Net delta: -0.70 (became more short)

After 20% drop (ETH = $1,600):
- LP rebalances: ~1.4 ETH + $2,240 USDC (delta ≈ +0.70)
- Borrow: still 1.25 ETH (delta = -1.25)
- Net delta: -0.55 (became less short)
```

**Implication:** True delta-neutral requires periodic rebalancing.

## Advanced Delta-Neutral Strategies

### 1. Leveraged Neutral

**Goal:** Amplify yield while maintaining neutral delta

```
Setup:
1. Supply $10,000 USDC
2. Borrow $7,000 USDC (leverage)
3. Borrow $3,500 ETH (hedge)
4. Create $7,000 LP (3.5 ETH + $3,500 USDC)

Position:
- Total capital: $10,000
- LP exposure: $7,000 (leveraged 1.7x)
- Delta from LP: +1.75 ETH
- Delta from ETH debt: -1.75 ETH
- Net delta: 0

Yield:
- Earn: 40% APY on $7,000 LP = $2,800/year
- Earn: 3% APY on $10,000 USDC = $300/year
- Pay: 2.5% APY on $7,000 USDC = $175/year
- Pay: 2% APY on $3,500 ETH = $70/year
- Net: $2,855/year on $10k = 28.55% APY
```

**Risk:** Higher liquidation risk due to leverage.

### 2. Multi-Asset Neutral

**Goal:** Diversify across multiple pairs while staying neutral

```
Setup:
1. Supply $20,000 USDC
2. Borrow $5,000 ETH
3. Borrow $5,000 BTC
4. Create LP: $10,000 ETH-USDC
5. Create LP: $10,000 BTC-USDC

Position:
- Delta ETH: +2.5 (LP) - 2.5 (borrow) = 0
- Delta BTC: +0.1 (LP) - 0.1 (borrow) = 0
- Net delta: 0 for both assets

Benefits:
- Diversified fee sources
- Uncorrelated IL (ETH and BTC don't always move together)
- More stable overall yield
```

### 3. Funding Rate Arbitrage

**Goal:** Earn from perp funding + LP fees while delta-neutral

```
Setup:
1. Supply $10,000 USDC to Aave
2. Borrow $5,000 ETH
3. Hold borrowed ETH (long exposure)
4. Short $5,000 ETH perp on CEX (short exposure)
5. Optionally: LP with collateral for additional yield

Net delta: 0 (long spot + short perp)

Yield:
- Earn: Funding rate on short perp (if positive, ~10-30% APY)
- Earn: Aave supply interest (3% APY)
- Pay: Aave borrow interest (2% APY)
- Pay: Perp fees (minimal)
- Net: 11-31% APY risk-free (if funding positive)
```

**Note:** Requires capital on CEX, adds counterparty risk.

## Maintaining Delta-Neutral

### Manual Rebalancing

**When to rebalance:**
- Price moves >10% from initial
- Net delta exceeds ±0.1 ETH
- Health factor approaches danger zone

**How to rebalance:**
```javascript
// Check current delta (off-chain calculation)
const currentDelta = calculatePositionDelta(proxy);

if (Math.abs(currentDelta) > 0.1) {
  if (currentDelta > 0) {
    // Too long - borrow more ETH or reduce LP
    await proxy.multicall([
      aaveConnector.borrow(WETH, additionalAmount, positionId)
    ]);
  } else {
    // Too short - repay ETH or increase LP
    await proxy.multicall([
      aaveConnector.repay(borrowPositionId, repayAmount)
    ]);
  }
}
```

### Automated Rebalancing (Coming Soon)

Hedgehog is working on **Auto-Delta-Neutral** strategy:

```
Strategy logic:
1. Monitor position delta every block
2. When |delta| > threshold (e.g., 0.15 ETH):
   - Calculate optimal rebalance
   - Execute via multicall:
     a. Collect LP fees
     b. Adjust borrow/repay to neutralize
     c. Optionally rebalance LP itself
3. Charge 0.2% automation fee

User benefit:
- Set and forget delta-neutral
- No monitoring needed
- Lower cost than manual rebalancing
```

## Measuring Performance

### Sharpe Ratio

**Sharpe Ratio** measures risk-adjusted returns:

```
Sharpe Ratio = (Return - Risk-Free Rate) / Volatility

Delta-neutral position:
- Return: 25% APY
- Risk-free rate: 4% (T-bills)
- Volatility: ~5% (low because neutral)
- Sharpe: (25% - 4%) / 5% = 4.2 (excellent!)

Compare to holding ETH:
- Return: 20% APY (assumed)
- Risk-free rate: 4%
- Volatility: 80%
- Sharpe: (20% - 4%) / 80% = 0.2 (poor)
```

**Key insight:** Delta-neutral can have better risk-adjusted returns than directional positions.

### Tracking Drift

**Monitor these metrics:**

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| **Net Delta** | ±0.1 ETH | Rebalance borrow/LP |
| **Health Factor** | >1.5 | Add collateral or repay |
| **APY Drift** | <5% vs expected | Check fee rates, adjust strategy |
| **LP Range** | In range >80% | Widen range or enable auto-rebalance |

## Real-World Example

**Case Study: $10k Delta-Neutral Position**

```
Setup (Day 1, ETH = $2,000):
1. Supply $10,000 USDC to Aave
2. Borrow 1.0 ETH ($2,000)
3. Create LP: 1.0 ETH + $2,000 USDC (narrow range)
4. Enable Auto-Rebalance + Auto-Compound

Initial delta: ~0.0 ETH (neutral)

Month 1 (ETH volatility: $1,800 - $2,300):
- LP rebalanced 4 times (bot)
- Fees earned: $150 (45% annualized)
- Interest earned: $25 (3% on $10k)
- Borrow cost: -$4 (2% on $2k)
- Automation fees: -$6 (0.1% per rebalance)
- Net: $165 (19.8% annualized)
- Delta drift: max 0.08 ETH
- Health factor: 3.2 (safe throughout)

Month 2 (ETH crashes to $1,500):
- LP exited range, rebalanced to lower
- Fees earned: $120 (36% annualized)
- IL absorbed by hedge: minimal impact
- Net: $141 (16.9% annualized)
- Position still delta-neutral

Month 3 (ETH recovers to $2,000):
- LP rebalanced to original range
- Fees earned: $140 (42% annualized)
- Net: $161 (19.3% annualized)

Quarterly result:
- Total earned: $467
- On $10k capital: 18.7% quarterly (74.8% APY)
- Max drawdown: <1% (due to neutral delta)
- Sharpe ratio: 5.1 (excellent)

Compare to holding ETH:
- ETH: $2,000 → $1,500 → $2,000
- Net gain: $0
- Stress: High
- Time spent monitoring: 20+ hours

Delta-neutral wins: Consistent yield, low stress, automated.
```

## Risks and Limitations

**Not completely risk-free:**

1. **Smart contract risk** - Protocol hacks
2. **Liquidation risk** - If overleveraged
3. **Delta drift** - Can't stay perfectly neutral
4. **Automation costs** - Fees reduce net APY
5. **IL not fully hedged** - Some exposure remains
6. **Opportunity cost** - Miss out on bull runs

**When delta-neutral makes sense:**
- Volatile/choppy markets (high fees, low trend)
- You want yield without directional risk
- You're unsure of market direction
- You want consistent, predictable returns

**When to go directional:**
- Strong bull market (HODL beats neutral)
- Low volatility (fees don't compensate for costs)
- You have strong conviction on direction

## Key Takeaways

✅ Delta-neutral = zero price exposure while earning yield
✅ Build via hedging: LP one way, borrow the other
✅ LP delta ≈ 0.4-0.5 (not exactly 0.5 due to IL)
✅ Delta drifts as price moves - need to rebalance
✅ Best in volatile, sideways markets
✅ Hedgehog automates the complex parts

**Rule of Thumb:**
If `LP Fee APY > (Borrow APY + 2%)`, delta-neutral is profitable.

---

[Back to Core Concepts](README.md)
