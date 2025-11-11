# Zap In/Out

## What is Zapping?

**Zapping** allows you to enter or exit liquidity positions with a single token, even though the pool requires two tokens. Instead of manually swapping half your tokens, the zap function handles everything in one transaction.

**Example:**
- You have 1000 USDC
- Want to create ETH-USDC Uniswap LP
- Zap automatically: swaps 500 USDC → ETH, then creates LP with 500 USDC + ETH equivalent

## Why Use Zapping?

### Without Zap (Manual)
1. Calculate optimal split ratio
2. Swap 50% USDC → ETH (gas: $15, slippage: 0.3%)
3. Approve ETH for Uniswap (gas: $15)
4. Create LP position (gas: $30)
5. **Total: $60 gas + 0.3% slippage + 10 minutes of your time**

### With Zap (Automated)
1. Click "Zap In" with full USDC amount
2. Done
3. **Total: $35 gas + optimal routing + 30 seconds**

## Zap In - Enter Positions

### How It Works

```solidity
function zapIn(NftZapIn memory zap) external payable {
    // 1. Execute swaps to convert input tokens
    for (swap in zap.swaps) {
        execute swap via router
    }

    // 2. Add liquidity with swapped tokens
    mintPosition(zap.addLiquidityParams)

    // 3. Create position in storage
    createPositionForConnector(
        protocol,
        tokenId,
        PositionType.LIQUIDITY,
        parentPosition,  // Link to parent if leveraged
        metadata
    )
}
```

**Zap In Flow:**
```
User Token(s) → Swap(s) → Balanced Token Pair → Create LP → Track Position
```

### Parameters

**NftZapIn Structure:**
```solidity
struct NftZapIn {
    Swap[] swaps;                      // Swap instructions
    AddLiquidityParams addLiquidity;   // LP creation params
    bytes32 parentPosition;            // Optional parent linking
}

struct Swap {
    address router;                    // DEX router (Uniswap, 1inch, etc.)
    address tokenIn;                   // Input token
    address tokenOut;                  // Output token
    uint256 amountIn;                  // Amount to swap
    uint256 minAmountOut;              // Slippage protection
    bytes data;                        // Router-specific calldata
}

struct AddLiquidityParams {
    address token0;                    // First token
    address token1;                    // Second token
    uint24 fee;                        // Pool fee tier (500, 3000, 10000)
    int24 tickLower;                   // Price range lower bound
    int24 tickUpper;                   // Price range upper bound
    uint256 amount0Desired;            // Desired token0 amount
    uint256 amount1Desired;            // Desired token1 amount
    uint256 amount0Min;                // Minimum token0 (slippage)
    uint256 amount1Min;                // Minimum token1 (slippage)
    uint256 deadline;                  // Transaction deadline
}
```

### Example: Zap In with Single Token

**Scenario:** Create ETH-USDC LP using only USDC

```javascript
// You have: 10,000 USDC
// Goal: Create ETH-USDC LP in 0.3% fee tier

const zapParams = {
  swaps: [{
    router: UNISWAP_V3_ROUTER,
    tokenIn: USDC,
    tokenOut: WETH,
    amountIn: ethers.utils.parseUnits("5000", 6),  // Swap 5000 USDC
    minAmountOut: ethers.utils.parseEther("2.4"),  // Min 2.4 ETH (slippage protected)
    data: encodedSwapData
  }],
  addLiquidity: {
    token0: USDC,
    token1: WETH,
    fee: 3000,                                      // 0.3% fee tier
    tickLower: -887220,                             // Full range example
    tickUpper: 887220,
    amount0Desired: ethers.utils.parseUnits("5000", 6),
    amount1Desired: ethers.utils.parseEther("2.5"),
    amount0Min: ethers.utils.parseUnits("4900", 6), // 2% slippage
    amount1Min: ethers.utils.parseEther("2.45"),
    deadline: Math.floor(Date.now() / 1000) + 1800  // 30 min
  },
  parentPosition: ethers.constants.HashZero          // No parent
};

await proxy.multicall([
  zapLib.encodeFunctionData('zapIn', [zapParams])
]);
```

