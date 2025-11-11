# Auto-Rebalance Strategy

## Overview

**Auto-Rebalance** automatically rebalances your Uniswap V3 LP positions when the price exits your configured range, ensuring you continue earning fees without manual intervention.

## The Problem

Uniswap V3's concentrated liquidity is powerful but requires active management:

**Without Auto-Rebalance:**
```
Day 1: ETH at $2,000, LP range $1,900-$2,100 ✅ Earning fees
Day 5: ETH rises to $2,150 ❌ Price exited range, stopped earning
Day 10: ETH at $2,200 ❌ Still not earning, missing out on fees
Manual action needed: Remove liquidity → Calculate new range → Create new position
Cost: $30-50 in gas + your time + missed fees
```

**With Auto-Rebalance:**
```
Day 1: ETH at $2,000, LP range $1,900-$2,100 ✅ Earning fees
Day 5: ETH rises to $2,150 ❌ Price exits range
Day 5 (1 hour later): Bot detects exit → Rebalances to $2,100-$2,300 ✅ Earning again
Cost: 0.1% automation fee (~$5 on $5,000 position)
Savings: $25-45 + zero missed fees + zero effort
```

## How It Works

### Detection

The bot monitors your LP position every block:

```solidity
function canExecuteStrategy(bytes32 positionId) external view returns (bool) {
    // Get position's tick range
    (int24 tickLower, int24 tickUpper) = getPositionTickRange(positionId);

    // Get current price tick from pool
    int24 currentTick = getCurrentTick();

    // Check if price is outside range
    bool isOutOfRange = currentTick < tickLower || currentTick > tickUpper;

    // Check cooldown period (prevent spam rebalancing)
    bool cooldownPassed = block.timestamp - lastRebalance > minRebalanceInterval;

    return isOutOfRange && cooldownPassed;
}
```

### Execution Flow

When triggered, the strategy executes these steps:

```
1. Collect Pending Fees
   └─ Collect any accrued fees before removing liquidity
   └─ These fees are included in the rebalanced position

2. Remove All Liquidity
   └─ Decrease liquidity to zero from old position
   └─ Collect both token0 and token1
   └─ Burn the old NFT position

3. Calculate New Range
   └─ Center around current price
   └─ Apply configured range width
   └─ Align to tick spacing (60 for 0.3% pools)

4. Create New Position
   └─ Mint new NFT with updated range
   └─ Add all collected tokens (fees + liquidity)
   └─ Apply slippage protection

5. Update Records
   └─ Mark old position as inactive
   └─ Link new position to maintain hierarchy
   └─ Copy automation settings to new position
   └─ Emit PositionRebalanced event
```

## Configuration

### RebalanceConfig Structure

```solidity
struct RebalanceConfig {
    uint256 priceDeviationTolerance;  // Trigger threshold (basis points)
    int24 tickRangeMultiplier;        // Width of new range
    uint24 swapPoolFee;               // Pool fee for any swaps
    uint256 slippageTolerance;        // Max slippage (basis points)
    bool maintainLiquidity;           // Keep same liquidity amount
    uint256 minRebalanceInterval;     // Min time between rebalances (seconds)
}
```

### Configuration Examples

**Conservative (Wide Range, Infrequent Rebalancing):**
```javascript
await autoRebalanceStrategy.configureStrategy(lpPositionId, {
    priceDeviationTolerance: 1000,    // Trigger when 10% out of range
    tickRangeMultiplier: 200,         // ±20% range width
    swapPoolFee: 3000,                // 0.3% Uniswap fee
    slippageTolerance: 100,           // 1% max slippage
    maintainLiquidity: true,
    minRebalanceInterval: 86400       // Max once per day
});

// Result: Wide ranges, rare rebalancing, lower fees, lower APY
```

**Moderate (Balanced):**
```javascript
await autoRebalanceStrategy.configureStrategy(lpPositionId, {
    priceDeviationTolerance: 500,     // Trigger when 5% out of range
    tickRangeMultiplier: 100,         // ±10% range width
    swapPoolFee: 3000,
    slippageTolerance: 100,
    maintainLiquidity: true,
    minRebalanceInterval: 43200       // Max twice per day
});

// Result: Moderate ranges, moderate rebalancing, balanced risk/reward
```

