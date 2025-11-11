# Configuring Automated Strategies

## Overview

Hedgehog Protocol allows you to enable and configure automation strategies for each position individually. This guide explains how to set up, customize, and manage automated strategies for your DeFi positions.

## Strategy Configuration Basics

### Enabling a Strategy

Each position can have multiple strategies enabled simultaneously. Strategies are configured through your HH proxy contract:

```javascript
// Enable auto-compound on a Uniswap V3 LP position
await proxy.setStrategyEnabled(positionId, AUTO_COMPOUND_STRATEGY, true);

// Enable multiple strategies on the same position
await proxy.setStrategyEnabled(positionId, AUTO_REBALANCE_STRATEGY, true);
await proxy.setStrategyEnabled(positionId, AUTO_COMPOUND_STRATEGY, true);
```

### Disabling a Strategy

You can disable automation at any time without affecting your position:

```javascript
// Disable auto-compound
await proxy.setStrategyEnabled(positionId, AUTO_COMPOUND_STRATEGY, false);

// Your position remains active, but the bot will no longer execute this strategy
```

## Configuration Patterns

### Pattern 1: Basic Configuration

The simplest approach - enable with default settings:

```javascript
// Enable with defaults
await proxy.setStrategyEnabled(positionId, AUTO_REBALANCE_STRATEGY, true);

// The strategy uses default parameters:
// - Moderate risk tolerance
// - Standard slippage protection
// - Reasonable execution frequency
```

### Pattern 2: Custom Configuration

Fine-tune strategy parameters for your specific needs:

```javascript
// Configure auto-rebalance with custom parameters
const rebalanceConfig = {
    priceDeviationTolerance: 500,      // 5% deviation before rebalancing
    tickRangeMultiplier: 100,          // ±10% range width
    swapPoolFee: 3000,                 // 0.3% Uniswap fee tier
    slippageTolerance: 100,            // 1% max slippage
    maintainLiquidity: true,           // Keep same liquidity amount
    minRebalanceInterval: 21600        // Min 6 hours between rebalances
};

await autoRebalanceStrategy.configureStrategy(
    positionId,
    ethers.utils.defaultAbiCoder.encode(
        ["tuple(uint256,int24,uint24,uint256,bool,uint256)"],
        [Object.values(rebalanceConfig)]
    )
);

// Then enable the strategy
await proxy.setStrategyEnabled(positionId, AUTO_REBALANCE_STRATEGY, true);
```

### Pattern 3: Update Existing Configuration

Modify parameters without disabling the strategy:

```javascript
// Update configuration while strategy remains active
const updatedConfig = {
    ...existingConfig,
    tickRangeMultiplier: 150,  // Widen range during volatile markets
    minRebalanceInterval: 43200 // Reduce frequency to 12 hours
};

await autoRebalanceStrategy.configureStrategy(positionId, encodedConfig);

// Strategy continues running with new parameters
```

## Strategy-Specific Configuration

### Auto-Rebalance Configuration

**When to configure:**
- Market volatility changes
- Gas costs fluctuate
- Want to optimize fee generation vs rebalancing costs

**Key parameters:**
```javascript
{
    priceDeviationTolerance: 500,   // How far out of range before triggering
    tickRangeMultiplier: 100,       // Width of new range
    swapPoolFee: 3000,              // Uniswap pool fee tier
    slippageTolerance: 100,         // Max acceptable slippage
    maintainLiquidity: true,        // Keep same liquidity amount
    minRebalanceInterval: 21600     // Minimum time between rebalances
}
```

**Configuration examples:**
- **High volatility**: Wider ranges (tickRangeMultiplier: 200), less frequent (minInterval: 43200)
- **Low volatility**: Narrower ranges (tickRangeMultiplier: 50), more frequent (minInterval: 3600)
- **High gas costs**: Increase minRebalanceInterval to reduce rebalancing frequency

### Auto-Compound Configuration

**When to configure:**
- Position size changes significantly
- Want to optimize compounding frequency
- Adjust based on fee generation rate

**Key parameters:**
```javascript
{
    minCompoundAmount: 100e6,    // Min $100 in fees before compounding
    swapPoolFee: 3000,           // Pool fee for swaps
    slippageTolerance: 100,      // 1% slippage tolerance
    maintainRatio: true          // Maintain token ratio or use as-is
}
```

