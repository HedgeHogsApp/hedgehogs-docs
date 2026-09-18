# Chapter 2: How It Works

## Your Smart Contract, Your Rules

When you start using Hedgehog, you deploy your own smart contract. Think of it as your personal DeFi manager that lives on-chain.

**Setup takes three steps:**

First, you deploy your HH Proxy contract. Cost: about $10 in gas, one time. This contract is yours—you own it, you control it, nobody else can touch it.

Second, you approve your proxy to spend your tokens. USDC? Approve once. ETH? Approve once. Each token costs $2-3 in gas. After that, you're done approving forever. Your proxy handles all the protocol approvals from here on out.

Third—and this is optional—you can approve a bot address to help manage your positions. Think of it like giving a financial advisor limited power of attorney. The bot can rebalance, compound, and optimize. It cannot withdraw your funds or do anything you don't want. You can revoke this permission instantly.

Total setup cost: $15-25. Compare that to $150-300 for traditional DeFi.

## What Your Proxy Actually Does

Your proxy sits between you and DeFi protocols. When you want to supply USDC to Aave, you tell your proxy. The proxy pulls the tokens from your wallet (with a small 0.5% fee), approves Aave if needed, and deposits them. Aave mints aUSDC tokens to your proxy, not to you directly.

This is the key insight: **your proxy owns all your positions**.

Your proxy holds the aUSDC earning interest. Your proxy owns the Uniswap LP NFT earning fees. This is what makes automation possible. Because the proxy owns everything, a bot with permission can manage it all. The bot can't steal anything—you're still the owner and can take back control anytime—but it can optimize positions on your behalf.

When you create a Uniswap V3 LP position through your proxy, here's what happens:

You send ETH and USDC to your proxy. The proxy deducts a 0.5% fee and deposits the rest into Uniswap. Uniswap mints an NFT representing your LP position and sends it to your proxy. The proxy stores this position in its internal tracking system. Now both you and any approved bots can see this position exists.

If you enable AutoRebalance on this position, a bot starts monitoring it. Every few blocks, the bot checks: is the current ETH price still within this LP's range? If not, the bot executes a rebalance. It removes liquidity from the old range, calculates a new optimal range around the current price, and creates a fresh LP position there. The bot charges a 0.1% automation fee for this service.

You pay 0.1% automation fee versus $15+ in manual gas. The bot acts faster than you could. Your position stays profitable instead of sitting idle out of range.

## The Automation Advantage

Here's where it gets interesting.

Traditional DeFi: You need to check your positions constantly. Is your Uniswap LP still in range? Are your rewards worth claiming yet? Is your Aave health factor safe? Every action costs gas. Every delay costs opportunity.

With Hedgehog: Bots do this for you. They check every block. They execute instantly when conditions are met. They batch operations to save gas. And they charge lower fees than you'd pay doing it manually.

**Real example: A $10k position**

You supply $5k USDC to Aave. Borrow $3k ETH against it. Create a $6k ETH-USDC LP on Uniswap with your borrowed ETH plus your own USDC.

Setup costs: $16 total (proxy + two token approvals). Entry fees: $55 total (0.5% on deposits).

Now enable automation. Your LP goes out of range twice a month. AutoRebalance handles it—$12/month in automation fees versus $30/month in manual gas. Your LP generates fees daily. AutoCompound reinvests them—$15/year in automation fees versus $180/year in manual gas. Your health factor fluctuates. AutoRepay manages it using your LP earnings—$10/year versus risking liquidation.

**Annual costs:**
- Traditional DeFi: $16 setup + $55 entry + $360 rebalancing + $180 compounding + liquidation risk = $611+
- Hedgehog: $16 setup + $55 entry + $144 automation + $15 compounding + $10 management = $240

You save $371/year plus liquidation protection plus you never have to check your positions.

## Why the Fee Structure Makes Sense

Look at the fee table:

| Operation | You Do It Manually | Bot Does It |
|-----------|-------------------|-------------|
| Supply to Aave | 0.5% | 0.1% |
| Rebalance LP | 0.5% | 0.1% |
| Compound fees | 0.5% | 0.2% |
| Repay debt | 0.5% | 0.15% |

You pay more when you do things manually. You pay less when bots do it for you.

Why? Because we want you to use automation. Manual operations are inefficient—you're slower, you miss opportunities, you pay full gas. Automation is better—faster execution, no missed opportunities, batched transactions. Lower automation fees mean you save money and get better returns.

This isn't some trick. The protocol makes money either way. But automated positions generate more volume, which means more total fees, which means the protocol can charge you less per operation and still come out ahead. Aligned incentives.

## What You Can Actually Do

Traditional DeFi users are stuck with simple strategies. Supply here, borrow there, maybe LP if you're ambitious. Anything more complex requires manual coordination that costs too much gas.

Hedgehog users can run institutional strategies:

**Leveraged Yield Farming:** Supply $10k USDC to Aave. Borrow $7k ETH against it. Use that ETH plus $7k more USDC to create a $14k LP on Uniswap. You're earning 40% APY on $14k while paying 3% borrow rate on $7k. Net result: 53.9% APY on your original $10k. The bot keeps your LP in range and manages your health factor. If ETH price moves too much, it automatically repays some debt to prevent liquidation.

**Delta-Neutral Farming:** Supply $5k USDC to Aave. Borrow $5k worth of ETH. Create a $10k ETH-USDC LP. Your net ETH exposure is zero—you're long ETH in the LP and short ETH in your debt. ETH goes up? Your LP gains, your debt increases, they cancel out. ETH goes down? Your debt decreases, your LP loses, they cancel out. You earn trading fees with almost no price risk. The bot rebalances when needed and adjusts your hedge ratio as the price moves.

These strategies were only practical for people running their own infrastructure. Now anyone can access them.

## Your Safety Net

You might be thinking: what if the bot goes rogue? What if something breaks?

Three answers:

**First:** You can emergency exit anytime. One transaction, every position closes, everything comes back to your wallet. The bot can't prevent this. Even if the bot is actively trying to stop you (it's not, but hypothetically), you win. You're the owner.

**Second:** You can revoke bot access instantly. The bot loses permission, your positions stay open, you can manage them manually. Re-enable the bot later if you want.

**Third:** You can always do everything manually. Don't want automation? Don't enable it. Want automation for some positions but not others? Choose per position. The proxy is your smart contract. Your rules.

The trust model is simple:
- You own the proxy (full control)
- Bot helps manage positions (limited permission, revocable)
- Protocol has no admin keys (no one can rug you)

This is the same security model as using DeFi directly, except you get automation on top.