**Aggressive (Narrow Range, Frequent Rebalancing):**
```javascript
await autoRebalanceStrategy.configureStrategy(lpPositionId, {
    priceDeviationTolerance: 100,     // Trigger when 1% out of range
    tickRangeMultiplier: 50,          // ±5% range width (very narrow!)
    swapPoolFee: 3000,
    slippageTolerance: 50,            // 0.5% max slippage
    maintainLiquidity: true,
    minRebalanceInterval: 3600        // Max every hour
});

// Result: Narrow ranges, frequent rebalancing, high fees, high APY potential
// Risk: More automation fees, more IL during trending markets
```

## Fee Structure

**Automation fee:** 0.1% of position value per rebalance

**Example:**
```
Position value: $10,000
Rebalance fee: $10,000 * 0.001 = $10

Compare to manual:
- Gas cost: $30-50
- Time: 15-30 minutes
- Complexity: High
- Risk of error: Medium

Savings: $20-40 per rebalance
```

## Real-World Example

### Volatile Market Scenario

**Setup:**
- Initial: 1 ETH + $2,000 USDC in range $1,900-$2,100
- Strategy: Auto-rebalance enabled with moderate config
- Timeline: 30 days

**Price movements:**
```
Day 1-7: ETH $2,000 → $2,150
  └─ Day 7: Rebalanced to $2,050-$2,250 (Fee: $10)

Day 8-14: ETH $2,150 → $1,950
  └─ Day 14: Rebalanced to $1,850-$2,050 (Fee: $10)

Day 15-21: ETH $1,950 → $2,100
  └─ Day 21: Rebalanced to $2,000-$2,200 (Fee: $10)

Day 22-30: ETH stable around $2,100
  └─ No rebalance needed
```

**Results:**
- Total rebalances: 3
- Total automation fees: $30
- Fees earned: ~$200 (40% APY on LP)
- Manual cost would have been: $90-150 in gas
- Net savings: $60-120
- Time saved: 1-2 hours
- Continuous monitoring: 24/7 automated management

## When to Use Auto-Rebalance

### ✅ Good Use Cases

**1. Volatile Markets**
- Frequent price movements
- Ranges exit often
- High fee generation potential

**2. Popular Pairs**
- High trading volume
- Consistent fee generation
- Worth the rebalancing cost

**3. Hands-Off Approach**
- You want automation
- Don't want to monitor positions
- Willing to pay small automation fee

**4. Tax Efficiency**
- Each rebalance is a taxable event
- Automation maintains records automatically
- Easier tax reporting

### ❌ When NOT to Use

**1. Stable Pairs**
- Price rarely moves (USDC-USDT)
- Rebalancing not needed
- Wasted automation fees

**2. Low Volume Pairs**
- Not enough fees to justify rebalancing
- Automation costs > fee earnings

**3. Trending Markets**
- Price consistently moving one direction
- Constant rebalancing = high IL
- Better to manually adjust range wider

**4. Very Small Positions**
- <$1,000 positions
- Automation fees too high % of position
- Better to manually manage

## Strategy Comparison

| Strategy | When Price Exits Range | Pros | Cons |
|----------|------------------------|------|------|
| **Manual** | You rebalance manually | Full control, no automation fees | Time-consuming, miss fees while waiting, high gas costs |
| **Auto-Rebalance** | Bot rebalances automatically | Always earning, low cost, hands-off | Small automation fee, may over-rebalance in choppy markets |
| **Full Range (V2-style)** | Never exits range | Never need to rebalance | Much lower capital efficiency, lower APY |
| **Wide Range (V3)** | Rarely exits range | Infrequent rebalancing | Lower fee generation than narrow range |

## Advanced Tips

### Optimizing Range Width

**Volatility-based adjustment:**
```javascript
// High volatility (crypto winter, news events)
tickRangeMultiplier: 150-200  // Wider ranges

// Low volatility (stable markets)
tickRangeMultiplier: 75-100   // Narrower ranges

// Extreme volatility (black swan events)
tickRangeMultiplier: 300+     // Very wide or pause automation
```

### Combining with Other Strategies

**Auto-Rebalance + Auto-Compound:**
```javascript
// Enable both for maximum efficiency
await proxy.setStrategyEnabled(lpPositionId, AUTO_REBALANCE, true);
await proxy.setStrategyEnabled(lpPositionId, AUTO_COMPOUND, true);

// Result:
// - Auto-rebalance keeps you in range
// - Auto-compound reinvests fees
// - Compound growth + consistent fee generation
```