**Configuration examples:**
- **Small position (<$5K)**: minCompoundAmount: 50e6 (compound at $50)
- **Large position (>$50K)**: minCompoundAmount: 500e6 (compound at $500)
- **High APY pool**: Lower threshold for more frequent compounding
- **Low APY pool**: Higher threshold to reduce automation costs

### Auto-Repay Configuration

**When to configure:**
- Health factor approaching liquidation threshold
- Want to maintain specific HF level
- Debt composition changes

**Key parameters:**
```javascript
{
    maxRepayPercentage: 10000,   // Max 100% of fees can be used for repayment
    swapPoolFee: 3000,           // Pool fee for token swaps
    minAmountOut: 0,             // Minimum output from swaps
    useATokens: false            // Whether to use aTokens for repayment
}
```

**Configuration examples:**
- **Conservative**: Target HF 2.0+, use 100% of fees for repayment
- **Balanced**: Target HF 1.5-2.0, use 50-75% of fees
- **Aggressive**: Target HF 1.3-1.5, use 25-50% of fees

### Auto-Collateralize Configuration

**When to configure:**
- Building up collateral base
- Preparing to increase leverage
- Want to improve HF through collateral instead of debt repayment

**Key parameters:**
```javascript
{
    targetCollateralAsset: USDC,             // Asset to convert fees to
    swapPoolFee: 3000,                       // Pool fee for swaps
    minAmountOut: 0,                         // Slippage protection
    targetHealthFactor: ethers.utils.parseEther("2.0"),  // Target HF
    onlyWhenBelowTarget: true                // Only execute when HF < target
}
```

**Configuration examples:**
- **Safety mode**: targetHF: 2.0, onlyWhenBelowTarget: true
- **Growth mode**: targetHF: 1.5, onlyWhenBelowTarget: false (always add collateral)
- **Preparation mode**: High target, always execute to build collateral base

### Auto-Harvest Configuration

**When to configure:**
- Want regular income stream
- Treasury management for DAOs
- Tax optimization needs

**Key parameters:**
```javascript
{
    targetAddress: userWallet,               // Where to send rewards
    targetToken: USDC,                       // Token to convert to (or 0x0 for no conversion)
    swapPoolFee: 3000,                       // Pool fee for conversions
    minAmountOut: 0                          // Slippage protection
}
```

**Configuration examples:**
- **Income stream**: targetAddress: personal wallet, targetToken: USDC
- **DAO treasury**: targetAddress: multisig, targetToken: treasury token
- **No conversion**: targetToken: address(0), receive both tokens as-is

## Multi-Strategy Configuration

### Compatible Strategy Combinations

Some strategies work exceptionally well together:

**Combination 1: Auto-Rebalance + Auto-Compound**
```javascript
// Best for: Maximizing LP returns
await proxy.setStrategyEnabled(positionId, AUTO_REBALANCE_STRATEGY, true);
await proxy.setStrategyEnabled(positionId, AUTO_COMPOUND_STRATEGY, true);

// Result: Always in range earning fees + fees reinvested for compound growth
```

**Combination 2: Auto-Rebalance + Auto-Repay**
```javascript
// Best for: Leveraged LP positions
await proxy.setStrategyEnabled(positionId, AUTO_REBALANCE_STRATEGY, true);
await proxy.setStrategyEnabled(positionId, AUTO_REPAY_STRATEGY, true);

// Result: Maximize fee generation + use fees to maintain safe health factor
```

**Combination 3: Auto-Compound + Auto-Repay**
```javascript
// Best for: Balanced leveraged growth
await autoRepayStrategy.configureStrategy(positionId, repayConfig);
await autoCompoundStrategy.configureStrategy(positionId, compoundConfig);

await proxy.setStrategyEnabled(positionId, AUTO_REPAY_STRATEGY, true);
await proxy.setStrategyEnabled(positionId, AUTO_COMPOUND_STRATEGY, true);

// Note: Configure auto-repay to use only portion of fees
// Remaining fees go to compound
// Result: Maintain health factor while growing position
```

### Incompatible Strategies

Some strategies conflict and should not be enabled together:

**Auto-Harvest + Auto-Compound**
- Harvest sends fees to wallet
- Compound reinvests fees into position
- Conflicting destinations

**Auto-Harvest + Auto-Repay**
- Harvest sends fees to wallet
- Repay uses fees for debt repayment
- Conflicting uses of fees

