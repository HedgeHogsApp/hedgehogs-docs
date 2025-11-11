# Strategy Contracts

## What are Strategies?

**Strategies** are automated operations that execute on behalf of users when specific conditions are met. They are the core of Hedgehog's automation system.

**Key characteristics:**
- **Conditional execution** - Only execute when conditions met
- **User-enabled** - Users control which strategies are active per position
- **Bot-triggered** - Bots monitor and execute, users never need to manually trigger
- **Fee-based** - Charge automation fees (0.1-0.3%) on execution

## Strategy Interface

All strategies implement a common interface:

```solidity
interface IStrategy {
    /// @notice Check if strategy can execute for a position
    /// @param positionId The position to check
    /// @return True if strategy should execute
    function canExecuteStrategy(bytes32 positionId) external view returns (bool);

    /// @notice Execute strategy for a position
    /// @param positionId The position to operate on
    function executeStrategy(bytes32 positionId) external;

    /// @notice Get strategy configuration for position
    /// @param positionId The position to query
    /// @return Configuration data (strategy-specific)
    function getConfig(bytes32 positionId) external view returns (bytes memory);

    /// @notice Set strategy configuration for position
    /// @param positionId The position to configure
    /// @param config Configuration data (strategy-specific)
    function setConfig(bytes32 positionId, bytes memory config) external;
}
```

## Available Strategies

### 1. AutoRebalanceStrategy

**Purpose:** Automatically rebalance Uniswap V3 LP positions when price exits range.

**When it executes:**
- Price exits position's tick range
- Position stops earning fees
- Strategy detects and rebalances to new range

**Configuration:**
```solidity
struct RebalanceConfig {
    uint256 priceDeviationBps;  // Trigger when price exits by X%
    uint24 newRangeWidth;       // Width of new range in bps
    uint256 minLiquidityValue;  // Min value to bother rebalancing
    uint24 slippageBps;         // Max slippage tolerance
}
```

**Example:**
```javascript
// Enable auto-rebalance
await proxy.setStrategyEnabled(lpPositionId, AUTO_REBALANCE, true);

// Configure strategy
await autoRebalanceStrategy.setConfig(lpPositionId, {
    priceDeviationBps: 100,      // Trigger when 1% out of range
    newRangeWidth: 2000,         // New range: ±20%
    minLiquidityValue: 1000e6,   // Min $1,000 to rebalance
    slippageBps: 50              // 0.5% max slippage
});
```

**Execution flow:**
```
1. Bot calls canExecuteStrategy(lpPositionId)
   └─ Strategy checks current price vs position range
   └─ Returns true if price outside range + min liquidity met

2. Bot calls executeStrategy(lpPositionId)
   └─ Strategy decreases liquidity from old position
   └─ Strategy collects tokens
   └─ Strategy swaps to maintain desired ratio
   └─ Strategy mints new position in current range
   └─ Automation fee collected (0.1%)
   └─ Event emitted
```

**Benefits:**
- Never miss fees due to range exit
- Automatic recentering around current price
- Lower cost than manual rebalancing ($0.50 vs $30 gas)

### 2. AutoCompoundStrategy

**Purpose:** Reinvest LP fees back into position for compound growth.

**When it executes:**
- Accumulated fees exceed minimum threshold
- Gas cost < X% of fees collected (profit check)

**Configuration:**
```solidity
struct CompoundConfig {
    uint256 minFeesValue;       // Min fees value to compound (in USD)
    uint256 compoundFrequency;  // Min time between compounds (seconds)
    uint24 slippageBps;         // Max slippage for swaps
    bool autoRebalance;         // Rebalance range when compounding
}
```

**Example:**
```javascript
await proxy.setStrategyEnabled(lpPositionId, AUTO_COMPOUND, true);

await autoCompoundStrategy.setConfig(lpPositionId, {
    minFeesValue: 100e6,         // Compound when $100+ fees
    compoundFrequency: 86400,    // Max once per day
    slippageBps: 100,            // 1% max slippage
    autoRebalance: false         // Don't change range
});
```

**Execution flow:**
```
1. Bot detects fees > minFeesValue
2. executeStrategy():
   └─ Collect fees from Uniswap position
   └─ Calculate current position ratio
   └─ Swap fees to maintain ratio (if needed)
   └─ Increase liquidity with collected fees
   └─ Automation fee collected (0.2%)
   └─ Emit CompoundExecuted event
```

**Math example:**
```
LP position: ETH-USDC
Current ratio: 1 ETH per $2,000 USDC (50/50 value)
Fees collected: 0.05 ETH + $80 USDC

Fee value: $180 ($100 ETH + $80 USDC)

To maintain 50/50:
- Need: $90 ETH + $90 USDC
- Have: $100 ETH + $80 USDC
- Swap: $10 ETH → USDC

Result: $90 ETH + $90 USDC added to position
Automation fee: $0.36 (0.2% of $180)
Net added: $179.64
```

### 3. AutoRepayStrategy

