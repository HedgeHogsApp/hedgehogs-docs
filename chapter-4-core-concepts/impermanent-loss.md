# Impermanent Loss

## The Hidden Cost of Being an LP

**Impermanent Loss (IL)** is the opportunity cost of providing liquidity compared to simply holding the tokens.

**Simple definition:**
When you provide liquidity, you end up with less value than if you had just held the tokens, **when the price changes significantly**.

## The Rebalancing Trap

### How It Happens

AMMs automatically rebalance your position as price changes:

**Example:**
```
Initial deposit:
- 1 ETH at $2,000
- 2,000 USDC
- Total value: $4,000

Price doubles to $4,000 per ETH:
- AMM sells your ETH as price rises to maintain 50/50 balance
- You end up with ~0.707 ETH + ~2,828 USDC
- Total value: $5,656

If you had just held:
- 1 ETH at $4,000 = $4,000
- 2,000 USDC = $2,000
- Total value: $6,000

Impermanent Loss: $6,000 - $5,656 = $344 (5.7% loss)
```

**Key insight:** The AMM "sold" your ETH as it appreciated. You missed out on gains.

## IL at Different Price Changes

### IL Table

| Price Change | Impermanent Loss | Break-Even Fee APY* |
|--------------|------------------|---------------------|
| **1.25x** | 0.6% | 2.4% annually |
| **1.5x** | 2.0% | 8% annually |
| **2x** | 5.7% | 22.8% annually |
| **3x** | 13.4% | 53.6% annually |
| **4x** | 20.0% | 80% annually |
| **5x** | 25.5% | 102% annually |

*Approximate fee APY needed to overcome IL over 3 months

### IL Formula

```
IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1

Where price_ratio = final_price / initial_price
```

**Example:**
```javascript
// ETH doubles from $2,000 to $4,000
const priceRatio = 4000 / 2000; // 2
const IL = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1;
// IL = (2 * 1.414) / 3 - 1 = -0.057 = -5.7%
```

## Why It's "Impermanent"

**It's only a loss if you withdraw:**

```
Day 1: Deposit 1 ETH + 2000 USDC at ETH = $2,000
Day 30: ETH rises to $4,000 (5.7% IL)
Day 60: ETH falls back to $2,000 (0% IL - loss disappeared!)

IL is "impermanent" because it can reverse if price returns to initial level
```

