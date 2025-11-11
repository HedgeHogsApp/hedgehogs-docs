# Auto-Repay Strategy

## Overview

**Auto-Repay** automatically uses your LP fees to repay borrowed debt, maintaining a healthy health factor and preventing liquidation - all without you lifting a finger.

## The Liquidation Risk

When you borrow against collateral on Aave, you face liquidation risk:

**Without Auto-Repay:**
```
Day 1: Supply $10k USDC, borrow $6k ETH (HF = 1.37)
Day 5: ETH rises to $2,500 (+25%)
       Debt value now $7,500 (HF = 1.10) ⚠️ Danger zone!
Day 7: ETH hits $2,700 (+35%)
       Debt value now $8,100 (HF = 1.02) 🚨 Critical!
Day 8: ETH reaches $2,800 (+40%)
       Debt value $8,400 (HF = 0.98) ❌ LIQUIDATED

Result: Lost 5-10% of your collateral in liquidation penalty
```

**With Auto-Repay:**
```
Day 1: Supply $10k USDC, borrow $6k ETH (HF = 1.37)
       LP 3 ETH + $6k USDC (earning fees)
Day 5: ETH rises to $2,500
       HF drops to 1.25 → Auto-repay triggers!
       Collects $150 LP fees → Repays 0.06 ETH
       New debt: 2.94 ETH = $7,350 (HF = 1.12) ✅ Safe
Day 7: ETH continues to $2,700
       HF = 1.05 → Auto-repay triggers again!
       Collects $200 fees → Repays 0.074 ETH
       New debt: 2.866 ETH = $7,738 (HF = 1.07) ✅ Still safe
Day 8: ETH at $2,800
       HF = 1.06 ✅ No liquidation, position healthy

Result: No liquidation, kept all your collateral
```

## How It Works

### Detection

The bot monitors your borrow position's health factor:

```solidity
function canExecuteStrategy(bytes32 positionId) external view returns (bool) {
    // Get LP position (this position)
    PositionInfo memory lpPosition = getPosition(positionId);

    // Get parent borrow position
    bytes32 borrowPositionId = lpPosition.parentPosition;
    PositionInfo memory borrowPosition = getPosition(borrowPositionId);

    // Get grandparent supply position
    bytes32 supplyPositionId = borrowPosition.parentPosition;

    // Check health factor on Aave
    uint256 healthFactor = getHealthFactor(supplyPosition);

    // Get config
    RepayConfig memory config = getRepayConfig(positionId);

    // Trigger if health factor below threshold
    return healthFactor < config.triggerHealthFactor;
}
```

### Execution Flow

When triggered:

```
1. Collect LP Fees
   └─ Collect token0 and token1 from Uniswap position
   └─ Example: 0.1 ETH + $150 USDC collected

2. Identify Debt Asset
   └─ Get borrow position details
   └─ Debt asset: ETH (in this example)
   └─ Need to convert to ETH for repayment

3. Swap to Debt Asset (if needed)
   └─ Check which tokens match debt asset
   └─ Swap non-matching tokens via Uniswap
   └─ Example: $150 USDC → 0.06 ETH
   └─ Total ETH for repay: 0.16 ETH

4. Calculate Repayment Amount
   └─ Check maxRepayPercentage config
   └─ Don't repay more than X% of debt per transaction
   └─ Example: Max 50% of $7,500 debt = $3,750
   └─ We have $400 → Repay all of it

5. Repay Debt on Aave
   └─ Call Aave V3 Pool.repay()
   └─ Repay 0.16 ETH (worth ~$400)
   └─ Debt decreases: 3 ETH → 2.84 ETH

6. Collect Automation Fee
   └─ 0.15% of repaid amount
   └─ Example: $400 * 0.0015 = $0.60

7. Verify Health Factor Improved
   └─ Old HF: 1.25
   └─ New HF: 1.31
   └─ ✅ Success, emit DebtRepaid event
```

## Configuration

### RepayConfig Structure

```solidity
struct RepayConfig {
    uint256 maxRepayPercentage;  // Max % of debt per tx (basis points)
    uint24 swapPoolFee;          // Uniswap pool fee for swaps
    uint256 minAmountOut;        // Min tokens from swap (slippage)
    bool useATokens;             // Use aTokens for repayment (advanced)
}
```

