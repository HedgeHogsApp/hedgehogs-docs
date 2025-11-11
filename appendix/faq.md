# Frequently Asked Questions

## General

### What is Hedgehog Protocol?

Hedgehog is a DeFi automation platform that enables users to create and manage complex positions across multiple protocols (Aave, Uniswap V3) with automated strategies like rebalancing, compounding, and health factor management - all while maintaining full custody of funds.

### How is Hedgehog different from [DeFi Saver / Instadapp / etc.]?

**Key differences:**

- **67-85% cheaper approvals** via JIT (Just-In-Time) approval system
- **Proxy-centric architecture** works with ANY protocol (even those without delegation support)
- **Lower automation fees** (0.1-0.3% vs typical 0.5-1%)
- **Full composability** across protocols with position linking
- **Delta-neutral strategies** built-in for market-neutral yield

### Is Hedgehog safe?

Hedgehog prioritizes security through:

- Multiple security audits (planned)
- Open-source code
- Bug bounty program
- User custody (you always own your funds)
- Isolated connector architecture
- Battle-tested protocols (Aave, Uniswap)

**However:** All DeFi carries risks. Start small, understand the mechanisms, and never invest more than you can afford to lose.

### Do I need to trust Hedgehog with my funds?

**No.** You maintain full custody through your proxy contract:

- You are the owner
- You can withdraw anytime
- Bots can only execute enabled strategies
- Bots CANNOT withdraw your funds
- You can revoke bot access instantly

## Getting Started

### How do I start using Hedgehog?

1. [Deploy your HH proxy](../chapter-2-how-it-works/creating-a-proxy.md) (one-time, ~$5)
2. Approve proxy for tokens you want to use (one-time per token, ~$1-3)
3. Create positions via [dashboard](../chapter-2-how-it-works/dashboard.md)
4. Enable automation strategies
5. Let bots handle the rest

### What's the minimum amount to use Hedgehog?

Recommended minimums:

- **Testing:** $100-500
- **Automation to be worthwhile:** $1,000+
- **Optimal:** $5,000+

Lower amounts work, but automation fees may outweigh benefits.

### What tokens are supported?

Hedgehog works with any token supported by integrated protocols:

**Aave V3:**

- USDC, USDT, DAI (stablecoins)
- WETH, WBTC (majors)
- Various altcoins (check Aave)

**Uniswap V3:**

- Any ERC-20 pair with liquidity

### What chains are supported?

_At launch:_

- Ethereum mainnet
- BSC
- Base

_Coming soon:_

- Arbitrum
- Polygon
- Avalanche
- Others (community-driven)

## Costs and Fees

### What does it cost to use Hedgehog?

**One-time costs:**

- Deploy proxy: ~$5 (gas)
- Approve each token: ~$1-3 (gas)

**Per-operation costs:**

| Operation | Manual (You)       | Automated (Bot) |
| --------- | ------------------ | --------------- |
| Supply/LP | 0.5% fee           | 0.1% fee        |
| Rebalance | 0.5% fee + $30 gas | 0.1% fee        |
| Compound  | 0.5% fee + $25 gas | 0.2% fee        |
| Repay     | 0.5% fee + $20 gas | 0.15% fee       |

**Key insight:** Automation is cheaper than doing it yourself!

### Why are automation fees LOWER than manual fees?

**Strategy:**

- Lower fees incentivize automation adoption
- More automation = higher volume = more total revenue for protocol
- Win-win: Users save money, protocol earns from volume

### How do I minimize fees?

1. **Enable automation** - Lower fees than manual
2. **Batch operations** - Use multicall to combine actions
3. **Use Zap** - Single-token entry reduces swaps
4. **Longer holding periods** - Amortize one-time costs

### Where do fees go?

All fees go to Hedgehog Protocol treasury:

- Protocol development
- Security audits
- Bug bounties
- Liquidity incentives (future)
- Governance (future)

## Automation

### How does automation work?

1. **You enable strategies** for your positions (e.g., auto-rebalance)
2. **You approve bot address** to execute on your behalf
3. **Bots monitor** your positions 24/7
4. **When conditions are met,** bot executes strategy
5. **You pay small automation fee** (0.1-0.3%)