**Auto-Rebalance + Auto-Repay (for leveraged positions):**
```javascript
// Maintain LP fees + health factor
await proxy.setStrategyEnabled(lpPositionId, AUTO_REBALANCE, true);
await proxy.setStrategyEnabled(lpPositionId, AUTO_REPAY, true);

// Result:
// - Auto-rebalance maximizes fee generation
// - Auto-repay uses fees to maintain health factor
// - Leveraged position stays healthy
```

## Technical Details

### Tick Calculation

Uniswap V3 uses ticks to represent prices. The strategy calculates the new range:

```solidity
function _calculateNewTickRange(
    PositionInfo memory position,
    RebalanceConfig memory config
) private view returns (int24 tickLower, int24 tickUpper) {
    // Get current tick from pool
    int24 currentTick = getCurrentTick();

    // Get tick spacing (depends on fee tier)
    int24 tickSpacing = 60; // For 0.3% pools

    // Calculate range width
    int24 rangeWidth = tickSpacing * config.tickRangeMultiplier;

    // Center range around current tick
    tickLower = ((currentTick - rangeWidth / 2) / tickSpacing) * tickSpacing;
    tickUpper = ((currentTick + rangeWidth / 2) / tickSpacing) * tickSpacing;
}
```

### Gas Optimization

The strategy optimizes gas usage by:
- Batching operations (collect + remove + mint in one transaction)
- Using delegatecall to avoid token transfers between contracts
- Burning old NFT to get gas refund
- Reusing automation config from old position

## Monitoring

### Check if Strategy Can Execute

```javascript
const [canExecute, reason] = await autoRebalanceStrategy.canExecuteStrategy(lpPositionId);

console.log(`Can execute: ${canExecute}`);
console.log(`Reason code: ${reason}`);

// Reason codes:
// 0 = Can execute
// 1 = Position not found
// 2 = Position not active
// 3 = Cooldown period active
// 4 = Custom (still in range)
```

### View Configuration

```javascript
const config = await autoRebalanceStrategy.getRebalanceConfig(lpPositionId);

console.log(`Price deviation tolerance: ${config.priceDeviationTolerance / 100}%`);
console.log(`Tick range multiplier: ${config.tickRangeMultiplier}`);
console.log(`Min rebalance interval: ${config.minRebalanceInterval / 3600} hours`);
```

### Recent Rebalances

```javascript
// Listen for rebalance events
const filter = autoRebalanceStrategy.filters.PositionRebalanced(lpPositionId);
const events = await autoRebalanceStrategy.queryFilter(filter, -10000); // Last 10k blocks

events.forEach(event => {
    console.log(`Rebalanced at block ${event.blockNumber}`);
    console.log(`Old position: ${event.args.oldPositionId}`);
    console.log(`New position: ${event.args.newPositionId}`);
    console.log(`New range: tick ${event.args.newTickLower} to ${event.args.newTickUpper}`);
});
```

## Troubleshooting

### Strategy Not Executing

**Check these:**
1. Is automation enabled? `await proxy.strategyEnabled(positionId, AUTO_REBALANCE_STRATEGY)`
2. Is bot approved? `await proxy.approved()`
3. Is position out of range? Use Uniswap interface to verify
4. Is cooldown active? Check `lastRebalanceTime + minRebalanceInterval`
5. Is bot whitelisted in HHDirectory?

### Excessive Rebalancing

**Solutions:**
- Increase `minRebalanceInterval` (e.g., from 1 hour to 6 hours)
- Increase `tickRangeMultiplier` (wider ranges)
- Increase `priceDeviationTolerance` (only rebalance when further out)

### High Automation Fees

**If automation fees are too high:**
- Your position may be too small (<$5,000)
- Market is too volatile (constant rebalancing)
- Range is too narrow (widen it)
- Consider manual management or wider range

## Key Takeaways

✅ Auto-Rebalance keeps your V3 LP positions earning fees 24/7
✅ 0.1% automation fee << manual gas costs ($30-50 per rebalance)
✅ Configure range width based on market volatility
✅ Combine with Auto-Compound for maximum efficiency
✅ Best for volatile markets and popular pairs
✅ Not suitable for stable pairs or very small positions

---

[Back to Automation Strategies](../README.md)

[Back to Automation Overview](../README.md)