### Configuration Examples

**Conservative (High Safety Margin):**
```javascript
await autoRepayStrategy.configureStrategy(lpPositionId, {
    maxRepayPercentage: 5000,        // Max 50% of debt per tx
    swapPoolFee: 3000,               // 0.3% pool
    minAmountOut: 0,                 // Dynamic slippage calc
    useATokens: false
});

// Trigger settings (set separately):
// - triggerHealthFactor: 1.5 (trigger when HF < 1.5)
// - targetHealthFactor: 1.8 (repay until HF > 1.8)

// Result: Very safe, rarely at risk, frequent small repayments
```

**Moderate (Balanced):**
```javascript
await autoRepayStrategy.configureStrategy(lpPositionId, {
    maxRepayPercentage: 10000,       // Max 100% of debt (full repay possible)
    swapPoolFee: 3000,
    minAmountOut: 0,
    useATokens: false
});

// Trigger: HF < 1.3, target HF > 1.5

// Result: Balanced safety, executes when needed
```

**Aggressive (Minimal Intervention):**
```javascript
await autoRepayStrategy.configureStrategy(lpPositionId, {
    maxRepayPercentage: 2000,        // Max 20% per tx (small repayments)
    swapPoolFee: 3000,
    minAmountOut: 0,
    useATokens: false
});

// Trigger: HF < 1.15, target HF > 1.25

// Result: Minimal repayments, keeps more capital in LP
// Risk: Closer to liquidation threshold
```

## Fee Structure

**Automation fee:** 0.15% of repaid amount

**Example:**
```
LP fees collected: $500
Swapped to debt asset: $500 ETH
Repaid to Aave: $500
Automation fee: $500 * 0.0015 = $0.75
Net benefit: Avoided liquidation (worth 5-10% of collateral)

Manual alternative:
- Monitor health factor 24/7: Your time
- Gas to collect fees: $15
- Gas to swap: $20
- Gas to repay: $20
- Total: $55 + stress + time

Savings: $54.25 + peace of mind
```

## Real-World Example

### Leveraged LP Position

**Setup:**
```
Supply: $20,000 USDC to Aave
Borrow: 5 ETH (worth $10,000 at $2,000/ETH)
LP: 5 ETH + $10,000 USDC on Uniswap V3
Initial Health Factor: 1.65
Auto-Repay: Enabled (trigger HF < 1.3, target HF > 1.5)
```

**Scenario: ETH Price Volatility**

**Week 1: ETH $2,000 → $2,300 (+15%)**
```
Debt value: 5 ETH = $11,500
Health Factor: ($20,000 * 0.825) / $11,500 = 1.43
Status: Above trigger threshold (1.3), no repayment needed
LP fees earned: $180
```

**Week 2: ETH $2,300 → $2,600 (+30% total)**
```
Debt value: 5 ETH = $13,000
Health Factor: $16,500 / $13,000 = 1.27 ⚠️ Below trigger!

Auto-Repay executes:
1. Collect LP fees: 0.08 ETH + $150 USDC = $358
2. Swap $150 USDC → 0.058 ETH
3. Total ETH to repay: 0.138 ETH ($358)
4. Repay 0.138 ETH to Aave
5. New debt: 4.862 ETH = $12,642
6. New HF: $16,500 / $12,642 = 1.31 ✅ Safe again

Automation fee: $0.54
```

**Week 3: ETH $2,600 → $2,900 (+45% total)**
```
Debt value: 4.862 ETH = $14,100
Health Factor: $16,500 / $14,100 = 1.17 ⚠️ Below trigger again!

Auto-Repay executes again:
1. Collect fees: 0.09 ETH + $180 USDC = $441
2. Swap $180 USDC → 0.062 ETH
3. Repay 0.152 ETH ($441)
4. New debt: 4.71 ETH = $13,659
5. New HF: $16,500 / $13,659 = 1.21 ⚠️ Still below target

Strategy waits for additional fees to accumulate...
```

**Week 4: Additional fees accumulated**
```
Collect fees: 0.1 ETH + $200 USDC = $490
Repay 0.169 ETH
New debt: 4.541 ETH = $13,169
New HF: $16,500 / $13,169 = 1.25 ✅ Improving
```

