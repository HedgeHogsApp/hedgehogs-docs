# Fees

## Fee Structure Overview

Hedgehog Protocol uses a **dual-context fee model** where fees are charged based on WHO executes the operation, not WHAT operation is executed.

**Core principle:**
- **User executes → User fees** (0.5% typical)
- **Bot executes → Automation fees** (0.1-0.3% typical)

## User Fees (Manual Operations)

When you manually execute operations through your proxy:

| Operation | Fee Rate | Example (on $1,000) |
|-----------|----------|---------------------|
| **supply()** | 0.5% | $5.00 |
| **mintPosition()** | 0.5% per token | $5.00 per token |
| **increaseLiquidity()** | 0.5% | $5.00 |
| **decreaseLiquidity()** | 0.5% | $5.00 |
| **collect()** | 0.5% | $5.00 |
| **withdraw()** | 0.5% | $5.00 |
| **repay()** | 0.5% | $5.00 |
| **borrow()** | 0% | FREE |

### Why User Fees?

**Two benefits:**
1. **Lower than traditional DeFi** - Save 67-85% on approvals
2. **Revenue for protocol** - Sustainable development

**Comparison:**

Traditional DeFi approval costs:
```
USDC approval: $15 gas
WETH approval: $15 gas
Uniswap approval: $20 gas
Total: $50 for approvals

Every new protocol: +$15-30 gas
```

Hedgehog approval costs:
```
Proxy approval (one-time): $5 gas
USDC → proxy: ~$1 gas
WETH → proxy: ~$1 gas
Total: $7 for unlimited usage

New protocol: $0 (already approved!)
```

**Savings: $43 (86% reduction)**

Even with 0.5% fees on operations, you're ahead after just a few transactions.

## Automation Fees (Bot Operations)

When bots execute strategies on your behalf:

| Strategy | Fee Rate | Example (on $1,000 operation) |
|----------|----------|--------------------------------|
| **Auto-Rebalance** | 0.1% | $1.00 |
| **Auto-Compound** | 0.2% | $2.00 |
| **Auto-Repay** | 0.15% | $1.50 |
| **Auto-Collateralize** | 0.15% | $1.50 |
| **Auto-Harvest** | 0.2% | $2.00 |

### Why Automation Fees Are Lower

**Strategy:** Incentivize automation adoption
- Lower fees → more users enable automation
- More automation → higher volume
- Higher volume → more total protocol revenue
- Users save money, protocol earns from scale

**Example:**
```
Manual rebalance: 0.5% fee + $30 gas = $35 on $5,000 position (0.7%)
Auto rebalance: 0.1% fee = $5 on $5,000 position (0.1%)

Savings: $30 per rebalance (86% reduction)

Over 12 rebalances/year: $360 saved vs manual
```

## Fee Calculation Examples

### Example 1: Supply USDC to Aave

**User path (manual):**
```javascript
// User supplies $10,000 USDC
await proxy.multicall([
    aaveConnector.supply(USDC, 10000e6)
]);

// Fee calculation:
// - Operation: supply
// - User fee rate: 0.5%
// - Fee amount: $10,000 * 0.005 = $50
// - Net supplied to Aave: $9,950
// - Fee sent to treasury: $50
```

**Bot path (automation):**
```javascript
// Bot supplies $10,000 USDC from proxy balance
await proxy.connect(bot).multicall([
    aaveConnector.supply(USDC, 10000e6)
]);

// Fee calculation:
// - Operation: supply
// - Automation fee rate: 0.1%
// - Fee amount: $10,000 * 0.001 = $10
// - Net supplied to Aave: $9,990
// - Fee sent to treasury: $10
```

### Example 2: Create LP Position

**User path:**
```javascript
// User creates $5,000 LP (1 ETH + $2,000 USDC at $2k ETH)
await proxy.multicall([
    uniswapConnector.mintPositionUser(WETH, USDC, 500, {
        amount0: ethers.utils.parseEther("1.0"),
        amount1: 2000e6,
        ...
    })
]);

// Fee calculation:
// - Fees on both tokens
// - WETH: 1 * 0.005 = 0.005 ETH ($10)
// - USDC: $2,000 * 0.005 = $10
// - Total fee: $20
// - Net LP created: ~$4,980 value
```

