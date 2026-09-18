# Health Factor

## What is Health Factor?

Your **Health Factor** is a numerical representation of the safety of your borrowing position on lending protocols like Aave. It determines how close you are to liquidation.

**Simple Formula:**
```
Health Factor = (Collateral Value × Liquidation Threshold) / Total Borrowed Value
```

**Safe Zone:** Health Factor > 1.0

**Danger Zone:** Health Factor < 1.1

**Liquidation:** Health Factor < 1.0

## Understanding the Numbers

### Health Factor = 2.0
- **Meaning:** Your collateral is worth 2x your debt
- **Safety:** Very safe
- **Action:** No immediate action needed
- **Example:** $10,000 collateral, $5,000 borrowed

### Health Factor = 1.5
- **Meaning:** Moderate safety margin
- **Safety:** Safe
- **Action:** Monitor if market is volatile
- **Example:** $10,000 collateral, $6,666 borrowed

### Health Factor = 1.2
- **Meaning:** Getting close to danger zone
- **Safety:** Risky
- **Action:** Consider adding collateral or repaying debt
- **Example:** $10,000 collateral, $8,333 borrowed

### Health Factor = 1.05
- **Meaning:** Very close to liquidation
- **Safety:** Danger!
- **Action:** **Immediate action required**
- **Example:** $10,000 collateral, $9,523 borrowed

### Health Factor < 1.0
- **Meaning:** Liquidation triggered
- **Safety:** Being liquidated
- **Action:** Too late - liquidators are closing your position
- **Penalty:** Typically 5-10% liquidation penalty

## What Affects Health Factor?

### 1. Collateral Value Changes

**ETH as collateral:**
- ETH price ↑ → Health Factor ↑ (safer)
- ETH price ↓ → Health Factor ↓ (riskier)

**Example:**
```
Initial: $2000 ETH collateral, $1000 borrowed
Health Factor = ($2000 × 0.80) / $1000 = 1.60

ETH drops 20% to $1600:
Health Factor = ($1600 × 0.80) / $1000 = 1.28
```

### 2. Borrowed Asset Value Changes

**Borrowed USDC (stablecoin):**
- Usually stable around $1.00
- Minimal impact on health factor

**Borrowed ETH:**
- ETH price ↑ → Debt value ↑ → Health Factor ↓
- ETH price ↓ → Debt value ↓ → Health Factor ↑

### 3. Interest Accrual

Borrowed amounts grow over time due to interest:
- Your debt slowly increases
- Health factor slowly decreases
- More pronounced with high APR borrowing

**Example:**
```
Day 1: Borrowed $1000 at 5% APY
Day 365: Owe $1050
Health factor decreased slightly
```

### 4. Liquidation Threshold

Different assets have different thresholds:

| Asset | Liquidation Threshold | What It Means |
|-------|----------------------|---------------|
| **WETH** | 82.5% | Can borrow up to 82.5% of ETH value |
| **WBTC** | 75% | Can borrow up to 75% of BTC value |
| **USDC** | 87% | Can borrow up to 87% of USDC value |
| **DAI** | 80% | Can borrow up to 80% of DAI value |

Lower threshold = Riskier asset = Liquidated sooner

## Hedgehog's Health Factor Management

### Auto-Repay Strategy

Hedgehog can automatically maintain your health factor using earnings from your LP positions.

**How It Works:**

```
1. Monitor Health Factor
   └─ Check every block
   └─ Trigger if HF < threshold (e.g., 1.3)

2. Collect LP Fees
   └─ Harvest fees from linked Uniswap position
   └─ Receive token0 + token1

3. Swap if Needed
   └─ Swap collected tokens to debt token
   └─ Example: Swap USDC → ETH if ETH is borrowed

4. Repay Debt
   └─ Repay portion of debt to Aave
   └─ Health Factor increases
   └─ Position is safe again

5. Emit Event
   └─ AutoRepayExecuted(positionId, amount, newHealthFactor)
```

**Configuration:**

```solidity
struct RepayConfig {
  uint256 maxRepayPercentage;      // Max 50% of debt per execution
  uint24 swapPoolFee;              // Uniswap pool fee (3000 = 0.3%)
  uint256 minAmountOut;            // Slippage protection
  bool useATokens;                 // Use aTokens for direct repayment
}
```

### Setting Up Auto-Repay

**Prerequisites:**
- Active Aave borrow position
- Linked Uniswap LP position earning fees
- Automation enabled on your proxy

**Step-by-Step:**

1. **Create Linked Positions**
```javascript
// 1. Supply collateral to Aave
const supplyTx = await proxy.multicall([
  aaveConnector.supply(USDC, amount)
]);

// 2. Borrow against collateral
const borrowTx = await proxy.multicall([
  aaveConnector.borrow(WETH, borrowAmount, supplyPositionId)
]);

// 3. Create LP with borrowed funds (linked to borrow)
const lpTx = await proxy.multicall([
  uniswapConnector.mintPosition(WETH, USDC, amounts, borrowPositionId)
]);
```

2. **Enable Auto-Repay Strategy**
```javascript
await proxy.setStrategyEnabled(
  lpPositionId,
  AUTO_REPAY_STRATEGY,
  true
);
```

3. **Configure Thresholds**
```javascript
await autoRepayStrategy.setConfig(lpPositionId, {
  triggerHealthFactor: ethers.utils.parseEther("1.3"),  // Trigger at HF 1.3
  targetHealthFactor: ethers.utils.parseEther("1.5"),   // Repay to HF 1.5
  maxRepayPercentage: 5000,                              // Max 50% per tx
  swapPoolFee: 3000,                                     // 0.3% Uniswap fee
  minAmountOut: 0,                                       // Calculated dynamically
  useATokens: false
});
```