**Result:**
- 5000 USDC swapped to ~2.5 ETH
- LP created with 5000 USDC + 2.5 ETH
- Position tracked in storage
- Total cost: One transaction (~$35 gas)

### Leveraged Zap In

Create LP positions using borrowed funds in one transaction:

```javascript
// Leveraged ETH-USDC LP
const leveragedZap = {
  swaps: [{
    // Swap borrowed ETH to USDC for balanced LP
    router: UNISWAP_V3_ROUTER,
    tokenIn: WETH,
    tokenOut: USDC,
    amountIn: ethers.utils.parseEther("3.5"),
    minAmountOut: ethers.utils.parseUnits("7000", 6),
    data: encodedSwapData
  }],
  addLiquidity: {
    token0: USDC,
    token1: WETH,
    fee: 3000,
    // ... LP params ...
  },
  parentPosition: borrowPositionId  // Link to Aave borrow position
};
```

**Creates hierarchical structure:**
```
Supply Position (Aave)
  └─ Borrow Position (Aave)
       └─ LP Position (Uniswap) ← Created via Zap
```

## Zap Out - Exit Positions

### How It Works

```solidity
function zapOut(NftZapOut memory zap) external {
    // 1. Remove liquidity from position
    (amount0, amount1) = decreaseLiquidity(
        zap.removeLiquidityParams
    )

    // 2. Collect tokens from position
    collect(tokenId)

    // 3. Execute swaps to convert to desired output
    for (swap in zap.swaps) {
        execute swap via router
    }

    // 4. Transfer final tokens to user
    // 5. Close position in storage
}
```

**Zap Out Flow:**
```
LP Position → Remove Liquidity → Token Pair → Swap(s) → Single Output Token → User
```

### Parameters

**NftZapOut Structure:**
```solidity
struct NftZapOut {
    RemoveLiquidityParams removeLiquidity;  // Liquidity removal params
    Swap[] swaps;                           // Output token swaps
}

struct RemoveLiquidityParams {
    uint256 tokenId;                        // NFT position ID
    uint128 liquidity;                      // Amount to remove (use max for 100%)
    uint256 amount0Min;                     // Slippage protection token0
    uint256 amount1Min;                     // Slippage protection token1
    uint256 deadline;                       // Transaction deadline
}
```

### Example: Zap Out to Single Token

**Scenario:** Exit ETH-USDC LP and receive all USDC

```javascript
// Current LP: 2.5 ETH + 5000 USDC
// Goal: Receive ~10,000 USDC total

const zapOutParams = {
  removeLiquidity: {
    tokenId: lpPositionTokenId,
    liquidity: MAX_UINT128,                          // Remove 100%
    amount0Min: ethers.utils.parseUnits("4900", 6),
    amount1Min: ethers.utils.parseEther("2.4"),
    deadline: Math.floor(Date.now() / 1000) + 1800
  },
  swaps: [{
    router: UNISWAP_V3_ROUTER,
    tokenIn: WETH,
    tokenOut: USDC,
    amountIn: ethers.utils.parseEther("2.5"),        // Swap all ETH
    minAmountOut: ethers.utils.parseUnits("4900", 6),
    data: encodedSwapData
  }]
};

await proxy.multicall([
  zapLib.encodeFunctionData('zapOut', [zapOutParams])
]);
```

**Result:**
- LP position closed
- 2.5 ETH swapped to ~5000 USDC
- Total received: ~10,000 USDC
- Position removed from storage
- Total cost: One transaction (~$30 gas)

## Slippage Protection

### Setting Slippage Tolerance

**Conservative (0.5%):**
```javascript
minAmountOut = expectedAmount * 0.995
```

**Standard (1%):**
```javascript
minAmountOut = expectedAmount * 0.99
```

**Aggressive (3%):**
```javascript
minAmountOut = expectedAmount * 0.97
```

### Why Slippage Matters

