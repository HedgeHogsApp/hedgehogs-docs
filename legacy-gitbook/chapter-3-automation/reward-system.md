# Automation Reward System

## Overview

Hedgehog Protocol's automation system operates through a network of bots that monitor and execute strategies on behalf of users. This document explains how the reward system works, ensuring sustainable and decentralized automation infrastructure.

## How Automation Works

### The Bot Network

Hedgehog automation is powered by a decentralized network of bot operators who:

1. **Monitor positions** across all users for execution opportunities
2. **Execute strategies** when conditions are met
3. **Collect automation fees** as compensation for their service
4. **Compete** to provide the best service to users

### Execution Flow

```
1. Bot Monitoring
   └─ Bot scans all positions with automation enabled
   └─ Calls canExecuteStrategy() for each position
   └─ Identifies positions ready for execution

2. Strategy Execution
   └─ Bot calls executeStrategy() on user's behalf
   └─ Strategy executes via delegatecall through user's proxy
   └─ Protocol interactions happen (Aave, Uniswap, etc.)

3. Fee Collection
   └─ Automation fee calculated based on operation
   └─ Fee deducted from operation value/result
   └─ Bot receives compensation for providing service
   └─ User benefits from automated management
```

## Fee Structure

### Automation Fee Tiers

Different operations have different fee rates based on value provided:

| Operation Type | Fee Rate | Rationale |
|----------------|----------|-----------|
| **Value-Generating** | 0.2% | Protocol generates new value for user |
| **Value-Preserving** | 0.1% | Protocol maintains or optimizes position |
| **Risk-Reducing** | 0.15% | Protocol reduces user's risk |
| **Position Creation** | 0.1% | Protocol creates or expands position |

### Strategy-Specific Fees

| Strategy | Fee Rate | Applied To |
|----------|----------|------------|
| **Auto-Rebalance** | 0.1% | Total position value moved |
| **Auto-Compound** | 0.2% | Fees collected and reinvested |
| **Auto-Repay** | 0.15% | Amount repaid |
| **Auto-Collateralize** | 0.15% | Amount added to collateral |
| **Auto-Harvest** | 0.2% | Rewards harvested |

### Fee Calculation Examples

**Auto-Compound Example:**
```
LP fees collected: $500
Automation fee: $500 * 0.002 = $1.00
Net compounded: $499.00

Value to user:
- Avoided gas: ~$35 (collect + increase liquidity)
- Got compound growth: ~$500 reinvested
- Total automation fee: $1.00
- Net benefit: $534 value for $1 cost
```

**Auto-Rebalance Example:**
```
Position value: $20,000
Price exits range, needs rebalancing
Automation fee: $20,000 * 0.001 = $20

Value to user:
- Avoided gas: ~$50 (remove + collect + mint new)
- Prevented missed fees: Could be $50-200+ while out of range
- Convenience: Zero manual work
- Total automation fee: $20
- Net benefit: $80-230+ value for $20 cost
```

**Auto-Repay Example:**
```
Collected LP fees: $800
Health factor: 1.35 (approaching liquidation threshold)
Repayment needed to reach HF 1.50

Automation fee: $800 * 0.0015 = $1.20
Amount repaid: $798.80

Value to user:
- Prevented liquidation: Priceless (could lose 10-20% of position)
- Avoided gas: ~$20 (collect + swap + repay)
- Peace of mind: 24/7 monitoring
- Total automation fee: $1.20
- Net benefit: Position saved, $20 gas saved, all for $1.20
```

## Who Can Run Bots?

### Permissionless Bot Operators

**Anyone can run an automation bot** if they:
1. Monitor positions via `canExecuteStrategy()` calls
2. Are whitelisted in HHDirectory as approved callers
3. Execute strategies through proper channels
4. Collect fees according to protocol rules

### Bot Approval Process

Currently, bots must be whitelisted in HHDirectory:

```solidity
// In HHDirectory
function setCallerWhitelist(address caller, bool allowed) external onlyOwner {
    callerWhitelist[caller] = allowed;
}
```

**Future Direction:** The protocol aims to move toward fully permissionless bot operation where:
- Anyone can run a bot without permission
- Competition drives optimal service
- Users can specify preferred bot operators
- Market dynamics ensure fair fee distribution

### Running Your Own Bot

Technical requirements for bot operators:

**1. Infrastructure:**
- RPC node access (Alchemy, Infura, or self-hosted)
- Reliable server (AWS, Digital Ocean, or local)
- Monitoring service (uptime, error tracking)

**2. Bot Logic:**
```javascript
// Simplified bot monitoring loop
async function monitorPositions() {
    // Get all positions with automation enabled
    const positions = await getAllAutomatedPositions();

    for (const position of positions) {
        // Check each strategy
        for (const strategy of STRATEGIES) {
            const [canExecute, reason] = await strategy.canExecuteStrategy(position.id);

            if (canExecute) {
                try {
                    // Execute strategy
                    const tx = await strategy.executeStrategy(position.id, "0x");
                    await tx.wait();

                    // Fee automatically collected by protocol
                    console.log(`Executed ${strategy.name} for position ${position.id}`);
                } catch (error) {
                    console.error(`Execution failed: ${error.message}`);
                }
            }
        }
    }
}

// Run every block or every few seconds
setInterval(monitorPositions, 12000); // Every 12 seconds
```

**3. Gas Management:**
- Maintain ETH balance for gas
- Implement gas price optimization
- Handle transaction failures gracefully