**Result over 4 weeks:**
- Initial debt: 5 ETH ($10,000)
- Final debt: 4.541 ETH ($13,169)
- Debt reduced by: 0.459 ETH using LP fees
- Health factor maintained: Never dropped below 1.17
- Total automation fees: ~$2
- Liquidation risk: Eliminated through automated debt management

## When to Use Auto-Repay

### ✅ Essential Use Cases

**1. All Leveraged Positions**
- ANY position where you've borrowed
- Prevents liquidation automatically
- No-brainer for risk management

**2. Volatile Markets**
- Crypto price swings
- Rapid health factor changes
- Automation responds faster than you can

**3. Delta-Neutral Strategies**
- Borrow to hedge LP positions
- Need to maintain health factor
- Auto-repay uses LP fees to repay hedge

**4. Can't Monitor 24/7**
- You sleep, markets don't
- Traveling, working, living life
- Bot monitors for you

### ❌ When NOT Needed

**1. No Borrowing Positions**
- If you only supply (no debt)
- No health factor risk
- Auto-repay not applicable

**2. Very Conservative Positions**
- Health factor > 3.0
- Extremely over-collateralized
- Liquidation risk essentially zero

**3. Actively Managed**
- You manually monitor constantly
- Prefer direct control
- Understand the risks

## Health Factor Thresholds

### Understanding Trigger vs Target

**Trigger Health Factor:**
- When to START repaying
- Should be above liquidation threshold (1.0)
- Common: 1.2 - 1.5

**Target Health Factor:**
- When to STOP repaying
- Higher than trigger
- Common: 1.5 - 2.0

**Example:**
```
Config: Trigger = 1.3, Target = 1.5

Scenario 1: HF = 1.6
- Above trigger → No action needed

Scenario 2: HF = 1.25
- Below trigger → Start repaying
- Collect fees → Repay debt
- New HF = 1.35 → Still below target, continue if fees available
- Collect more fees → Repay more
- New HF = 1.52 → Above target ✅ Stop repaying

Scenario 3: HF = 1.05
- CRITICAL! Below trigger
- Repay aggressively
- May repay multiple times until HF > target
```

### Recommended Thresholds by Strategy

| Strategy Type | Trigger HF | Target HF | Risk Level |
|---------------|------------|-----------|------------|
| **Conservative** | 1.5 | 2.0 | Very Low |
| **Moderate** | 1.3 | 1.5 | Low |
| **Aggressive** | 1.15 | 1.3 | Medium |
| **Dangerous** | <1.1 | <1.2 | High ⚠️ |

**Recommendation:** Start conservative, adjust based on experience.

## Combining with Other Strategies

### Auto-Repay + Auto-Rebalance

```javascript
// Enable both for leveraged LP positions
await proxy.setStrategyEnabled(lpPositionId, AUTO_REBALANCE, true);
await proxy.setStrategyEnabled(lpPositionId, AUTO_REPAY, true);

// How they work together:
// 1. Auto-rebalance keeps you in range (max fees)
// 2. Auto-repay uses fees to maintain health factor
// 3. Result: Max fee generation + automatic safety
```

### Auto-Repay + Auto-Compound

**Conflicting strategies?** Not quite:

```javascript
// Configuration idea:
// - Auto-repay: Trigger at HF < 1.3
// - Auto-compound: Only when HF > 1.8

// Logic:
// When HF is healthy → Compound fees (growth)
// When HF is risky → Repay debt (safety)

// This requires custom configuration (advanced)
// For now, choose one based on priority
```

**Priority:**
- Safety-first → Auto-repay only
- Growth-first + safe HF → Auto-compound primarily, auto-repay as backup
- Balanced → Both enabled, auto-repay takes precedence

## Technical Details

### Swap Logic

The strategy intelligently swaps collected fees to the debt asset:

