# Emergency Exit

## What is Emergency Exit?

**Emergency Exit** is your safety mechanism to instantly close all positions and withdraw all funds from your Hedgehog Proxy back to your wallet. Think of it as the "eject button" - no matter what's happening, you can always get your funds out.

## When to Use Emergency Exit

### Legitimate Use Cases

✅ **Market Crash** - Close all positions quickly before further losses
✅ **Protocol Concerns** - Exit if you're worried about protocol security
✅ **Gas Price Spike** - Close positions before gas becomes prohibitively expensive
✅ **Need Immediate Liquidity** - Emergency personal need for funds
✅ **Migration** - Moving to different platform or strategy

### When NOT to Use

❌ **Normal position management** - Use manual adjustments instead
❌ **Routine rebalancing** - Let automation handle it
❌ **Small price movements** - Emergency exit has slippage costs
❌ **Testing** - Use testnet for experiments

## How Emergency Exit Works

### Complete Exit Flow

```
Step 1: VALIDATE
├─ Check caller is proxy owner
├─ Verify positions exist
└─ Load emergency exit configuration

Step 2: UNWIND POSITIONS (Bottom-Up)
├─ Identify all positions and dependencies
├─ Start with leaf positions (no children)
├─ Work backwards to root positions
└─ Process order: LIQUIDITY → BORROWING → LENDING

Step 3: EXECUTE EXITS
├─ For each LIQUIDITY position:
│   ├─ decreaseLiquidity(100%)
│   ├─ collect all fees
│   └─ burn NFT / withdraw LP tokens
│
├─ For each BORROWING position:
│   ├─ Calculate total debt
│   ├─ Swap collateral if needed
│   ├─ repay debt fully
│   └─ Close borrow position
│
└─ For each LENDING position:
    ├─ withdraw all supplied tokens
    ├─ withdraw all aTokens/cTokens
    └─ Close supply position

Step 4: SWEEP REMAINING ASSETS
├─ Identify all token balances in proxy
├─ Transfer each token to owner
└─ Transfer any remaining ETH

Step 5: CLEANUP
├─ Mark all positions as closed
├─ Clear position storage
└─ Emit EmergencyExitExecuted event
```

### Position Dependency Handling

Hedgehog automatically handles complex position hierarchies:

```
Example Hierarchy:
Supply USDC (Root)
  └─ Borrow ETH (Child)
       └─ LP ETH-USDC (Grandchild)

Exit Order:
1. LP ETH-USDC → Remove liquidity, collect fees
2. Borrow ETH → Repay debt using collected tokens
3. Supply USDC → Withdraw all collateral
```

**Key Insight:** You never need to manually figure out the dependency chain. Emergency Exit handles it automatically.

## Emergency Exit Functions

### 1. Exit All Positions

Complete shutdown of your Hedgehog proxy.

```solidity
function emergencyExitAllPositions(
    uint256 maxSlippageBps,
    bool forceExit
) external onlyOwner
```

**Parameters:**
- `maxSlippageBps` - Maximum acceptable slippage (100 = 1%)
- `forceExit` - If true, continues even if some positions fail

**Example Usage:**
```javascript
// Exit all positions with 1% max slippage
await proxy.emergencyExitAllPositions(
  100,    // 1% slippage
  false   // Don't force (revert if any position fails)
);
```

**What Happens:**
1. All LP positions closed
2. All debts repaid
3. All supplied collateral withdrawn
4. All tokens swept to your wallet
5. Proxy is empty but still owned by you

**Gas Cost:** Varies by positions (typically 500k-2M gas depending on complexity)

### 2. Exit Specific Position

Close a single position and optionally its children.

```solidity
function emergencyExitPosition(
    bytes32 positionId,
    uint256 maxSlippageBps,
    bool includeChildren
) external onlyOwner
```

**Parameters:**
- `positionId` - The position to exit
- `maxSlippageBps` - Maximum slippage tolerance
- `includeChildren` - Also exit all child positions

