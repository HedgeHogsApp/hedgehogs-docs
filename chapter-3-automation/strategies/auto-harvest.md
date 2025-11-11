# Auto-Harvest Strategy

## Overview

**Auto-Harvest** automatically collects fees and rewards from your positions and sends them to a specified address - optionally converting them to a preferred token.

## The Problem

DeFi rewards accumulate but don't automatically reach your wallet:

**Without Auto-Harvest:**
```
Week 1: $150 fees accumulated in LP position
Week 2: $300 total fees
Week 3: $450 total fees
Week 4: You manually collect: Pay $20 gas
Result: $430 net after gas, but required manual action
```

**With Auto-Harvest:**
```
Week 1: $150 fees → Bot collects → Sent to your wallet
Week 2: $150 fees → Bot collects → Sent to your wallet
Week 3: $150 fees → Bot collects → Sent to your wallet
Week 4: $150 fees → Bot collects → Sent to your wallet
Total automation fees: $600 * 0.002 = $1.20
Net received: $598.80
Plus: Automatic, no manual work
```

## How It Works

### Detection

The bot monitors for collectible rewards:

```solidity
function canExecuteStrategy(bytes32 positionId) external view returns (bool) {
    // Get position
    PositionInfo memory position = getPosition(positionId);

    // Check cooldown
    if (block.timestamp - lastHarvest < minHarvestInterval) {
        return false;
    }

    // Check if position has collectible rewards
    // For Uniswap V3: Check if fees accumulated
    // For other protocols: Check specific reward mechanisms

    if (position.amount == 0) return false;

    // In production: Query actual collectible amounts
    // Return true if collectible amount > minHarvestAmount

    return true;
}
```

### Execution Flow

When triggered:

```
1. Collect Rewards
   └─ Protocol-specific collection
   └─ Uniswap V3: Collect fees from NFT position
   └─ Aave: Claim incentive rewards (if available)
   └─ Example: 0.1 ETH + $180 USDC collected

2. Check Target Token
   └─ Get configuration
   └─ targetToken = USDC (example)
   └─ If targetToken = address(0): No conversion

3. Convert if Needed
   └─ Token0 (ETH) ≠ target (USDC)? Swap it
   └─ Token1 (USDC) = target? Keep it
   └─ Example: Swap 0.1 ETH → $200 USDC
   └─ Total: $200 + $180 = $380 USDC

4. Collect Automation Fee
   └─ 0.2% of harvested value
   └─ Example: $380 * 0.002 = $0.76

5. Transfer to Target Address
   └─ Send $379.24 USDC to configured address
   └─ Usually your wallet or treasury
   └─ Emit RewardsHarvested event
```

## Configuration

### HarvestConfig Structure

```solidity
struct HarvestConfig {
    address targetAddress;      // Where to send rewards
    address targetToken;        // Token to convert to (0 = no conversion)
    uint24 swapPoolFee;        // Uniswap pool fee for swaps
    uint256 minAmountOut;      // Slippage protection
}
```

### Configuration Examples

**Basic Harvest (No Conversion):**
```javascript
await autoHarvestStrategy.configureStrategy(lpPositionId, {
    targetAddress: userWallet,              // Your wallet
    targetToken: ethers.constants.AddressZero,  // No conversion
    swapPoolFee: 0,                        // Not needed if no swap
    minAmountOut: 0                        // Not needed if no swap
});

// Result: Collects fees as-is, sends both token0 and token1 to wallet
// Example: 0.05 ETH and $100 USDC both sent to your wallet
```

**Convert Everything to Stablecoin:**
```javascript
await autoHarvestStrategy.configureStrategy(lpPositionId, {
    targetAddress: userWallet,
    targetToken: USDC,                     // Convert all to USDC
    swapPoolFee: 3000,                     // 0.3% Uniswap pool
    minAmountOut: 0                        // Dynamic slippage
});

// Result: Converts both tokens to USDC, sends total USDC to wallet
// Example: 0.05 ETH + $100 USDC → All converted to $200 USDC → Sent to wallet
```

**Harvest to Treasury:**
```javascript
await autoHarvestStrategy.configureStrategy(lpPositionId, {
    targetAddress: treasuryMultisig,       // Treasury address
    targetToken: DAI,                      // Convert to DAI
    swapPoolFee: 3000,
    minAmountOut: 0
});

// Result: Automatic treasury accumulation
// Best for: DAOs, protocols, businesses
```

**Harvest to Other Protocol:**
```javascript
await autoHarvestStrategy.configureStrategy(lpPositionId, {
    targetAddress: aaveATokenAddress,      // Directly to Aave
    targetToken: USDC,
    swapPoolFee: 3000,
    minAmountOut: 0
});

// Result: Harvested rewards auto-supplied to Aave
// Note: Target address must be able to receive tokens
```

## Fee Structure

**Automation fee:** 0.2% of harvested value

