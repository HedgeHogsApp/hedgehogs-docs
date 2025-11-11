# Liquidity Pools

## What is a Liquidity Pool?

A **liquidity pool** is a smart contract holding reserves of two tokens that enables decentralized trading via an Automated Market Maker (AMM).

**Simple analogy:**
Think of a liquidity pool like a currency exchange booth at an airport, but:
- No human operator needed
- Prices adjust automatically based on supply/demand
- Anyone can be the "booth owner" and earn fees

## How AMMs Work

### Constant Product Formula

Uniswap V2 uses the constant product formula:

```
x * y = k
```

Where:
- `x` = amount of token0
- `y` = amount of token1
- `k` = constant product

**Example:**
```
Pool contains:
- 10 ETH (x)
- 20,000 USDC (y)
- k = 10 * 20,000 = 200,000

Price of ETH = y/x = 20,000/10 = 2,000 USDC per ETH

After trade (buy 1 ETH):
- 9 ETH remains
- y must equal k/x = 200,000/9 = 22,222 USDC
- Trader pays 2,222 USDC (including fee) for 1 ETH
- New price = 22,222/9 = 2,469 USDC per ETH (slippage!)
```

### Uniswap V3: Concentrated Liquidity

Hedgehog primarily uses **Uniswap V3**, which improves capital efficiency through **concentrated liquidity**:

**Traditional (V2):**
- Your liquidity spread across entire price range (0 to ∞)
- Capital inefficient: most liquidity never used

**Concentrated (V3):**
- You choose a price range (e.g., ETH between $1,800-$2,200)
- Your liquidity only active in that range
- Capital efficiency: 200x-4000x improvement possible

**Example:**
```
V2 Pool: Provide $10,000
- Liquidity spread from $0 to ∞
- Earns fees only when price crosses your share

V3 Pool: Provide $10,000 in $1,900-$2,100 range
- Acts like $200,000 of V2 liquidity within that range
- Earns 20x more fees... IF price stays in range
- Earns NOTHING if price exits range
```

## Providing Liquidity

### How to Become an LP

**Step 1: Deposit tokens**
```javascript
// Mint a new position in ETH-USDC pool
// Price range: $1,900 - $2,100
await proxy.multicall([
  uniswapConnector.mintPositionUser(
    WETH,
    USDC,
    500, // 0.05% fee tier
    {
      amount0: ethers.utils.parseEther("1"), // 1 ETH
      amount1: ethers.utils.parseUnits("2000", 6), // 2000 USDC
      tickLower: -204240, // $1,900
      tickUpper: -201240, // $2,100
    }
  )
]);
```

**Step 2: Earn fees**
- Every swap through your range pays you a portion of the 0.05% fee
- Fees accrue in both tokens
- You can collect anytime

**Step 3: Manage position**
- Price stays in range → earn fees
- Price exits range → stop earning (need to rebalance)
- Hedgehog's Auto-Rebalance handles this automatically

### LP Returns

**What you earn:**
1. **Trading fees** (primary source)
   - 0.05%, 0.3%, or 1% per trade (depending on fee tier)
   - Split proportionally among LPs

2. **Potential rewards** (protocol-dependent)
   - Some pools offer token incentives
   - Auto-Harvest strategy claims these

**What you pay:**
1. **Impermanent Loss** (see next section)
2. **Gas fees** (for minting, rebalancing, collecting)

## Fee Tiers

Uniswap V3 has three fee tiers optimized for different volatility:

| Fee Tier | Best For | Example Pools |
|----------|----------|---------------|
| **0.05%** | Stable pairs | USDC-USDT, DAI-USDC |
| **0.3%** | Standard pairs | ETH-USDC, WBTC-ETH |
| **1%** | Exotic/volatile | Low liquidity tokens |

**Choosing the right tier:**
- Lower fees = need more volume to profit
- Higher fees = compensate for higher risk
- Hedgehog strategies default to 0.3% (most liquid)

## Capital Efficiency

### V3 vs V2 Comparison

**Scenario: $10,000 capital, ETH at $2,000**

**Uniswap V2:**
```
Liquidity spread: $0 to ∞
Effective depth: $10,000
Daily volume in range: $500,000
Your share: 0.002%
Daily fees earned: $500,000 * 0.3% * 0.002% = $3
APY: $3 * 365 / $10,000 = 10.95%
```

**Uniswap V3 (narrow range):**
```
Liquidity spread: $1,900 to $2,100 (10% range)
Effective depth: $100,000 (10x concentrated)
Daily volume in range: $500,000
Your share: 0.02%
Daily fees earned: $500,000 * 0.3% * 0.02% = $30
APY: $30 * 365 / $10,000 = 109.5%
```

**10x better returns... but** you must stay in range.

## Managing Liquidity

### When to Rebalance

**Price exits your range:**
- Stop earning fees
- Position becomes 100% one token
- Need to create new position in current price range

**Example:**
```
Initial position: $1,900-$2,100
- ETH at $2,000: earning fees

ETH drops to $1,850:
- Position now 100% ETH (bought ETH all the way down)
- NOT earning fees (price below range)
- Need to rebalance to $1,750-$1,950 range
```

### Hedgehog's Auto-Rebalance

Instead of manually monitoring and rebalancing:

```javascript
// Enable auto-rebalance strategy
await proxy.setStrategyEnabled(
  lpPositionId,
  AUTO_REBALANCE_STRATEGY,
  true
);

// Bot monitors price and rebalances automatically:
// 1. Detects price exited range
// 2. Removes liquidity from old position
// 3. Swaps to maintain balance
// 4. Mints new position in current range
// 5. Charges 0.1% fee (much less than manual gas cost)
```

## Liquidity Mining

Some protocols incentivize liquidity with token rewards:

**Example:**
```
ETH-USDC pool on Uniswap V3:
- Trading fees: 50% APY
- UNI rewards: 20% APY
- Total APY: 70%

Hedgehog automation:
1. Auto-Compound: Reinvest trading fees
2. Auto-Harvest: Claim and compound UNI rewards
3. Auto-Rebalance: Keep position in range
```

## Risks

**1. Impermanent Loss** (see next section)
**2. Smart contract risk** (protocol hack)
**3. Range risk** (V3 specific - price exits range)
**4. Gas costs** (can eat into profits)

Hedgehog mitigates #3 and #4 through automation.

## Key Takeaways

✅ Liquidity pools enable decentralized trading via AMMs
✅ Uniswap V3's concentrated liquidity offers 10-100x capital efficiency
✅ LPs earn trading fees but must manage positions actively (or use Hedgehog)
✅ Choosing the right fee tier and price range is critical for profitability

---

[Next: Impermanent Loss →](impermanent-loss.md)

[Back to Core Concepts](README.md)