**Example:**
```javascript
// Exit just the LP position, keep parent borrow
await proxy.emergencyExitPosition(
  lpPositionId,
  200,    // 2% slippage
  false   // Don't close parent positions
);
```

**Use Case:** Close leveraged LP but keep collateral supplied

### 3. Sweep Stuck Tokens

Recover tokens stuck in your proxy.

```solidity
function sweepToken(
    address token,
    uint256 amount
) external onlyOwner
```

**Parameters:**
- `token` - Token address (address(0) for ETH)
- `amount` - Amount to sweep (0 = entire balance)

**Example:**
```javascript
// Sweep all USDC
await proxy.sweepToken(USDC_ADDRESS, 0);

// Sweep specific amount of ETH
await proxy.sweepToken(ethers.constants.AddressZero, ethers.utils.parseEther("1.5"));
```

**When to Use:**
- Airdrops sent to your proxy
- Refunds from failed transactions
- Dust left after position closures
- Tokens sent by mistake

## Slippage Protection

### Understanding Slippage

During emergency exit:
- LP positions are unwound (selling into pools)
- Large exits can move prices
- Volatile markets increase slippage
- Slippage protection prevents excessive losses

### Setting Slippage Tolerance

**Conservative (0.5-1%):**
```javascript
maxSlippageBps: 50-100
```
- Use for stable pairs (USDC-USDT)
- Use for small positions relative to pool
- May fail in volatile markets

**Standard (1-2%):**
```javascript
maxSlippageBps: 100-200
```
- Recommended for most situations
- Balances protection with success rate
- Works in moderate volatility

**Aggressive (3-5%):**
```javascript
maxSlippageBps: 300-500
```
- Use in high volatility
- Use for large positions
- Prioritize exit over slippage
- More vulnerable to MEV

**Emergency (forceExit):**
```javascript
forceExit: true
maxSlippageBps: 1000  // 10%
```
- Last resort
- Accepts high slippage to guarantee exit
- Use when speed is critical

## Cost Analysis

### Gas Costs by Scenario

| Scenario | Positions | Est. Gas | Cost @ 50 gwei |
|----------|-----------|----------|----------------|
| **Simple** | 1 supply | 200k | $10 |
| **Standard** | 1 supply + 1 LP | 500k | $25 |
| **Complex** | Supply + Borrow + LP | 800k | $40 |
| **Leveraged** | Supply + Borrow + 2 LPs | 1.2M | $60 |
| **Maximum** | Multiple strategies | 2M+ | $100+ |

### Slippage Costs

Example: Exit $10,000 ETH-USDC LP

| Slippage | Cost | When to Use |
|----------|------|-------------|
| 0.5% | $50 | Normal conditions |
| 1% | $100 | Moderate volatility |
| 2% | $200 | High volatility |
| 5% | $500 | Emergency |

**Total Exit Cost = Gas + Slippage + Swap Fees**

## Safety Features

### 1. Owner-Only Access

```solidity
modifier onlyOwner() {
    require(msg.sender == owner(), "Not owner");
    _;
}
```

Only the proxy owner can trigger emergency exit. Bots cannot.

### 2. Slippage Limits

```solidity
require(
    amountOut >= minAmountOut,
    "Slippage exceeded"
);
```

Transaction reverts if slippage exceeds your tolerance.

### 3. Atomic Execution

Either all positions close successfully, or entire transaction reverts (unless `forceExit=true`).

### 4. Event Logging

All exits emit events for full auditability:

```solidity
event EmergencyExitExecuted(address indexed owner, uint256 positionsExited, uint256 gasUsed);
event PositionUnwound(bytes32 indexed positionId, uint8 positionType);
event DebtRepaid(bytes32 indexed positionId, address indexed token, uint256 amount);
```

## Common Scenarios

### Scenario 1: Simple LP Exit

**Situation:** Single Uniswap V3 LP, no leverage

**Solution:**
```javascript
await proxy.emergencyExitAllPositions(100, false);
```

**Outcome:**
- LP removed (2 tokens returned)
- Tokens sent to your wallet
- Gas: ~300-400k

---

### Scenario 2: Leveraged Position Exit

