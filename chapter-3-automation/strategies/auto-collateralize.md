# Auto-Collateralize Strategy

## Overview

**Auto-Collateralize** automatically converts your LP fees into additional collateral, improving your health factor and reducing liquidation risk over time.

## The Strategy

Instead of repaying debt or compounding LP fees, auto-collateralize uses fees to strengthen your collateral position:

**Traditional approach:**
```
Earn $500 LP fees → Sit in wallet OR manually add to collateral
Manual action: Transfer fees → Supply to Aave → Gas costs
Result: Extra collateral, but requires manual work
```

**With Auto-Collateralize:**
```
Earn $500 LP fees → Auto-convert to collateral asset → Auto-supply to Aave
No manual action needed
Result: Health factor improves automatically
Cost: 0.15% automation fee (~$0.75)
```

## How It Works

### Detection

The bot monitors based on your configuration:

```solidity
function canExecuteStrategy(bytes32 positionId) external view returns (bool) {
    // Get LP position and find associated supply position
    PositionInfo memory lpPosition = getPosition(positionId);
    bytes32 supplyPositionId = findSupplyPosition(lpPosition);

    // Get configuration
    CollateralizeConfig memory config = getCollateralizeConfig(positionId);

    // Check if execution needed based on mode:
    if (config.onlyWhenBelowTarget) {
        // Mode 1: Only execute when health factor is low
        uint256 currentHF = getHealthFactor(supplyPosition.protocol);
        if (currentHF >= config.targetHealthFactor) {
            return false;  // Health factor already good
        }
    }

    // Mode 2: Execute on schedule regardless of health factor
    // (Periodic strengthening of position)

    // Check if there are fees to collect
    if (lpPosition.amount == 0) return false;

    return true;
}
```

### Execution Flow

When triggered:

```
1. Collect LP Fees
   └─ Collect token0 and token1 from Uniswap position
   └─ Example: 0.08 ETH + $120 USDC

2. Identify Target Collateral Asset
   └─ From config or use existing collateral asset
   └─ Example: Target = USDC

3. Convert to Collateral Asset
   └─ If token0 = target: Keep it
   └─ If token0 ≠ target: Swap to target
   └─ Example: 0.08 ETH → Swap to $160 USDC
   └─ Total collateral: $120 + $160 = $280 USDC

4. Supply to Aave
   └─ Supply $280 USDC to Aave
   └─ Receive $280 aUSDC
   └─ Collateral position increases

5. Collect Automation Fee
   └─ 0.15% of supplied amount
   └─ Example: $280 * 0.0015 = $0.42

6. Verify Health Factor Improved
   └─ Old HF: 1.45
   └─ New HF: 1.52 (improved!)
   └─ Emit HealthFactorImproved event
```

## Configuration

### CollateralizeConfig Structure

```solidity
struct CollateralizeConfig {
    address targetCollateralAsset;  // Asset to convert to (0 = use existing)
    uint24 swapPoolFee;            // Uniswap pool fee for swaps
    uint256 minAmountOut;          // Slippage protection
    uint256 targetHealthFactor;    // Target HF to maintain
    bool onlyWhenBelowTarget;      // Only execute when HF < target
}
```

### Configuration Examples

**Safety-Focused (Maintain High Health Factor):**
```javascript
await autoCollateralizeStrategy.configureStrategy(lpPositionId, {
    targetCollateralAsset: USDC,        // Convert everything to USDC
    swapPoolFee: 3000,                  // 0.3% pool
    minAmountOut: 0,                    // Dynamic slippage
    targetHealthFactor: ethers.utils.parseEther("2.0"),  // Target HF = 2.0
    onlyWhenBelowTarget: true           // Only when HF < 2.0
});

// Result: Maintains very safe health factor
// Best for: Risk-averse users, volatile markets
```

**Balanced (Periodic Strengthening):**
```javascript
await autoCollateralizeStrategy.configureStrategy(lpPositionId, {
    targetCollateralAsset: ethers.constants.AddressZero,  // Use existing collateral
    swapPoolFee: 3000,
    minAmountOut: 0,
    targetHealthFactor: ethers.utils.parseEther("1.8"),
    onlyWhenBelowTarget: false          // Execute on schedule
});

// Result: Periodically adds to collateral
// Best for: Gradual position strengthening
```

**Growth-Oriented (Low Threshold):**
```javascript
await autoCollateralizeStrategy.configureStrategy(lpPositionId, {
    targetCollateralAsset: USDC,
    swapPoolFee: 3000,
    minAmountOut: 0,
    targetHealthFactor: ethers.utils.parseEther("1.5"),
    onlyWhenBelowTarget: true           // Only when HF < 1.5
});

// Result: Lets position be more leveraged, only strengthens when needed
// Best for: Users prioritizing LP fee compounding over safety
```