### Example 3: Auto-Compound

**Bot path only (compounding collected fees):**
```javascript
// Bot compounds $200 of collected LP fees
await autoCompoundStrategy.connect(bot).executeStrategy(lpPositionId);

// Execution:
// 1. Collect fees: 0.1 ETH + $100 USDC = $200
// 2. Automation fee: $200 * 0.002 = $0.40
// 3. Net to compound: $199.60
// 4. Swap to maintain ratio: ~$100 ETH + $99.60 USDC
// 5. Add to LP position
```

### Example 4: Auto-Repay

**Bot path only (repaying debt with LP fees):**
```javascript
// Bot repays debt when HF drops to 1.25
await autoRepayStrategy.connect(bot).executeStrategy(lpPositionId);

// Execution:
// 1. Collect LP fees: 0.05 ETH + $50 USDC = $150
// 2. Swap USDC to ETH: $50 → ~0.025 ETH
// 3. Total ETH: 0.075 ETH ($150)
// 4. Automation fee: $150 * 0.0015 = $0.225
// 5. Net ETH to repay: ~0.0749 ETH
// 6. Repay to Aave
// 7. Health factor improves from 1.25 → 1.32
```

## Fee Comparison: Manual vs Automation

### Scenario: Maintain LP Position for 1 Year

**Manual approach:**
```
Rebalance 12 times:
- Gas: 12 * $30 = $360
- Fees: 12 * (0.5% of $5k) = $300
Total: $660

Compound 24 times:
- Gas: 24 * $25 = $600
- Fees: 24 * (0.5% of avg $100) = $12
Total: $612

Repay 6 times:
- Gas: 6 * $20 = $120
- Fees: 6 * (0.5% of avg $500) = $15
Total: $135

TOTAL ANNUAL COST: $1,407 on $5,000 position (28.1%)
```

**Automated approach:**
```
Rebalance 12 times:
- Automation fees: 12 * (0.1% of $5k) = $60
Total: $60

Compound 24 times:
- Automation fees: 24 * (0.2% of avg $100) = $4.80
Total: $4.80

Repay 6 times:
- Automation fees: 6 * (0.15% of avg $500) = $4.50
Total: $4.50

TOTAL ANNUAL COST: $69.30 on $5,000 position (1.4%)
```

**Savings: $1,337.70 per year (95% reduction!)**

## Fee Destinations

All fees collected by Hedgehog Protocol go to the **Treasury**:

### Treasury Allocation (Proposed)

**Development & Operations: 40%**
- Core team salaries
- Ongoing development
- Infrastructure costs

**Security: 30%**
- Audits
- Bug bounties
- Security infrastructure

**Liquidity Incentives: 20%**
- Protocol-owned liquidity
- User incentives
- Ecosystem grants

**Reserve: 10%**
- Emergency fund
- Future opportunities

### Governance (Future)

**When governance launches:**
- Fee rates: Governance-controlled
- Fee allocation: Governance-decided
- Fee collector: Governance-owned
- Treasury spending: Governance-approved

## Fee Adjustments

### Current Rates

| Context | Default Rate | Min | Max |
|---------|--------------|-----|-----|
| **User fees** | 0.5% | 0% | 10% |
| **Automation fees** | 0.1-0.3% | 0% | 5% |

### How Rates Can Change

**Pre-governance:**
- Controlled by Hedgehog team
- Changes require 48h timelock
- Announced publicly

**Post-governance:**
- Controlled by DAO vote
- Changes require proposal + voting period
- Maximum rate caps enforced in code

### Rate Optimization

**Hedgehog monitors:**
- Competitive rates (vs other protocols)
- User adoption (fees too high → less usage)
- Protocol revenue (fees too low → unsustainable)
- Automation adoption (automation fees vs manual)

