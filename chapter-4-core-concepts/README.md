# DeFi Fundamentals

## Understanding Core Concepts

Before diving deep into Hedgehog's technical implementation, it's important to understand the fundamental DeFi concepts that make our protocol possible.

## What You'll Learn

This chapter covers the essential DeFi building blocks:

- **[Liquidity Pools](liquidity-pools.md)** - How AMMs work and why liquidity provision is profitable
- **[Impermanent Loss](impermanent-loss.md)** - The hidden cost of being an LP and how to measure it
- **[Hedging Strategies](hedging-strategies.md)** - How to protect your positions from adverse price movements
- **[Delta-Neutral Positions](delta-neutral.md)** - The holy grail of DeFi: earning yield without market risk
- **[Competitive Advantage](competitive-advantage.md)** - How Hedgehog compares to alternatives

## Why These Concepts Matter

Hedgehog Protocol automates complex DeFi strategies that combine these concepts:

**Example: Delta-Neutral LP Strategy**
```
1. Supply USDC to Aave (earn lending APY)
   ↓
2. Borrow ETH against USDC (pay borrowing APY)
   ↓
3. Create ETH-USDC LP position (earn swap fees)
   ↓
Result: LP fees + lending APY - borrowing cost = net yield with minimal ETH price exposure
```

Understanding these fundamentals will help you:
- Choose the right strategies for your risk tolerance
- Understand automation decisions
- Optimize your positions manually when needed

---

[Continue to Liquidity Pools →](liquidity-pools.md)