**4. Profitability:**
- Automation fees must exceed gas costs
- Competition drives efficiency
- Batching multiple executions can improve margins

## Fee Distribution

### Where Fees Go

Automation fees are distributed as follows:

```
Automation Fee (e.g., $1.00)
└─ 100% to bot operator who executed the strategy

Future consideration:
├─ 90% to bot operator (execution reward)
├─ 5% to protocol treasury (development fund)
└─ 5% to governance (community incentives)
```

### Fee Collection Mechanism

Fees are collected automatically during strategy execution:

```solidity
// In connector contract during bot execution
function supply(address asset, uint256 amount, ...) external {
    if (msg.sender != owner) {
        // Bot is executing, collect automation fee
        uint256 fee = FeesLib.collectAutomationFee(
            OperationType.SUPPLY,
            amount
        );

        // Fee sent to fee collector (bot operator)
        amount = amount - fee;
    }

    // Proceed with operation using net amount
    aavePool.supply(asset, amount, address(this), 0);
}
```

## Incentive Alignment

### Why Bots Run Strategies

**Bot operators are incentivized to:**
1. Monitor positions continuously (more executions = more fees)
2. Execute strategies promptly (better user service)
3. Optimize gas usage (lower costs = higher margins)
4. Provide reliable service (build reputation)

### Why Users Enable Automation

**Users benefit from:**
1. No manual management required
2. 24/7 monitoring and execution
3. Lower costs than manual execution (gas savings)
4. Professional-grade position management
5. Capture opportunities they would miss

### Economic Sustainability

The fee model ensures:
- **Bots profit:** Automation fees > gas costs + infrastructure
- **Users save:** Avoided gas + value capture > automation fees
- **Protocol grows:** More users → more volume → more bot activity
- **Network effects:** More bots → better service → more users

## Competitive Dynamics

### Bot Competition

Multiple bots competing to execute strategies creates:

**1. Speed Competition**
- Faster bots execute more strategies
- Users benefit from prompt execution
- Encourages infrastructure investment

**2. Reliability Competition**
- Reliable bots build trust
- Users may prefer certain bot operators
- Creates reputation-based selection (future feature)

**3. Cost Competition**
- Bots optimize gas usage to improve margins
- More efficient execution benefits users
- Drives innovation in automation techniques

### User Benefits from Competition

- Guaranteed execution (multiple bots monitoring)
- Optimal execution timing (bots compete for opportunities)
- System resilience (no single point of failure)
- Continuous service improvement

## Monitoring and Transparency

### Tracking Bot Activity

Users can monitor automation activity on their positions:

```javascript
// Get execution history for a strategy
const filter = autoCompoundStrategy.filters.PositionCompounded(positionId);
const events = await autoCompoundStrategy.queryFilter(filter);

events.forEach(event => {
    console.log(`Strategy executed at block ${event.blockNumber}`);
    console.log(`Transaction: ${event.transactionHash}`);
    // Identify which bot executed by looking at tx.from
});
```

### Fee Transparency

All fees are visible on-chain:

```javascript
// Calculate fees paid
let totalFeesPaid = ethers.BigNumber.from(0);

// Get all automation events
const allEvents = await getAllAutomationEvents(positionId);

allEvents.forEach(event => {
    // Each event includes fee amount
    const fee = calculateFeeFromEvent(event);
    totalFeesPaid = totalFeesPaid.add(fee);
});

console.log(`Total automation fees paid: ${ethers.utils.formatEther(totalFeesPaid)} ETH`);
```

### Performance Metrics

Track value received from automation:

```javascript
// Example: Auto-compound performance
const compoundEvents = await getCompoundEvents(positionId);

let totalCompounded = ethers.BigNumber.from(0);
let totalFees = ethers.BigNumber.from(0);

compoundEvents.forEach(event => {
    totalCompounded = totalCompounded.add(event.amount);
    totalFees = totalFees.add(calculateFee(event.amount));
});

const gasIfManual = compoundEvents.length * 35; // $35 per manual compound
const feesPaidUSD = parseFloat(ethers.utils.formatEther(totalFees)) * ethPrice;
const savings = gasIfManual - feesPaidUSD;

console.log(`Total compounded: $${totalCompounded}`);
console.log(`Automation fees: $${feesPaidUSD}`);
console.log(`Gas saved: $${savings}`);
console.log(`Net benefit: $${totalCompounded.toNumber() + savings}`);
```

## Future Enhancements

### Planned Improvements

**1. Permissionless Bot Operation**
- Remove whitelisting requirement
- Open competition to all operators
- Market-driven fee optimization

**2. Bot Reputation System**
- Track execution success rates
- User ratings for bot operators
- Preferred bot selection

**3. Advanced Fee Models**
- Performance-based fees
- Subscription models
- Fee sharing with users

**4. Cross-Chain Bot Network**
- Bots operating across multiple chains
- Unified monitoring and execution
- Efficient capital deployment

**5. Governance Integration**
- Community-governed fee rates
- Bot operator incentives
- Protocol treasury management

## Key Takeaways

✅ Bot network provides decentralized, reliable automation
✅ Automation fees (0.1-0.2%) are lower than manual gas costs
✅ Bots are incentivized to provide excellent service
✅ Competition ensures optimal execution for users
✅ Complete fee transparency on-chain
✅ Users maintain full control, bots are just executors
✅ Sustainable economic model benefits all participants

---

[Back to Automation Overview](./README.md)
