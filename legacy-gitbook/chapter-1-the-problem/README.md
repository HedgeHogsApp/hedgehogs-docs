# Chapter 1: The Problem with DeFi Today

## You're Paying to Lose Money

Here's what happens when you try to use DeFi properly:

You want to supply USDC on Aave. That's one approval transaction—$20 in gas. Now you want to add liquidity on Uniswap V3. Another two approvals for the token pair—$40 more. Maybe diversify to Curve? Three more tokens, three more protocols—you're looking at $150-200 in approvals before you've made a single dollar.

And that's just the beginning.

Your Uniswap V3 position goes out of range overnight. You're earning zero fees until you notice and rebalance—another $15 in gas. This happens twice a month. Your rewards are sitting unclaimed, losing compound interest every day. When you finally claim and reinvest them, gas prices have spiked. You pay $50 for a transaction that should cost $10.

Meanwhile, you're supposed to be monitoring health factors, watching for liquidation risk, checking if your LP is still in range, calculating optimal rebalance times. You either spend 10 hours a month doing this, or you don't do it and lose money to inefficiency.

The sophisticated players—institutions, funds, trading firms—run automated systems. They rebalance instantly, compound continuously, never miss an opportunity. They get 2-3x the yields you do with the same capital.

**This is the real DeFi profitability gap.**

## How Hedgehog Fixes This

We looked at why automated DeFi works so well for institutions and asked: what if anyone could have this?

The answer wasn't another interface or dashboard. It was solving three fundamental problems:

**Problem 1: Approval costs make DeFi unprofitable for normal amounts**

Solution: You approve your personal smart contract once per token. That contract handles all protocol approvals for you, forever. Cost drops from $150-200 to $6-10. One-time.

**Problem 2: Manual management means you're always losing to the market**

Solution: Your positions run on autopilot. Bots monitor every block. When your LP goes out of range, it rebalances. When fees accumulate, they compound. When your health factor drops, debt gets repaid. You pay tiny automation fees (0.1-0.3%) instead of manual gas costs.

**Problem 3: You can't access sophisticated multi-protocol strategies**

Solution: Your smart contract can coordinate between Aave, Uniswap, and other protocols in a single transaction. Borrow here, LP there, auto-manage both. The same strategies institutions use, now available to everyone.

## The Numbers: Hedgehog vs. Traditional DeFi

**Scenario**: $10,000 invested, 3 protocols (Aave, Uniswap, Curve), 5 tokens

| Metric | Traditional DeFi | Hedgehog | Your Gain |
|--------|-----------------|----------|-----------|
| **Approval Costs** | $150-200 | $6-10 | **$190 saved** |
| **Manual Rebalancing** | 12 tx/month × $15 = $180/month | $0 (automated) | **$2,160/year saved** |
| **Missed Yields** | -30% (out of range, unclaimed rewards) | 0% (automated) | **+$900/year** |
| **Strategy Complexity** | Single protocol, manual | Multi-protocol, automated | **2-3x APY** |
| **Time Spent** | 10+ hours/month monitoring | 0 hours (set & forget) | **Your life back** |

**Total Edge**: $3,000-5,000/year per $10k invested + 2-3x better yields + time savings