**Situation:** Supplied USDC → Borrowed ETH → Created ETH-USDC LP

**Solution:**
```javascript
await proxy.emergencyExitAllPositions(200, false);
```

**Execution Order:**
1. Close LP (receive ETH + USDC)
2. Repay ETH debt to Aave
3. Withdraw USDC collateral

**Outcome:**
- All positions closed
- Net USDC in your wallet
- Gas: ~700-900k

---

### Scenario 3: Partial Exit (Keep Collateral)

**Situation:** Want to close LP but keep Aave position

**Solution:**
```javascript
// Exit just the LP
await proxy.emergencyExitPosition(lpPositionId, 100, false);

// Manually repay some debt if desired
await proxy.multicall([
  aaveConnector.repay(borrowPositionId, repayAmount)
]);
```

**Outcome:**
- LP closed
- Aave supply/borrow remain active
- More flexible than full exit

---

### Scenario 4: Stuck Token Recovery

**Situation:** Airdrop sent to your proxy

**Solution:**
```javascript
// Sweep the airdrop token
await proxy.sweepToken(AIRDROP_TOKEN, 0);
```

**Outcome:**
- Airdrop tokens sent to your wallet
- Existing positions unaffected
- Gas: ~50-70k

## Troubleshooting

### "Slippage exceeded"

**Cause:** Market moved beyond your tolerance

**Solutions:**
1. Increase `maxSlippageBps` (e.g., 100 → 200)
2. Wait for lower volatility
3. Use `forceExit=true` as last resort
4. Exit positions individually with higher slippage each

---

### "Insufficient funds to repay debt"

**Cause:** Collateral value dropped, can't cover debt

**Solutions:**
1. Add more collateral first: `supply()` more tokens
2. Manually repay part of debt before exit
3. Use `forceExit=true` to exit what's possible
4. Close LP first, use proceeds to repay, then exit

---

### "Position has children"

**Cause:** Trying to close parent without closing children first

**Solutions:**
1. Use `emergencyExitAllPositions()` (handles dependencies)
2. Use `emergencyExitPosition(id, slippage, true)` with `includeChildren=true`
3. Manually close children first, then parent

---

### "Transaction reverted"

**Cause:** Various (gas limit, slippage, failed swap, etc.)

**Debugging Steps:**
1. Check error message on Etherscan
2. Verify proxy has sufficient token balances
3. Increase gas limit (try 2M)
4. Try exiting positions one at a time
5. Check for paused protocols (Aave, Uniswap)

## After Emergency Exit

### Your Proxy Status

✅ **Proxy still exists** - Not destroyed, just empty
✅ **You still own it** - Ownership unchanged
✅ **Can reuse it** - Create new positions anytime
✅ **Token approvals intact** - No need to re-approve

### Next Steps

**If you exited due to concerns:**
- Monitor the protocol for updates
- Join Discord for official communications
- Wait for all-clear before re-entering

**If you exited for liquidity:**
- Your funds are in your wallet
- Proxy ready to use when you return
- No re-deployment needed

**If migrating away:**
- Consider keeping proxy for future use
- Minimal cost to leave it deployed
- May want to revoke bot approvals: `setApproved(address(0))`

## Emergency Exit vs Manual Close

| Feature | Emergency Exit | Manual Close |
|---------|---------------|--------------|
| **Speed** | Single transaction | Multiple transactions |
| **Gas Cost** | Higher (batch) | Lower (spread out) |
| **Slippage** | Potentially higher | Can optimize timing |
| **Convenience** | One click | Requires multiple steps |
| **Safety** | Atomic (all or nothing) | Step by step control |

**Recommendation:**
- Use manual close for routine operations
- Reserve emergency exit for true emergencies

## Related Pages

- [Health Factor Management](health-factor.md) - Avoid liquidation
- [Manual Adjustments](manual-adjustment.md) - Non-emergency position management
- [Creating a Proxy](creating-a-proxy.md) - Understanding proxy ownership

---

*Emergency Exit is your safety guarantee. You always have full control of your funds.*