## Fee Structure

**Automation fee:** 0.15% of collateralized amount

**Example:**
```
LP fees collected: $400
Converted to USDC: $400
Supplied to Aave: $400
Automation fee: $400 * 0.0015 = $0.60
Net collateral added: $399.40

Health factor improvement:
Old: 1.45
New: 1.52
Improvement: +0.07 (4.8% increase in safety margin)
```

## Use Cases

### Use Case 1: Long-Term Position Strengthening

**Scenario:**
```
You opened a leveraged LP position 6 months ago:
- Supplied: $50,000 USDC
- Borrowed: $30,000 ETH
- LP: $60,000 value
- Initial HF: 1.37

Enable auto-collateralize with onlyWhenBelowTarget = false

After 6 months:
- LP fees earned: ~$12,000 (40% APY)
- All fees converted to USDC collateral
- New collateral: $62,000 USDC
- Same debt: $30,000 ETH
- New HF: 1.70 (24% improvement!)

Result: Position is much safer, can:
- Borrow more if desired
- Sleep better at night
- Weather larger market swings
```

### Use Case 2: Health Factor Guardian

**Scenario:**
```
Volatile market conditions, you want safety:

Config:
- targetHealthFactor: 2.0
- onlyWhenBelowTarget: true

Behavior:
- HF = 2.1 → No action (already safe)
- HF drops to 1.95 → Collect fees, add collateral
- HF back to 2.05 → No action
- HF drops to 1.92 → Collect fees again
- HF back to 2.08 → Stop

Result: Health factor stays above 2.0 automatically
```

### Use Case 3: De-Leveraging Over Time

**Scenario:**
```
You want to reduce leverage gradually:

Initial:
- Collateral: $100,000 USDC
- Debt: $60,000 ETH
- Leverage: 1.6x
- HF: 1.37

Enable auto-collateralize (always execute mode)

After 1 year:
- Collateral: $100,000 + $24,000 (fees) = $124,000
- Debt: Still $60,000 ETH (no repayment)
- Leverage: 1.48x (reduced)
- HF: 1.70 (much safer)

Alternative strategy: Could have used auto-repay instead
Result depends on your goals:
- Auto-collateralize: Increase collateral (borrow more later if desired)
- Auto-repay: Decrease debt (reduce interest payments)
```

## When to Use Auto-Collateralize

### ✅ Good Use Cases

**1. Long-Term Safety Focus**
- Want to strengthen position over time
- Not interested in compounding LP
- Prefer higher health factor

**2. Preparing for More Leverage**
- Building up collateral
- Plan to borrow more later
- Gradual position scaling

**3. Volatile Collateral Assets**
- Collateral in ETH or other volatile assets
- Want to add to it automatically
- Improve HF as you earn

**4. Tax Considerations**
- Prefer increasing collateral over repaying debt
- Different tax implications
- Consult tax advisor for your situation

### ❌ When NOT to Use

**1. Want Maximum LP Growth**
- Use auto-compound instead
- Compounding gives higher returns
- Better for non-leveraged positions

**2. High Debt Burden**
- Auto-repay is better
- Reduces interest payments
- Direct HF improvement via debt reduction

**3. Already Over-Collateralized**
- HF > 3.0
- No safety benefit from more collateral
- Better to compound or take profits

**4. Short-Term Positions**
- Not holding long enough to benefit
- Automation fees not worth it
- Manual management better

## Comparison with Auto-Repay

| Aspect | Auto-Collateralize | Auto-Repay |
|--------|-------------------|------------|
| **Effect on HF** | Increases collateral | Decreases debt |
| **Effect on Borrowing Capacity** | Increases (can borrow more) | Decreases (less debt used) |
| **Interest Payments** | No change | Decreases (less debt) |
| **Long-term Effect** | Stronger base position | Lower debt burden |
| **Best For** | Building position | Reducing leverage |
| **Tax Implications** | Adding to collateral | Repaying debt |

**Example with same $500 fees:**

**Auto-Collateralize:**
```
Before: $50k collateral, $30k debt, HF = 1.37
Action: Add $500 to collateral
After: $50.5k collateral, $30k debt, HF = 1.38
```

**Auto-Repay:**
```
Before: $50k collateral, $30k debt, HF = 1.37
Action: Repay $500 of debt
After: $50k collateral, $29.5k debt, HF = 1.39
```

Both improve HF similarly, but:
- Collateralize: You can still borrow that $500 if needed
- Repay: Debt burden permanently reduced

## Combining Strategies

### Auto-Collateralize + Auto-Rebalance

```javascript
// Perfect combo for long-term positions
await proxy.setStrategyEnabled(lpPositionId, AUTO_REBALANCE, true);
await proxy.setStrategyEnabled(lpPositionId, AUTO_COLLATERALIZE, true);

// How they work together:
// 1. Auto-rebalance keeps you earning max fees
// 2. Auto-collateralize converts fees to collateral
// 3. Result: Growing collateral base + consistent fee generation
```