```solidity
function _prepareRepayment(
    PositionInfo memory lpPosition,
    PositionInfo memory borrowPosition,
    uint256 amount0,
    uint256 amount1,
    RepayConfig memory config
) private returns (uint256 repayAmount) {
    address debtAsset = borrowPosition.asset;

    // Case 1: Token0 is debt asset
    if (lpPosition.asset == debtAsset) {
        repayAmount = amount0;  // Use token0 directly
        if (amount1 > 0 && lpPosition.secondaryAsset != debtAsset) {
            // Swap token1 to debt asset
            repayAmount += _swapToDebtAsset(
                lpPosition.secondaryAsset,
                debtAsset,
                amount1,
                config
            );
        }
    }
    // Case 2: Token1 is debt asset
    else if (lpPosition.secondaryAsset == debtAsset) {
        repayAmount = amount1;  // Use token1 directly
        if (amount0 > 0) {
            // Swap token0 to debt asset
            repayAmount += _swapToDebtAsset(
                lpPosition.asset,
                debtAsset,
                amount0,
                config
            );
        }
    }
    // Case 3: Neither token is debt asset (swap both)
    else {
        if (amount0 > 0) {
            repayAmount += _swapToDebtAsset(lpPosition.asset, debtAsset, amount0, config);
        }
        if (amount1 > 0) {
            repayAmount += _swapToDebtAsset(lpPosition.secondaryAsset, debtAsset, amount1, config);
        }
    }

    return repayAmount;
}
```

### Gas Optimization

The strategy is gas-efficient:
- Batches collect + swap + repay in one transaction
- Uses delegatecall (no unnecessary token transfers)
- Only executes when health factor requires it
- Smart swap routing via Uniswap V3

## Monitoring

### Check Strategy Status

```javascript
// Check if auto-repay can execute
const [canExecute, reason] = await autoRepayStrategy.canExecuteStrategy(lpPositionId);

if (canExecute) {
    console.log("Auto-repay ready to execute - health factor low!");
} else {
    console.log("Health factor healthy, no repayment needed");
}
```

### View Health Factor

```javascript
// Get current health factor from Aave
const accountData = await aavePool.getUserAccountData(proxyAddress);
const healthFactor = ethers.utils.formatEther(accountData.healthFactor);

console.log(`Current Health Factor: ${healthFactor}`);
console.log(`Total collateral: ${ethers.utils.formatUnits(accountData.totalCollateralBase, 8)}`);
console.log(`Total debt: ${ethers.utils.formatUnits(accountData.totalDebtBase, 8)}`);

if (parseFloat(healthFactor) < 1.5) {
    console.log("⚠️ Warning: Health factor below 1.5");
}
if (parseFloat(healthFactor) < 1.2) {
    console.log("🚨 CRITICAL: Health factor below 1.2!");
}
```

### Repayment History

```javascript
// Get all repayment events
const filter = autoRepayStrategy.filters.DebtRepaid(lpPositionId);
const events = await autoRepayStrategy.queryFilter(filter);

let totalRepaid = ethers.BigNumber.from(0);

events.forEach((event, index) => {
    const { borrowPositionId, asset, amount } = event.args;
    console.log(`\nRepayment ${index + 1}:`);
    console.log(`  Amount: ${ethers.utils.formatEther(amount)} ${asset}`);
    console.log(`  Block: ${event.blockNumber}`);

    totalRepaid = totalRepaid.add(amount);
});

console.log(`\nTotal repaid via automation: ${ethers.utils.formatEther(totalRepaid)} ETH`);
```

## Troubleshooting

### Strategy Not Executing

**Check:**
1. Is health factor below trigger threshold?
2. Are there collectible LP fees?
3. Is the position hierarchy correct? (LP → Borrow → Supply)
4. Is automation enabled?
5. Is the bot approved and whitelisted?

### Repayments Too Frequent

**Adjust configuration:**
- Increase minInterval (e.g., from 1 hour to 6 hours)
- Lower trigger threshold (e.g., from 1.5 to 1.3)
- This reduces automation fees

### Health Factor Still Dropping

**Possible causes:**
- Not enough LP fees to repay fast enough
- Debt asset appreciating too quickly
- Need to manually add collateral or repay debt
- Consider closing position if market conditions extreme

## Key Takeaways

✅ Auto-repay prevents liquidation by using LP fees to repay debt
✅ 0.15% automation fee << 5-10% liquidation penalty
✅ Essential for ANY leveraged position
✅ Configure trigger/target HF based on risk tolerance
✅ Combine with auto-rebalance for maximum safety
✅ Monitor health factor, but let automation handle repayments
✅ Sleep soundly knowing liquidation risk is managed 24/7

---

[Back to Automation Strategies](../README.md)

[Back to Automation Overview](../README.md)