**Purpose:** Use LP fees to automatically repay debt and maintain health factor.

**When it executes:**
- Health factor drops below configured threshold (e.g., 1.3)
- Accumulated fees sufficient to improve health factor

**Configuration:**
```solidity
struct RepayConfig {
    uint256 triggerHealthFactor;  // Trigger when HF < this (e.g., 1.3)
    uint256 targetHealthFactor;   // Repay to reach this HF (e.g., 1.5)
    uint256 maxRepayPercentage;   // Max % of debt to repay per tx
    uint24 swapPoolFee;           // Uniswap fee tier for swaps
    uint256 minAmountOut;         // Min tokens from swap (slippage)
    bool useATokens;              // Use aTokens if available
}
```

**Example:**
```javascript
await proxy.setStrategyEnabled(lpPositionId, AUTO_REPAY, true);

await autoRepayStrategy.setConfig(lpPositionId, {
    triggerHealthFactor: ethers.utils.parseEther("1.3"),
    targetHealthFactor: ethers.utils.parseEther("1.5"),
    maxRepayPercentage: 5000,    // Max 50% per transaction
    swapPoolFee: 3000,           // 0.3% Uniswap pool
    minAmountOut: 0,             // Calculate dynamically
    useATokens: false
});
```

**Execution flow:**
```
1. Monitor health factor
   └─ Bot calls canExecuteStrategy()
   └─ Strategy checks: HF < triggerHealthFactor?
   └─ Returns true if triggered

2. executeStrategy():
   └─ Get LP position (linked to borrow)
   └─ Get borrow position (linked to supply)
   └─ Calculate repay amount to reach targetHealthFactor
   └─ Collect LP fees
   └─ Swap fees to debt asset (if needed)
   └─ Repay debt on Aave
   └─ Automation fee collected (0.15%)
   └─ Verify new health factor > target
```

**Example:**
```
Initial state:
- Supply: $10,000 USDC
- Borrow: $6,000 ETH (at $2,000/ETH = $12,000 value... wait, that's overleveraged!)
- Actually: Borrow 3 ETH ($6,000 value)
- Health Factor: ($10,000 * 0.825) / $6,000 = 1.375

Correct example:
- Supply: $10,000 USDC
- Borrow: 3 ETH ($6,000 value at $2,000/ETH)
- LP: 3 ETH + $6,000 USDC earning fees
- HF: ($10,000 * 0.825) / $6,000 = 1.375

Price drops 15% to $1,700/ETH:
- Borrow value: still 3 ETH = $5,100
- HF: ($10,000 * 0.825) / $5,100 = 1.62 (improved!)

Wait, debt value decreases when ETH drops? No!

Correct again:
When you borrow ETH and price drops:
- You owe 3 ETH (unchanged)
- 3 ETH now worth $5,100 (decreased)
- Your collateral: still $10,000 USDC
- HF: $8,250 / $5,100 = 1.62 (BETTER)

The risk is when collateral drops OR borrow asset appreciates:

ETH rises to $2,500:
- Borrow value: 3 ETH = $7,500
- HF: $8,250 / $7,500 = 1.1 (DANGER!)

Auto-repay triggers:
- Collect LP fees: 0.2 ETH + $200 USDC
- Swap USDC to ETH: $200 → ~0.08 ETH
- Total: 0.28 ETH
- Repay 0.28 ETH
- New debt: 2.72 ETH = $6,800
- New HF: $8,250 / $6,800 = 1.21 (better, but still need more)

Continue compounding + repaying until HF > 1.5
```

### 4. AutoCollateralizeStrategy

**Purpose:** Convert LP fees into additional collateral to improve health factor.

**When it executes:**
- Scheduled basis (e.g., weekly)
- OR health factor below threshold
- Accumulated fees exceed minimum

**Configuration:**
```solidity
struct CollateralizeConfig {
    uint256 frequency;          // Min seconds between executions
    uint256 minFeesValue;       // Min fees to collateralize
    address collateralAsset;    // Asset to convert to
    uint24 swapPoolFee;         // Uniswap fee tier
    bool compoundCollateral;    // Resupply to Aave or keep liquid
}
```

**Example:**
```javascript
await proxy.setStrategyEnabled(lpPositionId, AUTO_COLLATERALIZE, true);

await autoCollateralizeStrategy.setConfig(lpPositionId, {
    frequency: 604800,           // Once per week
    minFeesValue: 200e6,         // Min $200 fees
    collateralAsset: USDC,       // Convert to USDC
    swapPoolFee: 3000,           // 0.3%
    compoundCollateral: true     // Supply to Aave
});
```

**Execution flow:**
```
1. Time-based or HF-based trigger
2. executeStrategy():
   └─ Collect LP fees
   └─ Swap all fees to collateralAsset
   └─ Supply to Aave (if compoundCollateral)
   └─ OR keep liquid in proxy
   └─ Automation fee collected (0.15%)
   └─ Health factor improves
```