### Conditional Strategy Switching (Advanced)

```javascript
// Idea: Use auto-collateralize when HF is low, auto-compound when HF is high
// This requires custom configuration or multiple positions

// Position 1: Low HF threshold
// - Auto-collateralize when HF < 1.8
// Position 2: High HF threshold
// - Auto-compound when HF > 2.0

// Effectively: Safety-first, then growth
```

## Technical Details

### Finding the Supply Position

Auto-collateralize needs to find the root supply position:

```solidity
function _findSupplyPosition(PositionInfo memory lpPosition)
    private view returns (bytes32)
{
    // LP position's parent is borrow position
    bytes32 borrowPositionId = lpPosition.parentPosition;
    if (borrowPositionId == bytes32(0)) return bytes32(0);

    // Get borrow position
    PositionInfo memory borrowPosition = getPosition(borrowPositionId);

    // Borrow position's parent is supply position
    return borrowPosition.parentPosition;
}
```

**Position hierarchy:**
```
Supply USDC (grandparent)
  └─ Borrow ETH (parent)
       └─ LP ETH-USDC (this position)

Auto-collateralize:
- Starts at LP position
- Finds borrow parent
- Finds supply grandparent
- Adds collateral to supply position
```

### Health Factor Improvement Calculation

```javascript
// Before collateralization
const collateralBefore = 50000; // $50,000 USDC
const debt = 30000; // $30,000 ETH
const liquidationThreshold = 0.825; // 82.5% for USDC
const hfBefore = (collateralBefore * liquidationThreshold) / debt;
// HF = 41250 / 30000 = 1.375

// After adding $500 collateral
const collateralAfter = 50500;
const hfAfter = (collateralAfter * liquidationThreshold) / debt;
// HF = 41662.5 / 30000 = 1.389

// Improvement
const improvement = hfAfter - hfBefore; // 0.014 or 1.4% improvement
const percentImprovement = (improvement / hfBefore) * 100; // 1.02%
```

## Monitoring

### Check Execution Status

```javascript
const [canExecute, reason] = await autoCollateralizeStrategy.canExecuteStrategy(lpPositionId);

if (canExecute) {
    console.log("Auto-collateralize can execute!");

    // Check why
    const config = await autoCollateralizeStrategy.getCollateralizeConfig(lpPositionId);
    const currentHF = await getHealthFactor();

    if (config.onlyWhenBelowTarget && currentHF < config.targetHealthFactor) {
        console.log(`HF ${currentHF} below target ${config.targetHealthFactor}`);
    } else {
        console.log("Scheduled execution ready");
    }
}
```

### View Collateralization History

```javascript
const filter = autoCollateralizeStrategy.filters.CollateralAdded(lpPositionId);
const events = await autoCollateralizeStrategy.queryFilter(filter);

let totalCollateralized = ethers.BigNumber.from(0);

events.forEach((event, index) => {
    const { supplyPositionId, asset, amount } = event.args;
    console.log(`\nCollateralization ${index + 1}:`);
    console.log(`  Amount: ${ethers.utils.formatUnits(amount, 6)} ${asset}`);
    console.log(`  Block: ${event.blockNumber}`);

    totalCollateralized = totalCollateralized.add(amount);
});

console.log(`\nTotal collateral added: ${ethers.utils.formatUnits(totalCollateralized, 6)} USDC`);
```

### Track Health Factor Improvements

```javascript
const hfFilter = autoCollateralizeStrategy.filters.HealthFactorImproved(lpPositionId);
const hfEvents = await autoCollateralizeStrategy.queryFilter(hfFilter);

hfEvents.forEach((event, index) => {
    const { oldHealthFactor, newHealthFactor } = event.args;
    const oldHF = ethers.utils.formatEther(oldHealthFactor);
    const newHF = ethers.utils.formatEther(newHealthFactor);
    const improvement = ((newHF - oldHF) / oldHF * 100).toFixed(2);

    console.log(`\nImprovement ${index + 1}:`);
    console.log(`  Old HF: ${oldHF}`);
    console.log(`  New HF: ${newHF}`);
    console.log(`  Improvement: +${improvement}%`);
});
```

## Key Takeaways

✅ Auto-collateralize converts LP fees to additional collateral
✅ Improves health factor by increasing collateral (not repaying debt)
✅ 0.15% automation fee
✅ Best for long-term position strengthening
✅ Choose between "only when needed" vs "always strengthen" modes
✅ Different strategy than auto-repay - both valid, choose based on goals
✅ Gradually de-leverages while maintaining borrowing capacity

---

[Back to Automation Strategies](../README.md)

[Back to Automation Overview](../README.md)