**Result:** Bot monitors your health factor 24/7 and automatically repays debt when needed.

## Manual Health Factor Management

### Option 1: Add More Collateral

**Increases Health Factor**

```javascript
// Supply more USDC to increase collateral
await proxy.multicall([
  aaveConnector.supply(USDC, additionalAmount, existingPositionId)
]);
```

**Example:**
```
Before: $10k collateral, $8k borrowed, HF = 1.25
Add $2k collateral: $12k collateral, $8k borrowed, HF = 1.50
```

### Option 2: Repay Some Debt

**Increases Health Factor**

```javascript
// Repay 20% of borrowed ETH
await proxy.multicall([
  aaveConnector.repay(borrowPositionId, repayAmount)
]);
```

**Example:**
```
Before: $10k collateral, $8k borrowed, HF = 1.25
Repay $2k debt: $10k collateral, $6k borrowed, HF = 1.67
```

### Option 3: Withdraw Safely

**Decreases Health Factor** - Be careful!

```javascript
// Only withdraw if HF is high enough
const currentHF = await aavePool.getUserAccountData(proxy);
require(currentHF > 2.0, "Health factor too low");

await proxy.multicall([
  aaveConnector.withdraw(positionId, withdrawAmount)
]);
```

## Health Factor Monitoring

### Check Your Health Factor

**Via Dashboard:**
- View real-time health factor
- See historical chart
- Get alerts when HF drops

**Via Smart Contract:**
```javascript
const userData = await aavePool.getUserAccountData(proxyAddress);
const healthFactor = userData.healthFactor;  // Scaled by 1e18

// Convert to human-readable
const hf = ethers.utils.formatEther(healthFactor);
console.log(`Health Factor: ${hf}`);
```

**Via Bot:**
```python
def check_health_factor(proxy_address):
    account_data = aave_pool.functions.getUserAccountData(proxy_address).call()
    health_factor = account_data[5] / 1e18  # Index 5 is healthFactor
    return health_factor

hf = check_health_factor(my_proxy)
if hf < 1.3:
    print("WARNING: Health factor low!")
```

### Health Factor Alerts

Set up notifications:
- Discord webhook when HF < 1.5
- Email alert when HF < 1.3
- SMS when HF < 1.1

## Liquidation Process

### What Happens During Liquidation

```
1. Your Health Factor drops below 1.0
   ↓
2. Liquidator detects opportunity
   ↓
3. Liquidator repays portion of your debt
   ↓
4. Liquidator receives your collateral + bonus (5-10%)
   ↓
5. Your debt is reduced, but you lost collateral + penalty
```

**Example:**
```
Your position:
- $10,000 USDC collateral
- $9,600 borrowed ETH
- Health Factor: 0.98 (< 1.0)

Liquidator repays:
- $5,000 of your ETH debt

Liquidator receives:
- $5,500 of your USDC ($5,000 + 10% bonus)

Your new position:
- $4,500 USDC collateral (lost $5,500)
- $4,600 ETH debt (reduced by $5,000)
- Health Factor: 1.22 (safe again, but you lost money)
```

**Cost to You:** $500 penalty + stress

### How to Avoid Liquidation

✅ **Keep Health Factor > 1.5** - Safe buffer
✅ **Enable Auto-Repay** - Automated protection
✅ **Monitor during volatility** - Extra attention in crashes
✅ **Don't over-leverage** - Borrow less than maximum
✅ **Use stable collateral** - USDC less volatile than ETH
✅ **Set price alerts** - Know when collateral value drops

## Advanced: Multiple Positions

### Scenario: Multiple Borrows

Aave combines all your positions:

```
Position 1: $5k USDC collateral, $3k ETH borrowed
Position 2: $3k WBTC collateral, $2k USDC borrowed

Combined Health Factor calculation:
Total Collateral Value = ($5k × 0.87) + ($3k × 0.75) = $6.6k
Total Debt Value = $3k + $2k = $5k
Health Factor = $6.6k / $5k = 1.32
```

**Key Point:** One unhealthy position can liquidate your entire Aave account.

### Hedgehog's Advantage

Hedgehog tracks position relationships:
- Knows which LP earns fees for which borrow
- Auto-repay uses correct LP fees for correct debt
- Clear hierarchy prevents confusion

```
Supply USDC
  └─ Borrow ETH
       └─ LP ETH-USDC ← Fees repay ETH debt

Supply WBTC
  └─ Borrow USDC
       └─ LP WBTC-USDC ← Fees repay USDC debt
```

## Health Factor Strategies

### Conservative (HF > 2.0)
- **Pros:** Very safe, sleep well
- **Cons:** Low capital efficiency
- **Best for:** Risk-averse users, volatile markets

### Moderate (HF 1.5-2.0)
- **Pros:** Good balance of safety and returns
- **Cons:** Need occasional monitoring
- **Best for:** Most users, automated strategies

### Aggressive (HF 1.2-1.5)
- **Pros:** Maximum capital efficiency
- **Cons:** High liquidation risk
- **Best for:** Experienced users, stable markets, active management

### Dangerous (HF < 1.2)
- **Pros:** None
- **Cons:** Imminent liquidation risk
- **Best for:** Nobody - reduce leverage immediately!

## Related Pages

- [Creating a Proxy](creating-a-proxy.md) - Set up your proxy
- [Auto-Repay Strategy](automations/automation-strategy-types/auto-repay.md) - Automated health factor management
- [Emergency Exit](emergency-exit.md) - Close positions before liquidation
- [How Hedgehog Works](02-how-it-works.md) - Understanding leveraged positions

---

*Keep your health factor above 1.5 and let Hedgehog's automation handle the rest.*