**Goal:** Sweet spot where:
- Users save money vs alternatives
- Protocol generates sustainable revenue
- Automation is heavily adopted (higher volume)

## Zero-Fee Operations

Some operations have **0% fees** by default:

**borrow()** - Free to borrow
- Rationale: Already paying interest to Aave
- Don't want to discourage borrowing
- Revenue comes from LP fees on borrowed capital

**Emergency operations** - No fees during emergencies
- Emergency exit: Free (might add in future for abuse prevention)
- Health factor critical: Auto-repay free if HF < 1.05

## How to Minimize Fees

### 1. Enable Automation

**Automation fees are 2-5x lower than manual fees.**

```javascript
// Enable all automation
await proxy.setStrategyEnabled(lpPositionId, AUTO_REBALANCE, true);
await proxy.setStrategyEnabled(lpPositionId, AUTO_COMPOUND, true);
await proxy.setStrategyEnabled(borrowPositionId, AUTO_REPAY, true);

// Result: 0.1-0.2% fees instead of 0.5% + gas
```

### 2. Use Multicall

**Batch multiple operations in one transaction.**

```javascript
// Instead of 3 separate calls:
await aaveConnector.supply(USDC, 10000e6);      // Fee on $10k
await aaveConnector.borrow(WETH, amount);       // Free
await uniswapConnector.mintPosition(...);       // Fee on LP

// Use multicall:
await proxy.multicall([
    aaveConnector.interface.encodeFunctionData("supply", [USDC, 10000e6]),
    aaveConnector.interface.encodeFunctionData("borrow", [WETH, amount, supplyPositionId]),
    uniswapConnector.interface.encodeFunctionData("mintPosition", [...])
]);

// Same fees, but save gas and time
```

### 3. Use Zap

**Single-token entry reduces swap costs and fees.**

```javascript
// Traditional: Need both tokens
// - Swap half USDC → ETH (DEX fee + slippage)
// - Create LP with both tokens (Hedgehog fee)

// With Zap:
await nftZapLib.zapIn(USDC, 10000e6, params);
// - Hedgehog handles optimal swap internally
// - Single fee on entry amount
// - Better price execution
```

### 4. Longer Holding Periods

**One-time fees amortize over time.**

```
$50 fee on $10,000 position:
- Hold 1 month: 6% annualized
- Hold 3 months: 2% annualized
- Hold 1 year: 0.5% annualized

Strategy: Enter positions you plan to hold long-term
```

### 5. Larger Position Sizes

**Fees are percentage-based, but automation value increases with size.**

```
$1,000 position:
- Manual costs: $1,407/year (141% of position!)
- Automation costs: $69/year (6.9% of position)

$10,000 position:
- Manual costs: $1,407/year (14.1% of position)
- Automation costs: $69/year (0.69% of position)

Automation becomes more valuable with larger positions
```

## Fee Transparency

**All fees are:**
- Documented here
- Visible in frontend before execution
- Emitted as events on-chain
- Queryable via [dashboard](../chapter-2-how-it-works/dashboard.md)

**Check current fee rates:**
```javascript
// Query HHDirectory
const supplyFeeUser = await hhDirectory.getUserFeeRate(ethers.utils.id("supply"));
const supplyFeeBot = await hhDirectory.getAutomationFeeRate(ethers.utils.id("supply"));

console.log(`User supply fee: ${supplyFeeUser / 100}%`);
console.log(`Bot supply fee: ${supplyFeeBot / 100}%`);
```

## Key Takeaways

✅ **Dual fee model:** User fees (0.5%) vs automation fees (0.1-0.3%)
✅ **Lower than alternatives:** 67-95% savings vs manual + gas
✅ **Incentivized automation:** Bot fees lower to encourage adoption
✅ **Transparent:** All fees visible, queryable, and documented
✅ **Sustainable:** Revenue supports development, security, and growth

---

[Back to Appendix](../README.md)