**Example:**
```
LP fees: 0.08 ETH + $130 USDC
Value: $160 + $130 = $290
Automation fee: $290 * 0.002 = $0.58
Net harvested: $289.42

Manual alternative:
- Gas to collect: $15-20
- Time to manually collect: 5-10 minutes
- Manual conversion (if desired): Additional gas + time

Savings: ~$15-20 in gas + your time
```

## Use Cases

### Use Case 1: Regular Income Stream

**Scenario:**
```
You provide liquidity to earn regular income:
- LP position: $100,000 ETH-USDC
- APY: 35% from fees
- Monthly fees: ~$2,900

Enable auto-harvest:
- targetAddress: Your personal wallet
- targetToken: USDC
- Frequency: Weekly

Result:
- Every week: ~$725 USDC harvested to your wallet
- Automatic income stream
- No manual work
- Perfect for: Living off DeFi income
```

### Use Case 2: DAO Treasury Accumulation

**Scenario:**
```
DAO has protocol-owned liquidity:
- Multiple LP positions across protocols
- Want to accumulate treasury

Enable auto-harvest on all positions:
- targetAddress: DAO multisig
- targetToken: USDC (treasury wants stables)
- Frequency: Daily

Result:
- Daily accumulation to treasury
- Automatic accounting (events for tracking)
- Reduced operational overhead
- Perfect for: Protocol treasuries, DAOs
```

### Use Case 3: Auto-Reinvest to Another Protocol

**Scenario:**
```
Complex strategy:
- Earn fees from Uniswap V3 LP
- Want to auto-supply to Aave
- Compound growth across protocols

Setup (requires custom integration):
- targetAddress: Your proxy address
- targetToken: USDC
- Then: Separate automation to supply to Aave

Result:
- Harvest from Uniswap
- Auto-supply to Aave
- Cross-protocol compounding
```

### Use Case 4: Tax-Optimized Harvesting

**Scenario:**
```
You want to track income for taxes:
- Harvest to a separate "income" wallet
- Clear separation from principal
- Easier tax reporting

Enable auto-harvest:
- targetAddress: Dedicated income wallet
- targetToken: USDC (for simplicity)

Result:
- All rewards in one wallet
- Clear income vs principal separation
- Simplified tax reporting
```

## When to Use Auto-Harvest

### ✅ Good Use Cases

**1. Regular Income**
- Using DeFi for income
- Want rewards in wallet regularly
- Prefer liquid rewards over compounding

**2. Treasury Management**
- DAO or protocol with POL (Protocol-Owned Liquidity)
- Need to accumulate fees
- Want automated accounting

**3. Tax Simplification**
- Harvest to dedicated wallet
- Clear income tracking
- Easier tax reporting

**4. Position Closing Preparation**
- Planning to exit position
- Don't want to leave fees unclaimed
- Harvest to wallet before closing

### ❌ When NOT to Use

**1. Want Maximum Growth**
- Use auto-compound instead
- Compounding beats harvesting for growth
- Harvesting removes capital from position

**2. Small Positions**
- <$5,000 positions
- Fees too small to justify harvest frequency
- Manual collection at exit better

**3. Gas-Sensitive**
- During high gas periods
- Automation fee may exceed value
- Pause or increase harvest threshold

**4. Leveraged Positions**
- If you've borrowed
- Better to use auto-repay or auto-collateralize
- Maintain health factor over taking income

## Comparison with Other Strategies

| Strategy | Where Rewards Go | Effect on Position | Best For |
|----------|------------------|-------------------|----------|
| **Auto-Harvest** | To your wallet | Reduces growth | Income seekers |
| **Auto-Compound** | Back to position | Maximizes growth | Long-term holders |
| **Auto-Repay** | Repay debt | Reduces leverage | Leveraged positions |
| **Auto-Collateralize** | Increase collateral | Strengthens position | Safety-focused |

**Choose based on your goals:**
- Income now → Auto-harvest
- Growth later → Auto-compound
- Safety → Auto-repay or auto-collateralize

## Advanced: Partial Harvesting

**Idea:** Harvest some, compound the rest

```javascript
// This requires custom setup:
// Position 1: 70% of capital
// - Enable auto-compound

// Position 2: 30% of capital
// - Enable auto-harvest

// Result: 70% compounds, 30% harvested to wallet
// Balanced approach: Growth + income
```

Or use smart contract logic:
```solidity
// Future feature: Harvest ratio
struct HarvestConfig {
    address targetAddress;
    address targetToken;
    uint24 swapPoolFee;
    uint256 minAmountOut;
    uint256 harvestRatio;  // e.g., 3000 = harvest 30%, compound 70%
}
```

## Technical Details

### Protocol-Specific Harvesting

