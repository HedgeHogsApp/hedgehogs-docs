# Automations Overview

## What is DeFi Automation?

Automation allows bots to manage your positions on your behalf - rebalancing, compounding, and protecting you from liquidation - all while you maintain full custody of your funds.

## Why Automate?

**Without Automation:**
- Check positions daily
- Pay $15+ gas per manual rebalance
- Miss optimal compound timing
- Risk liquidation if you're not watching

**With Automation:**
- Bot monitors every block (24/7)
- Pay 0.1-0.3% automation fee (lower than manual gas)
- Never miss a rebalance or compound
- Auto-protect from liquidation

## Available Strategies

### [Auto-Rebalance](automation-strategy-types/auto-rebalance.md)
Keeps your Uniswap V3 LP positions in range for maximum fee earnings.

**When it executes:** Price moves outside your LP range
**What it does:** Removes liquidity, recalculates optimal range, creates new position
**Fee:** 0.1%

### [Auto-Compound](automation-strategy-types/auto-compound.md)
Reinvests your LP fees back into the position for compound growth.

**When it executes:** Accumulated fees reach profitable threshold
**What it does:** Collects fees, adds them back to LP
**Fee:** 0.2%

### [Auto-Repay](automation-strategy-types/auto-repay.md)
Uses your LP fees to repay debt and maintain healthy borrow positions.

**When it executes:** Health factor drops below threshold (e.g., 1.3)
**What it does:** Collects LP fees, swaps if needed, repays debt
**Fee:** 0.15%

### [Auto-Collateralize](automation-strategy-types/auto-collateralize.md)
Converts earnings into additional collateral to improve your health factor.

**When it executes:** Configured schedule or health factor trigger
**What it does:** Collects fees, swaps to collateral token, supplies to Aave
**Fee:** 0.15%

### [Auto-Harvest](automation-strategy-types/auto-harvest.md)
Automatically claims and compounds rewards from protocols.

**When it executes:** Rewards reach claim threshold
**What it does:** Claims rewards, optionally swaps and reinvests
**Fee:** 0.2%

## How Automation Works

### The Bot Network

```
1. Bot monitors your proxy positions
   ├─ Queries HHStorageV2 for active positions
   ├─ Calls strategy.canExecuteStrategy(positionId)
   └─ Returns true/false

2. When canExecuteStrategy returns true:
   ├─ Bot submits transaction
   ├─ Proxy executes strategy via delegatecall
   └─ Strategy charges automation fee

3. You save money and time:
   ├─ No manual intervention needed
   ├─ Lower fees than doing it yourself
   └─ Better timing than humanly possible
```

### Decentralized Execution

- **Any bot can execute** - Permissionless system
- **Competition drives efficiency** - Multiple bots compete for execution
- **You approve bots** - Control which bot(s) can execute
- **Censorship resistant** - No single point of failure

## Enabling Automation

### Step 1: Approve Bot Address

```javascript
await proxy.setApproved(BOT_ADDRESS);
```

This grants the bot permission to execute strategies (but NOT withdraw funds).

### Step 2: Enable Strategies Per Position

```javascript
await proxy.setStrategyEnabled(
  positionId,
  STRATEGY_ADDRESS,
  true  // enable
);
```

Enable specific strategies for specific positions.

### Step 3: Configure Strategy Parameters

```javascript
await strategy.setConfig(positionId, {
  // Strategy-specific configuration
  triggerThreshold: value,
  targetValue: value,
  maxSlippage: bps
});
```

## Automation Fees

### Fee Structure

| Who Executes | Fee Rate | Example (on $1000) |
|--------------|----------|---------------------|
| **You (manual)** | 0.5% | $5.00 |
| **Bot (auto)** | 0.1-0.3% | $1.00-$3.00 |

**Key Insight:** Automation fees are LOWER than manual fees to incentivize usage.

### Why Lower Fees for Automation?

1. **Better for users** - Save money
2. **Better for protocol** - Higher volume = more total fees
3. **Better for bots** - Earn fees for providing service
4. **Win-win-win** - Aligned incentives

## Safety & Control

### What Bots CAN Do

✅ Execute enabled strategies
✅ Rebalance LP positions
✅ Compound fees
✅ Repay debt (using your position's funds)
✅ Swap tokens for strategy execution

### What Bots CANNOT Do

❌ Withdraw funds to themselves
❌ Transfer your tokens
❌ Change proxy ownership
❌ Execute non-whitelisted strategies
❌ Do anything you haven't explicitly enabled

### You Always Have Control

- **Disable anytime:** `setStrategyEnabled(positionId, strategy, false)`
- **Revoke bot:** `setApproved(address(0))`
- **Emergency exit:** Close all positions instantly
- **Full custody:** You own the proxy, bots are helpers

## Getting Started

1. **[Create a Proxy](../creating-a-proxy.md)** - Deploy your Hedgehog proxy
2. **[Create Positions](../02-how-it-works.md)** - Supply, borrow, or LP
3. **[Configure Strategies](configure-automated-strategies.md)** - Enable automation
4. **Monitor** - Check dashboard for execution history

---

*Let automation handle the tedious work while you maintain full control.*

[Back to User Guides](../README.md)