### What can bots do?

**Bots CAN:**

- ✅ Execute enabled strategies
- ✅ Rebalance LP positions
- ✅ Compound fees
- ✅ Repay debt (using your position's funds)
- ✅ Swap tokens for strategy execution

**Bots CANNOT:**

- ❌ Withdraw funds to themselves
- ❌ Transfer your tokens
- ❌ Change proxy ownership
- ❌ Execute non-enabled strategies
- ❌ Do anything you haven't explicitly allowed

### Can I run my own bot?

**Yes!** The bot system is permissionless:

- Approve your own address
- Run open-source bot software
- Execute strategies yourself
- Earn automation fees (if you execute for others)

### What if bots stop working?

**You always have control:**

- Bots are optional, not required
- You can execute strategies manually anytime
- You can approve a different bot
- You can run your own bot
- Emergency exit works without bots

### How do I disable automation?

```javascript
// Disable specific strategy
await proxy.setStrategyEnabled(positionId, AUTO_REBALANCE, false)

// Revoke bot access entirely
await proxy.setApproved(ethers.constants.AddressZero)
```

Instant effect - bot can no longer execute.

## Strategies

### What automation strategies are available?

See [Automation Overview](../chapter-3-automation/README.md) for full details:

1. **[Auto-Rebalance](../chapter-3-automation/strategies/auto-rebalance.md)** - Keep V3 LP in range
2. **[Auto-Compound](../chapter-3-automation/strategies/auto-compound.md)** - Reinvest fees
3. **[Auto-Repay](../chapter-3-automation/strategies/auto-repay.md)** - Maintain health factor
4. **[Auto-Collateralize](../chapter-3-automation/strategies/auto-collateralize.md)** - Convert to collateral
5. **[Auto-Harvest](../chapter-3-automation/strategies/auto-harvest.md)** - Claim protocol rewards

### Can I customize strategy parameters?

**Yes!** Each strategy has configurable parameters:

```javascript
// Example: Configure auto-rebalance
await autoRebalanceStrategy.setConfig(lpPositionId, {
  priceDeviationBps: 100, // Your choice: 1%, 5%, 10%
  newRangeWidth: 2000, // Your choice: ±10%, ±20%, ±50%
  minLiquidityValue: 1000e6, // Your choice: $500, $1k, $5k
  slippageBps: 50, // Your choice: 0.5%, 1%, 2%
})
```

### How often do strategies execute?

**Depends on conditions:**

- **Auto-Rebalance:** When price exits range (could be hours or weeks)
- **Auto-Compound:** When fees exceed threshold (typically daily/weekly)
- **Auto-Repay:** When health factor drops (hopefully rarely!)
- **Auto-Collateralize:** On schedule or HF trigger
- **Auto-Harvest:** When rewards are claimable

**Key:** Strategies only execute when profitable (fees < value generated).

## Positions

### What is a "position" in Hedgehog?

A **position** is any DeFi operation tracked by your proxy:

- Aave supply (collateral)
- Aave borrow (debt)
- Uniswap V3 LP
- Staking for rewards
- Claimable rewards

Positions can be linked in parent-child relationships.

### What is "position linking"?

**Position linking** connects related positions:

```
Supply USDC (parent)
  └─ Borrow ETH (child of supply)
       └─ LP ETH-USDC (child of borrow)
```

This enables:

- Smart automation (auto-repay knows which debt to repay)
- Correct closure order (close children before parents)
- Risk tracking (show relationship in dashboard)

See [Position Linking](../chapter-5-architecture/position-linking.md) for details.

### Can I have multiple positions?

**Yes!** You can have as many positions as you want:

- Multiple Aave supplies (different assets)
- Multiple borrows (against different collateral)
- Multiple LP positions (different pairs)
- Complex strategies with many linked positions

### How do I close a position?

**Manual:**

```javascript
// Close LP position
await proxy.multicall([
  uniswapConnector.decreaseLiquidity(positionId, maxLiquidity),
  uniswapConnector.collect(positionId),
])

// Repay borrow
await aaveConnector.repay(borrowPositionId, maxAmount)

// Withdraw supply
await aaveConnector.withdraw(supplyPositionId, maxAmount)
```

**Emergency:** Use [Emergency Exit](../chapter-2-how-it-works/emergency-exit.md) to close everything atomically.

## Risks

### What are the risks of using Hedgehog?

**Smart Contract Risks:**

- Hedgehog contract bugs (mitigated by audits)
- Aave/Uniswap bugs (battle-tested, but not zero risk)
- Oracle manipulation (use reputable oracles)

**Economic Risks:**

- Impermanent loss (LP positions)
- Liquidation risk (leveraged positions)
- Market volatility (price changes)

**Operational Risks:**

- Gas costs (can eat into profits on small positions)
- Bot failures (you can always execute manually)
- Strategy configuration errors (start small, test thoroughly)

### Can I get liquidated?

**Yes,** if you borrow on Aave and your health factor drops below 1.0.

**How to avoid:**

- Enable [Auto-Repay](../chapter-3-automation/strategies/auto-repay.md) strategy
- Keep health factor >1.5
- Don't over-leverage
- Monitor during high volatility
- Use stablecoin collateral

See [Health Factor Management](../chapter-3-automation/health-factor.md) for details.

### What is impermanent loss?

**Impermanent loss** is the opportunity cost of providing liquidity vs holding tokens.

See [Impermanent Loss](../chapter-4-core-concepts/impermanent-loss.md) for comprehensive explanation.

**How Hedgehog helps:**

- Auto-rebalance minimizes range risk
- Auto-compound maximizes fee generation
- Delta-neutral strategies hedge price exposure

### Can I lose all my money?

**Theoretically yes,** as with any DeFi protocol:

- Smart contract bug drains funds (rare, but possible)
- Extreme market movements (liquidation, IL)
- Oracle manipulation (also rare)

**How to protect yourself:**

- Start with small amounts
- Understand the strategies
- Enable automation for protection
- Diversify across protocols
- Never invest more than you can afford to lose

## Technical

### What is a "proxy" contract?

Your **HH proxy** is a smart contract wallet that:

- Holds all your positions
- Executes operations on your behalf
- You own and control completely

Think of it as your personal DeFi vault.

See [Creating Your Proxy](../chapter-2-how-it-works/creating-a-proxy.md).

### What is "delegatecall"?

**Delegatecall** is how connectors execute in your proxy's context:

- Connector code runs
- Uses proxy's storage
- Operates as if proxy called the protocol
- Gas efficient, secure, composable

See [Key Components](../chapter-5-architecture/key-components.md) for technical details.

### Do I need to trust the Hedgehog team?

**Minimal trust required:**

- Code is open-source (verify yourself)
- You maintain custody (funds in your proxy)
- Audited by third parties
- You can fork and run yourself

**What you do trust:**

- Smart contract code (audited)
- Frontend UI (could show wrong data - always verify on-chain)
- Bot infrastructure (optional - can run your own)

### Can Hedgehog be shut down or censored?

**No:**

- Smart contracts are on-chain (permanent)
- No admin keys to freeze funds
- You can interact directly via Etherscan
- Multiple bot operators (decentralized)
- Open-source (anyone can fork)

## Support

### Where can I get help?

**Resources:**

- [Documentation](../README.md)
- [Discord](#) - Community support
- [Twitter](#) - Updates and announcements
- [GitHub](#) - Technical issues

### How do I report a bug?

**Security bugs:**

- Email: security@hedgehogprotocol.com
- Bug bounty: [Immunefi link]

**Other bugs:**

- GitHub issues: [Link]
- Discord: #bug-reports

### Is there a tutorial?

**Yes! See:**

- [How Hedgehog Works](../chapter-2-how-it-works/README.md)
- [Creating Your Proxy](../chapter-2-how-it-works/creating-a-proxy.md)
- [Dashboard Guide](../chapter-2-how-it-works/dashboard.md)
- [Video Tutorials](#) (coming soon)

---

**Still have questions?** Ask in [Discord](#) or [open a GitHub discussion](#).

[Back to Documentation](../README.md)
