# Manual Adjustments

## When to Manually Adjust Positions

While Hedgehog's automation handles most position management, there are times when you'll want manual control:

- **Strategic rebalancing** - Changing your risk profile
- **Taking profits** - Withdrawing gains
- **Changing strategies** - Switching from one LP to another
- **Fine-tuning ranges** - Adjusting Uniswap V3 price ranges

## Common Manual Operations

### Adjust LP Range

Manually change your Uniswap V3 position's price range:

```javascript
// 1. Decrease liquidity from current range
await proxy.multicall([
  uniswapConnector.decreaseLiquidity(positionId, liquidityAmount)
]);

// 2. Collect the tokens
await proxy.multicall([
  uniswapConnector.collect(positionId)
]);

// 3. Create new position with different range
await proxy.multicall([
  uniswapConnector.mintPosition(token0, token1, newRange, amounts)
]);
```

### Partial Withdrawal

Withdraw some collateral while keeping position active:

```javascript
// Withdraw 20% of supplied USDC
await proxy.multicall([
  aaveConnector.withdraw(positionId, partialAmount)
]);
```

### Add Collateral

Increase collateral to improve health factor:

```javascript
await proxy.multicall([
  aaveConnector.supply(USDC, additionalAmount, existingPositionId)
]);
```

### Partial Debt Repayment

Repay portion of borrowed amount:

```javascript
await proxy.multicall([
  aaveConnector.repay(borrowPositionId, repayAmount)
]);
```

## Manual vs Automated

| Operation | Manual | Automated | Recommendation |
|-----------|--------|-----------|----------------|
| **LP Rebalancing** | When you want specific range | Let bot handle | Use automation |
| **Compounding** | If you prefer control timing | Bot compounds optimally | Use automation |
| **Health Factor** | Emergency adjustments | Bot maintains target | Use automation |
| **Strategy Changes** | You decide new strategy | N/A | Manual only |
| **Profit Taking** | You decide when to exit | N/A | Manual only |

## Safety Tips

✅ **Check health factor** before withdrawing collateral
✅ **Monitor gas prices** - Wait for low gas if not urgent
✅ **Use slippage protection** on all swap operations
✅ **Test with small amounts** first if unsure
✅ **Keep automation enabled** for routine management

*Full manual adjustment guide coming soon*

---

[Back to User Guides](README.md)