**But becomes permanent if:**
- You withdraw at a different price than you entered
- You need to exit for external reasons
- Price never returns (it usually doesn't)

## V2 vs V3 Impermanent Loss

### Uniswap V2 (Full Range)

- IL happens gradually across entire price range
- More predictable
- Less severe in most cases

### Uniswap V3 (Concentrated Liquidity)

- **IL magnified within your range**
- Narrower range = higher IL
- Can lose 50%+ in extreme cases

**Example:**
```
V2 Position (full range):
- Price 2x: 5.7% IL

V3 Position (narrow 10% range):
- Price exits range: position becomes 100% one token
- Effective IL: 10-50% depending on how far price moved
```

**Trade-off:**
- V3 narrow range: Higher fees, higher IL risk
- V3 wide range: Lower fees, lower IL risk
- V2: Medium fees, medium IL risk

## Mitigating Impermanent Loss

### Strategy 1: Stable Pairs

**Minimize IL by pairing stable assets:**

```
USDC-USDT pool:
- Price rarely changes more than 0.1%
- IL negligible
- Lower fees (0.05% tier), but IL-free

DAI-USDC pool:
- Slightly more volatile
- Still <1% IL in most cases
```

### Strategy 2: Correlated Assets

**Pair assets that move together:**

```
ETH-WBTC pool:
- Both crypto, similar macro trends
- Less IL than ETH-USDC
- Still earn 0.3% fees

stETH-ETH pool:
- Almost perfect correlation
- Minimal IL
- Lower fee tier, but safer
```

### Strategy 3: Delta-Neutral Hedging

**Hedgehog's approach:**

```
1. Provide ETH-USDC liquidity
   └─ Exposed to IL if ETH price changes

2. Hedge by borrowing ETH from Aave
   └─ If ETH rises: LP loses value, but debt decreases in real terms
   └─ If ETH falls: LP gains, but debt burden increases
   └─ Net effect: Reduced directional exposure

3. Earn fees + interest while hedged
```

**Example:**
```
Position:
- Supply $10,000 USDC to Aave (earn 3% APY)
- Borrow $5,000 ETH (pay 2% APY)
- Create $10,000 ETH-USDC LP (earn 40% APY from fees)

ETH doubles:
- LP IL: -$285 (5.7% of $5,000 ETH exposure)
- Debt decrease: +$250 (debt now worth less in USD terms)
- Net IL: -$35
- Fees earned: $400 (40% APY on $10k over 3 months)
- Net profit: $365 - $35 = $330 (13.2% quarterly)
```

### Strategy 4: High Fee Generation

**Earn enough fees to overcome IL:**

```
Volatile pool with 1% fee tier:
- High IL risk (could be 10-20%)
- But if volume is high enough:
  - $1M daily volume
  - 1% fees = $10,000 daily
  - If you own 1%: $100/day = $36,500/year
  - Even 20% IL acceptable if earning $36k on $100k position (36% APY)
```

### Strategy 5: Auto-Rebalance (V3)

**Hedgehog's Auto-Rebalance minimizes range risk:**

```
Without auto-rebalance:
1. Price exits range
2. Position stops earning
3. Accumulates IL as price moves further
4. You manually rebalance (or don't)

With auto-rebalance:
1. Price exits range
2. Bot detects within blocks
3. Bot rebalances position automatically
4. You resume earning fees immediately
5. IL contained to smaller moves
```

## Calculating Your Break-Even

**Formula:**
```
Fee APY needed > (IL% * days_per_year / holding_period_days)

Example: 5.7% IL over 90 days
Required fee APY: 5.7% * 365 / 90 = 23.1% APY
```

**Use this to evaluate LP opportunities:**

| Pool | Expected Fee APY | Likely Price Change | Expected IL | Worth It? |
|------|-----------------|---------------------|-------------|-----------|
| **ETH-USDC** | 40% | 50% over year | 2% | ✅ Yes (40% > 2%) |
| **DOGE-USDC** | 60% | 3x over year | 13.4% | ✅ Maybe (60% > 13.4%) |
| **WBTC-ETH** | 25% | Low correlation | 1% | ✅ Yes (25% > 1%) |
| **SHIB-USDC** | 80% | 5x over year | 25.5% | ❌ Risky (80% > 25.5%, but close) |

## When IL Doesn't Matter

**Scenarios where you can ignore IL:**

1. **You're bullish on both tokens**
   - Want exposure to both anyway
   - IL just means your rebalancing automatically

2. **Short holding periods**
   - Earn 2% fees in 1 week
   - Price unlikely to move drastically
   - IL won't accumulate

3. **Stable/correlated pairs**
   - IL mathematically impossible (stable pairs)
   - IL minimal (correlated assets)

4. **You're providing liquidity for your own trading**
   - Earn back fees you'd pay on swaps
   - IL offset by not paying others' fees

## Real-World Example

**Case Study: ETH-USDC LP on Uniswap V3**

```
Initial Position (Jan 1):
- Deposit: 1 ETH + $2,000 USDC
- Range: $1,800 - $2,200 (narrow)
- Fee tier: 0.3%
- Expected fee APY: 50%

Scenario A: Price stable
- March 31: ETH still $2,000
- Fees earned: $250 (12.5% quarterly)
- IL: 0%
- Net profit: $250

Scenario B: Price up 50%
- March 31: ETH at $3,000
- Fees earned: $250
- IL: -$40 (2% of position)
- Net profit: $250 - $40 = $210 (10.5% quarterly)
- BUT: If you held, you'd have $500 extra from ETH rise

Scenario C: Price exits range
- Feb 15: ETH hits $2,250 (exited range)
- Fees earned: $100 (45 days worth)
- Position stops earning
- Without rebalance: 45 days of lost fees
- With Hedgehog auto-rebalance: $0.50 cost, resume earning
```

## Hedgehog's IL Mitigation

**How Hedgehog helps:**

1. **Auto-Compound**: Maximize fee generation to offset IL
2. **Auto-Rebalance**: Minimize dead time outside range (V3)
3. **Delta-neutral strategies**: Hedge directional exposure
4. **Smart range selection**: Optimize risk/reward (coming soon)

**Example:**
```javascript
// Delta-neutral LP position
await proxy.multicall([
  // 1. Supply USDC
  aaveConnector.supply(USDC, 10000),

  // 2. Borrow ETH (hedge)
  aaveConnector.borrow(WETH, 2.5, supplyPositionId),

  // 3. Create LP with borrowed + supplied
  uniswapConnector.mintPosition(WETH, USDC, feeAmount, amounts, borrowPositionId)
]);

// Enable automation
await proxy.setStrategyEnabled(lpPositionId, AUTO_REBALANCE, true);
await proxy.setStrategyEnabled(lpPositionId, AUTO_COMPOUND, true);
```

## Key Takeaways

✅ Impermanent Loss is the opportunity cost of LP vs holding
✅ IL increases non-linearly with price changes (5.7% at 2x, 25.5% at 5x)
✅ V3 concentrated liquidity magnifies both fees AND IL
✅ IL can be mitigated via stable pairs, hedging, or high fee generation
✅ Hedgehog automates rebalancing and compounding to maximize net returns

**Rule of Thumb:**
If `Fee APY > (Expected IL * 4)`, the position is likely profitable.

---

[Next: Hedging Strategies →](hedging-strategies.md)

[Back to Core Concepts](README.md)
