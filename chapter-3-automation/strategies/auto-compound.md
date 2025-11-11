# Auto-Compound Strategy

## Overview

**Auto-Compound** automatically reinvests your Uniswap V3 LP fees back into your position, enabling compound growth without manual intervention.

## The Power of Compounding

Compound interest transforms linear growth into exponential returns. The difference between simple and compound interest becomes significant over time.

**Without Auto-Compound:**
```
Month 1: $10,000 LP earns $200 fees (2% monthly)
Month 2: $10,000 LP earns $200 fees
Month 3: $10,000 LP earns $200 fees
Year total: $2,400 (24% simple)
```

**With Auto-Compound:**
```
Month 1: $10,000 LP earns $200 fees → Reinvested
Month 2: $10,200 LP earns $204 fees → Reinvested
Month 3: $10,404 LP earns $208 fees → Reinvested
Year total: $2,682 (26.82% compound)

Difference: $282 more (11.75% boost from compounding)
```

Over time, this difference becomes massive.

## How It Works

### Detection

The bot monitors your LP position for collectible fees:

```solidity
function canExecuteStrategy(bytes32 positionId) external view returns (bool) {
    // Get position data
    PositionInfo memory position = getPosition(positionId);

    // Check if position has liquidity
    if (position.amount == 0) return false;

    // Check cooldown (don't compound too frequently)
    if (block.timestamp - lastCompound < minCompoundInterval) return false;

    // In production: Query actual collectible fees from Uniswap
    // Execute if fees > minCompoundAmount (e.g., $100)

    return true;
}
```

### Execution Flow

When triggered, the strategy executes:

```
1. Collect All Fees
   └─ Collect accumulated token0 fees
   └─ Collect accumulated token1 fees
   └─ Example: 0.05 ETH + $80 USDC

2. Calculate Optimal Ratio
   └─ Determine current pool ratio
   └─ Maintain ratio or swap to balance
   └─ Example: Need 50/50 value ratio

3. Swap if Needed (maintainRatio mode)
   └─ Swap excess token to balance amounts
   └─ Example: $100 ETH + $80 USDC → Swap $10 ETH to USDC
   └─ Result: $90 ETH + $90 USDC (balanced)

4. Increase Liquidity
   └─ Add both tokens to existing position
   └─ Mints additional liquidity shares
   └─ Example: Add $180 value → Get ~X liquidity

5. Collect Automation Fee
   └─ 0.2% of compounded value
   └─ Example: $180 * 0.002 = $0.36 fee
   └─ Net compounded: $179.64

6. Update Position
   └─ New liquidity = old + added
   └─ Emit PositionCompounded event
   └─ Record execution timestamp
```

## Configuration

### CompoundConfig Structure

```solidity
struct CompoundConfig {
    uint256 minCompoundAmount;   // Min USD value to trigger compound
    uint24 swapPoolFee;          // Pool fee for token swaps
    uint256 slippageTolerance;   // Slippage tolerance (basis points)
    bool maintainRatio;          // Whether to maintain token ratio
}
```

### Configuration Examples

**Frequent Compounding (High Volume Pairs):**
```javascript
await autoCompoundStrategy.configureStrategy(lpPositionId, {
    minCompoundAmount: 50e6,         // Compound when $50+ fees
    swapPoolFee: 3000,               // 0.3% fee tier
    slippageTolerance: 100,          // 1% max slippage
    maintainRatio: true              // Keep balanced
});

// Result: Compounds frequently, max growth
// Best for: High volume pairs (ETH-USDC, WBTC-ETH)
```

**Moderate Compounding:**
```javascript
await autoCompoundStrategy.configureStrategy(lpPositionId, {
    minCompoundAmount: 100e6,        // Compound when $100+ fees
    swapPoolFee: 3000,
    slippageTolerance: 100,
    maintainRatio: true
});

// Result: Balanced approach
// Best for: Most pairs
```

**Conservative Compounding (Low Volume Pairs):**
```javascript
await autoCompoundStrategy.configureStrategy(lpPositionId, {
    minCompoundAmount: 200e6,        // Compound when $200+ fees
    swapPoolFee: 3000,
    slippageTolerance: 200,          // 2% slippage (less liquid)
    maintainRatio: false             // Don't swap, use as-is
});

// Result: Less frequent, lower automation costs
// Best for: Lower volume pairs, larger positions
```

## Fee Structure