### 5. AutoHarvestStrategy

**Purpose:** Claim rewards from protocols and reinvest.

**When it executes:**
- Claimable rewards exceed gas cost threshold
- Protocol has pending rewards

**Configuration:**
```solidity
struct HarvestConfig {
    address[] rewardTokens;      // Tokens to claim
    uint256 minRewardValue;      // Min value to claim
    bool autoCompound;           // Reinvest into position
    address[] swapPath;          // Path to swap rewards
    uint24 swapPoolFee;          // Uniswap fee tier
}
```

**Example:**
```javascript
await proxy.setStrategyEnabled(farmPositionId, AUTO_HARVEST, true);

await autoHarvestStrategy.setConfig(farmPositionId, {
    rewardTokens: [UNI, ARB],
    minRewardValue: 50e6,        // Min $50 to claim
    autoCompound: true,          // Reinvest into LP
    swapPath: [UNI, WETH, USDC], // Swap path
    swapPoolFee: 3000            // 0.3%
});
```

**Execution flow:**
```
1. Check claimable rewards > minRewardValue
2. executeStrategy():
   └─ Claim rewards from protocol
   └─ Swap rewards to LP tokens (if autoCompound)
   └─ Increase liquidity (if autoCompound)
   └─ OR keep rewards liquid
   └─ Automation fee collected (0.2%)
```

## Strategy Execution Architecture

### Bot Monitoring Loop

```python
# Pseudo-code for bot
while True:
    # Get all proxies with enabled strategies
    proxies = get_proxies_with_strategies()

    for proxy in proxies:
        positions = proxy.get_active_positions()

        for position in positions:
            strategies = proxy.get_enabled_strategies(position)

            for strategy in strategies:
                # Check if strategy should execute
                can_execute = strategy.can_execute_strategy(position)

                if can_execute:
                    # Estimate profit
                    gas_cost = estimate_gas(strategy, position)
                    fee_revenue = estimate_fees(strategy, position)

                    if fee_revenue > gas_cost * 1.5:  # 50% profit margin
                        # Execute strategy
                        tx = strategy.execute_strategy(position)
                        print(f"Executed {strategy} for {position}: {tx.hash}")
                    else:
                        print(f"Skipping {strategy} for {position}: Not profitable")

    time.sleep(12)  # Check every block
```

### Multi-Bot Competition

Multiple bots can monitor and execute:

```
Bot A: Monitors all positions, fast execution
Bot B: Focuses on profitable positions only
Bot C: User's own bot (priority via gas price)

Competition ensures:
- Fast execution (bots compete for fees)
- No single point of failure
- User can run own bot for guaranteed execution
```

## Strategy Development

### Creating a New Strategy

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IStrategy} from "../interfaces/IStrategy.sol";
import {HHStorageLib} from "../libraries/HHStorageLib.sol";
import {FeesLib} from "../libraries/FeesLib.sol";

contract NewStrategy is IStrategy {
    // Strategy-specific configuration
    struct Config {
        uint256 someParameter;
        address someAddress;
        bool someFlag;
    }

    // Store config per position
    mapping(bytes32 => Config) public configs;

    function canExecuteStrategy(bytes32 positionId) external view override returns (bool) {
        // Get position data
        Position memory position = HHStorageLib.getPosition(positionId);

        // Get strategy config
        Config memory config = configs[positionId];

        // Check conditions
        bool condition1 = checkSomeCondition(position);
        bool condition2 = checkAnotherCondition(config);

        return condition1 && condition2;
    }

    function executeStrategy(bytes32 positionId) external override {
        // Verify can execute
        require(canExecuteStrategy(positionId), "Cannot execute");

        // Get config
        Config memory config = configs[positionId];

        // Execute strategy logic
        // ... do something useful ...

        // Collect automation fee
        uint256 fee = FeesLib.collectAutomationFee("newStrategy", token, amount);

        // Emit event
        emit StrategyExecuted(positionId, amount, fee);
    }

    function getConfig(bytes32 positionId) external view override returns (bytes memory) {
        return abi.encode(configs[positionId]);
    }

    function setConfig(bytes32 positionId, bytes memory configData) external override {
        Config memory config = abi.decode(configData, (Config));
        configs[positionId] = config;
        emit ConfigUpdated(positionId);
    }

    // Helper functions
    function checkSomeCondition(Position memory position) internal view returns (bool) {
        // Implementation
    }

    function checkAnotherCondition(Config memory config) internal view returns (bool) {
        // Implementation
    }
}
```

## Key Takeaways

✅ Strategies automate complex DeFi operations
✅ User-enabled, bot-executed, fee-based model
✅ Common interface: canExecute + executeStrategy + config
✅ 5 core strategies: Rebalance, Compound, Repay, Collateralize, Harvest
✅ Multi-bot competition ensures decentralized execution
✅ Template-driven development for new strategies

---

[Next: Directory System →](directories.md)

[Back to Smart Contracts](README.md)