**Uniswap V3:**
```solidity
function _harvestUniswapV3(bytes32 positionId, ...) private returns (bool) {
    // Get NFT token ID
    uint256 tokenId = getTokenId(positionId);

    // Collect all fees
    bytes memory collectData = abi.encodeWithSelector(
        UniswapV3Connector.collectFees.selector,
        tokenId,
        type(uint128).max,  // Collect all token0
        type(uint128).max   // Collect all token1
    );

    (bool success, bytes memory result) = connector.delegatecall(collectData);
    (uint256 amount0, uint256 amount1) = abi.decode(result, (uint256, uint256));

    // Process rewards
    _processReward(positionId, token0, amount0, config);
    _processReward(positionId, token1, amount1, config);

    return true;
}
```

**Aave V3:**
```solidity
function _harvestAaveV3(bytes32 positionId, ...) private returns (bool) {
    // Aave V3 has incentive rewards (if configured)
    // Claim via IncentivesController

    // This is protocol-specific and may not always be available
    // For now, returns false as Aave harvesting is different

    return false;
}
```

### Conversion Logic

```solidity
function _processReward(
    bytes32 positionId,
    address token,
    uint256 amount,
    HarvestConfig memory config
) private {
    if (amount == 0) return;

    // Check if conversion needed
    if (config.targetToken != address(0) && config.targetToken != token) {
        // Swap token to target token
        uint256 amountOut = _swapReward(
            token,
            config.targetToken,
            amount,
            config.swapPoolFee,
            config.minAmountOut
        );

        emit RewardsConverted(positionId, token, config.targetToken, amount, amountOut);

        // Transfer converted tokens
        _safeTransfer(config.targetToken, config.targetAddress, amountOut);
        emit RewardsHarvested(positionId, config.targetToken, amountOut, config.targetAddress);
    } else {
        // Direct transfer without conversion
        _safeTransfer(token, config.targetAddress, amount);
        emit RewardsHarvested(positionId, token, amount, config.targetAddress);
    }
}
```

## Monitoring

### Check Harvest Status

```javascript
const [canExecute, reason] = await autoHarvestStrategy.canExecuteStrategy(lpPositionId);

if (canExecute) {
    console.log("Rewards ready to harvest!");
} else {
    console.log("No rewards or cooldown active");
}
```

### View Configuration

```javascript
const config = await autoHarvestStrategy.getHarvestConfig(lpPositionId);

console.log(`Target address: ${config.targetAddress}`);
console.log(`Target token: ${config.targetToken}`);
console.log(`Swap pool fee: ${config.swapPoolFee / 10000}%`);
```

### Harvest History

```javascript
const filter = autoHarvestStrategy.filters.RewardsHarvested(lpPositionId);
const events = await autoHarvestStrategy.queryFilter(filter);

let totalHarvested = {};

events.forEach((event, index) => {
    const { token, amount, recipient } = event.args;
    console.log(`\nHarvest ${index + 1}:`);
    console.log(`  Token: ${token}`);
    console.log(`  Amount: ${ethers.utils.formatUnits(amount, 18)}`);
    console.log(`  Sent to: ${recipient}`);
    console.log(`  Block: ${event.blockNumber}`);

    // Accumulate totals
    if (!totalHarvested[token]) {
        totalHarvested[token] = ethers.BigNumber.from(0);
    }
    totalHarvested[token] = totalHarvested[token].add(amount);
});

console.log(`\n=== Total Harvested ===`);
Object.entries(totalHarvested).forEach(([token, amount]) => {
    console.log(`${token}: ${ethers.utils.formatUnits(amount, 18)}`);
});
```

## Troubleshooting

### No Harvests Happening

**Check:**
1. Are there collectible fees available?
2. Has cooldown period passed?
3. Is automation enabled?
4. Is target address valid?
5. Is bot approved and whitelisted?

### Receiving Wrong Token

**Issue:** Wanted USDC, receiving ETH and USDC

**Solution:**
```javascript
// Make sure targetToken is set
const config = await autoHarvestStrategy.getHarvestConfig(lpPositionId);

if (config.targetToken === ethers.constants.AddressZero) {
    // Not converting! Update config:
    await autoHarvestStrategy.configureStrategy(lpPositionId, {
        targetAddress: config.targetAddress,
        targetToken: USDC,  // Set desired token
        swapPoolFee: 3000,
        minAmountOut: 0
    });
}
```

### High Slippage on Conversion

**Adjust minAmountOut:**
```javascript
// Calculate expected output
const expectedUSDC = calculateExpectedOutput(ethAmount, ethPrice);

// Set minimum (e.g., 1% slippage)
const minUSDC = expectedUSDC * 0.99;

await autoHarvestStrategy.configureStrategy(lpPositionId, {
    ...existingConfig,
    minAmountOut: minUSDC
});
```

## Key Takeaways

✅ Auto-harvest automatically collects and sends rewards to your wallet
✅ 0.2% automation fee - cheaper than manual gas costs
✅ Optional token conversion for receiving preferred asset
✅ Perfect for income generation, treasury management, tax tracking
✅ Different strategy than compounding - choose based on goals
✅ Configure target address and optional target token
✅ Useful for both individual users and DAOs/protocols

---

[Back to Automation Strategies](../README.md)

[Back to Automation Overview](../README.md)