**Automation fee:** 0.2% of compounded amount

**Example Calculation:**
```
Collected fees: $500 (0.25 ETH + $250 USDC)
Automation fee: $500 * 0.002 = $1.00
Net compounded: $499

Compare to manual:
- Gas to collect fees: $15
- Gas to increase liquidity: $20
- Total gas: $35
- Net compounded if manual: $500 - $35 = $465

Savings: $34 per compound (automation is 34x cheaper!)
```

## Real-World Example

### High Volume Pool (ETH-USDC 0.3%)

**Setup:**
- Initial LP: $50,000 (25 ETH + $50,000 USDC at $2,000/ETH)
- Pool APY: 40% from fees
- Auto-compound enabled with moderate config

**Monthly Breakdown:**

**Month 1:**
```
LP Value: $50,000
Fees earned: $1,667 (40% APY / 12 months)
Compounded: $1,667 - $3.33 fee = $1,663.67
New LP value: $51,663.67
```

**Month 2:**
```
LP Value: $51,663.67
Fees earned: $1,722 (40% APY on larger base)
Compounded: $1,722 - $3.44 fee = $1,718.56
New LP value: $53,382.23
```

**Month 3:**
```
LP Value: $53,382.23
Fees earned: $1,779
Compounded: $1,779 - $3.56 fee = $1,775.44
New LP value: $55,157.67
```

**... continuing for 12 months:**

**Year-End Results:**
```
Final LP value: $73,280 (without IL)
Total earned: $23,280
Effective APY: 46.56% (compound boost!)

Compare to no compounding:
Simple interest: $50,000 * 0.40 = $20,000
Total value: $70,000
Difference: $3,280 (16.4% more from compounding!)

Total automation fees paid: ~$40
Manual gas if done monthly: ~$420
Savings: $380 in gas costs
```

## When to Use Auto-Compound

### ✅ Good Use Cases

**1. Long-Term Positions**
- Holding for months/years
- Compound growth maximizes returns
- Automation fees amortize over time

**2. High Fee Generation**
- Popular pairs (ETH-USDC, WBTC-ETH)
- High volume = frequent fees
- More opportunities to compound

**3. Stable Strategies**
- Delta-neutral positions
- Low IL risk
- Focus on fee accumulation

**4. Large Positions**
- $10,000+ positions
- Automation fees negligible % of position
- Significant absolute gains from compounding

### ❌ When NOT to Use

**1. Short-Term Positions**
- Holding for days/weeks
- Compound growth minimal
- Better to collect manually at exit

**2. Low Volume Pairs**
- Fees too small
- Automation costs > compound benefit
- Rare execution = minimal growth

**3. Very Small Positions**
- <$1,000 positions
- Automation fees too high % wise
- Manual collection better

**4. Volatile Ranges**
- Constant rebalancing
- Each rebalance resets fees
- Compounding interrupted

## Combining Strategies

### Auto-Compound + Auto-Rebalance

**The Perfect Combo:**
```javascript
// Enable both strategies
await proxy.setStrategyEnabled(lpPositionId, AUTO_REBALANCE, true);
await proxy.setStrategyEnabled(lpPositionId, AUTO_COMPOUND, true);

// How they work together:
// 1. Auto-rebalance keeps you in range (earning fees)
// 2. Auto-compound reinvests fees (compound growth)
// 3. Result: Maximum fee generation + maximum compounding
```

**Example scenario:**
```
Week 1: Earning fees in range
Week 2: Price exits → Auto-rebalance to new range
Week 3: Accumulated fees → Auto-compound
Week 4: More fees → Auto-compound again
Repeat...

Result: Always earning + always compounding = exponential growth
```

### Auto-Compound + Auto-Repay

**For Leveraged Positions:**
```javascript
// Split fees between compound and repay
// Configure to compound 70%, repay 30% (example)

// This is advanced - requires custom configuration
// Generally: Let auto-repay handle health factor
// Then enable auto-compound on remaining fees
```

## Profitability Analysis

### Break-Even Calculation

When does auto-compound beat manual?

**Variables:**
- P = Position size
- F = Fee APY
- G = Gas cost per manual compound
- A = Automation fee (0.2%)
- N = Number of compounds per year

**Manual total cost:**
```
Manual = G * N
Example: $25 gas * 12 compounds = $300/year
```

**Auto total cost:**
```
Auto = (P * F * A)
Example: $50,000 * 0.40 * 0.002 = $40/year
```