- **Swaps consume liquidity** from pools
- **Large orders** = more price impact
- **Volatile markets** = wider spreads
- **Set too tight:** Transaction reverts
- **Set too loose:** You lose money to MEV

**Recommended:** Start with 1% and adjust based on:
- Token pair liquidity
- Trade size relative to pool
- Market volatility

## Gas Optimization

### Zap vs Manual Comparison

| Method | Transactions | Approvals | Est. Gas Cost |
|--------|--------------|-----------|---------------|
| **Manual** | 3-4 tx | 2 approvals | $60-80 |
| **Zap In** | 1 tx | 0 additional | $30-40 |
| **Zap Out** | 1 tx | N/A | $25-35 |

**Savings:** 40-50% on gas, 10x faster execution

### Batching Multiple Zaps

Execute multiple zap operations in one transaction:

```javascript
await proxy.multicall([
  zapLib.encodeFunctionData('zapIn', [zapParams1]),
  zapLib.encodeFunctionData('zapIn', [zapParams2])
]);
```

## Advanced: Multi-Swap Zaps

Zap with multiple intermediate swaps:

```javascript
const complexZap = {
  swaps: [
    {
      // Swap 1: DAI → USDC
      router: UNISWAP_V3_ROUTER,
      tokenIn: DAI,
      tokenOut: USDC,
      amountIn: ethers.utils.parseEther("5000"),
      minAmountOut: ethers.utils.parseUnits("4950", 6),
      data: swap1Data
    },
    {
      // Swap 2: USDC → ETH
      router: UNISWAP_V3_ROUTER,
      tokenIn: USDC,
      tokenOut: WETH,
      amountIn: ethers.utils.parseUnits("2500", 6),
      minAmountOut: ethers.utils.parseEther("1.2"),
      data: swap2Data
    }
  ],
  addLiquidity: {
    // Create USDC-ETH LP with final tokens
    token0: USDC,
    token1: WETH,
    // ... params ...
  }
};
```

**Use Case:** Convert DAI to USDC-ETH LP in one transaction

## Safety Features

1. **Slippage Protection**
   - `minAmountOut` on every swap
   - `amount0Min` / `amount1Min` on liquidity operations
   - Reverts if conditions not met

2. **Deadline Protection**
   - Transaction must execute before deadline
   - Prevents stale transactions in mempool
   - Typical: 30 minutes from submission

3. **Router Whitelisting**
   - Only approved routers can be used
   - Prevents malicious swap contracts
   - Managed by HHDirectory

4. **Reentrancy Guards**
   - NonReentrant modifier on zap functions
   - Prevents reentrancy attacks during swaps

## Common Use Cases

### 1. Single-Sided LP Entry
Enter liquidity pools with one token instead of rebalancing manually.

### 2. Leveraged Position Creation
Combine borrowing + LP creation in one zap transaction.

### 3. Position Rebalancing
Zap out of one LP, zap into another with different parameters.

### 4. Emergency Exit to Stables
Quickly convert all LP positions to USDC/DAI for safety.

### 5. Yield Optimization
Exit low-APY LP, zap into high-APY LP without manual swaps.

## Troubleshooting

### "Insufficient output amount"
- **Cause:** Slippage tolerance too tight or poor liquidity
- **Fix:** Increase slippage tolerance or use better router

### "Transaction deadline passed"
- **Cause:** Transaction stuck in mempool too long
- **Fix:** Increase gas price or set longer deadline

### "Swap failed"
- **Cause:** Router issue or token compatibility
- **Fix:** Try different router or check token allowances

### "Position not found"
- **Cause:** Invalid tokenId for zap out
- **Fix:** Verify position exists and you own it

## Related Pages

- [Creating Uniswap V3 Positions](../protocol-deep-dive/core-architecture.md#uniswap-v3-integration)
- [Configure Automated Strategies](automations/configure-automated-strategies.md)
- [Emergency Exit](emergency-exit.md)

---

*Zap functions powered by [NftZapLib.sol](../smart-contracts/core-contracts.md#nftzaplib)*