**Auto-Collateralize + Auto-Repay**
- Collateralize converts fees to collateral
- Repay converts fees to debt token
- Both can work, but choose based on whether you want to reduce debt or increase collateral

## Monitoring and Adjusting Configuration

### Check Current Configuration

```javascript
// Get auto-rebalance config
const config = await autoRebalanceStrategy.getRebalanceConfig(positionId);
console.log("Current rebalance config:", config);

// Get auto-compound config
const compoundConfig = await autoCompoundStrategy.getCompoundConfig(positionId);
console.log("Current compound config:", compoundConfig);
```

### Check Strategy Status

```javascript
// Check if strategy can execute
const [canExecute, reason] = await autoRebalanceStrategy.canExecuteStrategy(positionId);

if (canExecute) {
    console.log("Strategy ready to execute");
} else {
    console.log(`Cannot execute. Reason code: ${reason}`);
    // Reason codes defined in BaseStrategy:
    // 1 = Position inactive
    // 2 = Strategy disabled
    // 3 = Below threshold
    // 4 = Cooldown active
    // 5 = Invalid protocol
    // 6 = No rewards
}
```

### Adaptive Configuration

Adjust configuration based on market conditions:

```javascript
// During high volatility
const volatileConfig = {
    ...baseConfig,
    tickRangeMultiplier: 200,      // Wider ranges
    minRebalanceInterval: 43200,   // Less frequent rebalancing
    slippageTolerance: 200         // Higher slippage tolerance
};

// During stable markets
const stableConfig = {
    ...baseConfig,
    tickRangeMultiplier: 75,       // Narrower ranges
    minRebalanceInterval: 7200,    // More frequent rebalancing
    slippageTolerance: 50          // Tighter slippage
};

// Update configuration based on current market
await autoRebalanceStrategy.configureStrategy(positionId, currentMarketConfig);
```

## Best Practices

### 1. Start Conservative

When first enabling automation:
- Use default or conservative configurations
- Monitor performance for a few cycles
- Gradually optimize based on results

### 2. Consider Gas Costs

Automation fees are low, but execution frequency matters:
- High frequency strategies cost more in aggregate
- Balance execution frequency vs optimization gains
- During high gas periods, increase minInterval parameters

### 3. Monitor Execution History

Track strategy executions to optimize:
```javascript
// Get rebalance history
const filter = autoRebalanceStrategy.filters.PositionRebalanced(positionId);
const events = await autoRebalanceStrategy.queryFilter(filter);

// Analyze frequency, costs, and results
events.forEach(event => {
    console.log(`Rebalanced at block ${event.blockNumber}`);
    // Adjust configuration if rebalancing too frequently or infrequently
});
```

### 4. Test Configuration Changes

Before major configuration changes:
- Calculate expected impact
- Consider worst-case scenarios
- Have a plan to revert if needed

### 5. Secure Automation Access

The approved address (bot) can execute strategies:
- Only approve trusted bot operators
- Can remove approval at any time via `setApproved(address(0))`
- User (owner) always retains full control

## Troubleshooting Configuration Issues

### Strategy Not Executing

**Check these:**
1. Is the strategy enabled? `await proxy.strategyEnabled(positionId, strategyAddress)`
2. Is bot approved? `await proxy.approved()`
3. Does configuration meet execution conditions?
4. Has cooldown period passed?
5. Is position still active?

### Unexpected Behavior

**Review configuration:**
```javascript
// Verify all parameters
const config = await strategy.getConfig(positionId);
console.log("Current configuration:", config);

// Compare with intended configuration
// Look for typos, wrong units, or misunderstood parameters
```

### Performance Not Meeting Expectations

**Optimization steps:**
1. Review execution history and frequency
2. Calculate actual costs vs benefits
3. Adjust thresholds and intervals
4. Consider market conditions and volatility
5. Test different parameter combinations

## Key Takeaways

✅ Each strategy has independent configuration parameters
✅ Strategies can be enabled/disabled without affecting positions
✅ Configuration can be updated while strategies are active
✅ Some strategies work well together, others conflict
✅ Start conservative, optimize based on performance
✅ Monitor execution history to refine configuration
✅ Adjust configuration based on market conditions
✅ Always maintain control - you're the owner, bot is just approved executor

---

[Back to Automation Overview](./README.md)