**Break-even:**

The primary value comes from two sources:
1. **Compound growth itself** (major benefit)
2. **Lower costs than manual** (minor benefit)

**Value from compounding (1 year, monthly compounding):**
```
No compound: $50,000 * (1 + 0.40) = $70,000
With compound: $50,000 * (1 + 0.40/12)^12 = $73,480
Extra gain: $3,480

Automation cost: $50,000 * 0.40 * 0.002 = $40
Manual cost: $25 * 12 = $300

Net benefit: $3,480 - $40 = $3,440 (automation)
Net benefit: $3,480 - $300 = $3,180 (manual)

Automation wins by: $260/year
```

**Conclusion:** Automation is cheaper AND gives you compound growth.

## Technical Details

### Optimal Amount Calculation

The strategy calculates optimal token amounts to maintain ratio:

```solidity
function _calculateOptimalAmounts(
    PositionInfo memory position,
    uint256 tokenId,
    uint256 available0,
    uint256 available1,
    CompoundConfig memory config
) private view returns (uint256 amount0, uint256 amount1) {
    if (!config.maintainRatio) {
        // Use all available (simpler, no swaps needed)
        return (available0, available1);
    }

    // Get current pool ratio
    uint256 ratio0 = 1; // Simplified - would query actual price
    uint256 ratio1 = 1;

    // Calculate amounts to maintain ratio
    uint256 amount0FromRatio = (available1 * ratio0) / ratio1;
    uint256 amount1FromRatio = (available0 * ratio1) / ratio0;

    if (amount0FromRatio <= available0) {
        amount0 = amount0FromRatio;
        amount1 = available1;
    } else {
        amount0 = available0;
        amount1 = amount1FromRatio;
    }

    return (amount0, amount1);
}
```

### Gas Optimization

Auto-compound is gas-efficient:
- Single transaction for collect + increase liquidity
- Delegatecall pattern (no token transfers between contracts)
- Batch operations where possible

## Monitoring

### Check Compounding Status

```javascript
// Check if strategy can execute
const [canExecute, reason] = await autoCompoundStrategy.canExecuteStrategy(lpPositionId);

if (canExecute) {
    console.log("Ready to compound!");
} else {
    console.log(`Cannot compound: ${reason}`);
    // Reasons: cooldown active, no fees, position inactive, etc.
}
```

### View Configuration

```javascript
const config = await autoCompoundStrategy.getCompoundConfig(lpPositionId);

console.log(`Min compound amount: $${ethers.utils.formatUnits(config.minCompoundAmount, 6)}`);
console.log(`Slippage tolerance: ${config.slippageTolerance / 100}%`);
console.log(`Maintain ratio: ${config.maintainRatio}`);
```

### Compound History

```javascript
// Get all compound events for position
const filter = autoCompoundStrategy.filters.PositionCompounded(lpPositionId);
const events = await autoCompoundStrategy.queryFilter(filter);

let totalCompounded = ethers.BigNumber.from(0);

events.forEach((event, index) => {
    const { liquidity, amount0, amount1 } = event.args;
    console.log(`\nCompound ${index + 1}:`);
    console.log(`  Liquidity added: ${liquidity.toString()}`);
    console.log(`  Amount0: ${ethers.utils.formatEther(amount0)} ETH`);
    console.log(`  Amount1: ${ethers.utils.formatUnits(amount1, 6)} USDC`);

    totalCompounded = totalCompounded.add(amount0).add(amount1);
});

console.log(`\nTotal compounded value: ${totalCompounded.toString()}`);
```

## Troubleshooting

### Strategy Not Executing

**Check:**
1. Are fees > minCompoundAmount?
2. Has enough time passed since last compound?
3. Is automation enabled for the position?
4. Is the bot approved and whitelisted?

### Execution Failed

**Common causes:**
- Slippage too high (increase slippageTolerance)
- Insufficient gas
- Pool liquidity too low (rare)
- Position liquidity at zero (closed position)

## Key Takeaways

✅ Auto-compound enables exponential growth through reinvestment
✅ 0.2% automation fee << manual gas costs + time saved
✅ Best for long-term, high-volume positions
✅ Combine with auto-rebalance for maximum effect
✅ Configure minCompoundAmount based on position size
✅ Compound interest is powerful - let it work for you 24/7

---

[Back to Automation Strategies](../README.md)

[Back to Automation Overview](../README.md)
