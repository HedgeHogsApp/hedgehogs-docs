# Position Linking

## Why Link Positions?

**Position linking** creates relationships between DeFi positions to enable intelligent automation and dependency tracking.

**The Problem Without Linking:**
```
You have:
- Aave supply position (USDC collateral)
- Aave borrow position (ETH debt)
- Uniswap LP position (ETH-USDC)

Question: Which LP fees should repay which debt?
Answer: Without linking, automation doesn't know!
```

**The Solution With Linking:**
```
Supply USDC
  └─ Borrow ETH (child of supply)
       └─ LP ETH-USDC (child of borrow)

Now automation knows:
- LP fees should repay ETH debt
- ETH debt health affects this specific LP
- Closing borrow should handle dependent LP first
```

## Parent-Child Relationships

### Hierarchy Model

Hedgehog uses a **hierarchical position model**:

```solidity
struct Position {
    bytes32 id;               // Position ID
    PositionType type;        // LENDING, BORROWING, LIQUIDITY
    address protocol;         // Aave, Uniswap, etc.
    bytes32 parentId;         // Parent position ID (or 0x0 if root)
    bool active;              // Is position active?
}
```

**Rules:**
1. **Root positions** have `parentId = bytes32(0)`
2. **Child positions** have `parentId = <parent's ID>`
3. **Depth limit**: Reasonable limit (e.g., 5 levels) to prevent abuse
4. **Single parent**: Each position has at most one parent

### Example Hierarchies

**Simple Hedge:**
```
Supply USDC (root)
  └─ Borrow ETH
       └─ LP ETH-USDC
```

**Multi-LP Strategy:**
```
Supply USDC (root)
  ├─ Borrow ETH
  │    └─ LP ETH-USDC
  └─ Borrow WBTC
       └─ LP WBTC-USDC
```

**Leveraged Position:**
```
Supply USDC (root)
  └─ Borrow USDC
       └─ Supply USDC (re-supply borrowed)
            └─ Borrow USDC
                 └─ LP USDC-USDT
```

## Creating Linked Positions

### Via Multicall

```javascript
// Create linked positions in single transaction
const tx = await proxy.multicall([
  // 1. Supply USDC (root position)
  aaveConnector.interface.encodeFunctionData("supply", [
    USDC,
    ethers.utils.parseUnits("10000", 6),
    ethers.constants.HashZero // No parent
  ]),

  // 2. Borrow ETH (child of supply)
  aaveConnector.interface.encodeFunctionData("borrow", [
    WETH,
    ethers.utils.parseEther("2.5"),
    supplyPositionId // Parent is supply
  ]),

  // 3. Create LP (child of borrow)
  uniswapConnector.interface.encodeFunctionData("mintPositionUser", [
    WETH,
    USDC,
    500,
    {
      amount0: ethers.utils.parseEther("2.5"),
      amount1: ethers.utils.parseUnits("5000", 6),
      tickLower: -204240,
      tickUpper: -201240
    },
    borrowPositionId // Parent is borrow
  ])
]);
```

**Note:** Position IDs are returned from each operation and used in subsequent calls.

### Automatic Linking in Connectors

Connectors automatically handle linking:

```solidity
// AaveV3Connector.sol
function borrow(
    address asset,
    uint256 amount,
    bytes32 supplyPositionId // Parent position
) external returns (bytes32 borrowPositionId) {
    // Create child position linked to supply position
    borrowPositionId = HHStorageLib.createPosition(
        PositionType.BORROWING,
        address(aavePool),
        supplyPositionId // Set parent
    );

    // Store position metadata
    HHStorageLib.setPositionData(borrowPositionId, "asset", abi.encode(asset));
    HHStorageLib.setPositionData(borrowPositionId, "amount", abi.encode(amount));

    // Execute borrow on Aave
    aavePool.borrow(asset, amount, 2, 0, address(this));

    emit BorrowCreated(borrowPositionId, asset, amount, supplyPositionId);
}
```

## Benefits of Position Linking

### 1. Intelligent Automation

**Auto-Repay knows which fees repay which debt:**

```solidity
// AutoRepayStrategy.sol
function executeStrategy(bytes32 lpPositionId) external {
    // Get LP position
    Position memory lpPosition = HHStorageLib.getPosition(lpPositionId);

    // Get parent (borrow position)
    bytes32 borrowPositionId = lpPosition.parentId;
    Position memory borrowPosition = HHStorageLib.getPosition(borrowPositionId);

    // Get grandparent (supply position)
    bytes32 supplyPositionId = borrowPosition.parentId;

    // Now we know:
    // - Which LP to collect fees from
    // - Which debt to repay
    // - Which collateral backs it

    // Collect LP fees
    (uint256 amount0, uint256 amount1) = uniswapConnector.collect(lpPositionId);

    // Swap to debt asset if needed
    uint256 repayAmount = swapToDebtAsset(amount0, amount1, debtAsset);

    // Repay debt
    aaveConnector.repay(borrowPositionId, repayAmount);

    // Check health factor of supply position
    require(getHealthFactor(supplyPositionId) > MIN_HEALTH_FACTOR, "HF too low");
}
```

### 2. Dependency Tracking

**Emergency exit handles dependencies correctly:**

```solidity
// EmergencyExitLib.sol
function emergencyExitAllPositions() external onlyOwner {
    bytes32[] memory positions = HHStorageLib.getActivePositions();

    // Sort positions by dependency (children first)
    bytes32[] memory sorted = topologicalSort(positions);

    // Close in reverse dependency order
    for (uint256 i = 0; i < sorted.length; i++) {
        Position memory pos = HHStorageLib.getPosition(sorted[i]);

        if (pos.positionType == PositionType.LIQUIDITY) {
            // Close LP first (deepest child)
            uniswapConnector.decreaseLiquidity(pos.id, type(uint128).max);
            uniswapConnector.collect(pos.id);
        } else if (pos.positionType == PositionType.BORROWING) {
            // Repay debt second
            aaveConnector.repay(pos.id, type(uint256).max);
        } else if (pos.positionType == PositionType.LENDING) {
            // Withdraw collateral last (root)
            aaveConnector.withdraw(pos.id, type(uint256).max);
        }
    }
}
```

**Result:** Positions closed in correct order without errors.

### 3. Risk Monitoring

**Dashboard can show position health by hierarchy:**

```javascript
// Frontend code
async function getPositionTree(proxyAddress) {
  const positions = await proxy.getActivePositions();

  // Build tree structure
  const tree = {};

  for (const posId of positions) {
    const position = await getPosition(posId);

    if (position.parentId === ethers.constants.HashZero) {
      // Root position
      tree[posId] = {
        ...position,
        children: []
      };
    } else {
      // Child position - add to parent
      const parent = findPosition(tree, position.parentId);
      parent.children.push({
        ...position,
        children: []
      });
    }
  }

  return tree;
}

// Display with risk indicators
function renderPositionTree(tree) {
  return (
    <div>
      {Object.values(tree).map(root => (
        <PositionNode position={root} depth={0} />
      ))}
    </div>
  );
}

function PositionNode({ position, depth }) {
  const healthFactor = calculateHealthFactor(position);
  const risk = getRiskLevel(healthFactor); // "safe", "warning", "danger"

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div className={`position-${risk}`}>
        {position.type}: {position.asset}
        {risk === 'danger' && <span>⚠️ Low Health Factor!</span>}
      </div>

      {position.children.map(child => (
        <PositionNode position={child} depth={depth + 1} />
      ))}
    </div>
  );
}
```

### 4. Gas Optimization

**Batched operations on related positions:**

```javascript
// Instead of 3 separate transactions:
await uniswapConnector.collect(lpPositionId);        // Tx 1: $15 gas
await aaveConnector.repay(borrowPositionId, amount); // Tx 2: $20 gas
await updateHealthFactor(supplyPositionId);          // Tx 3: $10 gas
// Total: $45 gas

// Use multicall with linked positions:
await proxy.multicall([
  uniswapConnector.interface.encodeFunctionData("collect", [lpPositionId]),
  aaveConnector.interface.encodeFunctionData("repay", [borrowPositionId, amount]),
  // Health factor updated automatically via link
]);
// Total: $25 gas (44% savings)
```

## Querying Position Relationships

### Get Position Hierarchy

```solidity
// HHStorage.sol
function getPositionHierarchy(bytes32 positionId) external view returns (
    bytes32[] memory ancestors,
    bytes32[] memory descendants
) {
    // Get all ancestors (parents, grandparents, etc.)
    ancestors = new bytes32[](MAX_DEPTH);
    uint256 ancestorCount = 0;

    bytes32 current = positionId;
    while (current != bytes32(0) && ancestorCount < MAX_DEPTH) {
        Position storage pos = positions[current];
        if (pos.parentId != bytes32(0)) {
            ancestors[ancestorCount] = pos.parentId;
            ancestorCount++;
            current = pos.parentId;
        } else {
            break;
        }
    }

    // Trim array
    assembly {
        mstore(ancestors, ancestorCount)
    }

    // Get all descendants (children, grandchildren, etc.)
    descendants = getAllDescendants(positionId);

    return (ancestors, descendants);
}

function getAllDescendants(bytes32 positionId) internal view returns (bytes32[] memory) {
    // Recursive search for all children
    // Implementation details...
}
```

### Usage in Strategies

```javascript
// Check if LP position has borrow parent
const [ancestors, descendants] = await proxy.getPositionHierarchy(lpPositionId);

if (ancestors.length > 0) {
  // Has parent - check if it's a borrow position
  const parentPosition = await proxy.getPosition(ancestors[0]);

  if (parentPosition.positionType === PositionType.BORROWING) {
    // This LP is part of hedged strategy
    // Use Auto-Repay strategy
    await proxy.setStrategyEnabled(lpPositionId, AUTO_REPAY_STRATEGY, true);
  } else {
    // Standalone LP
    // Use Auto-Compound strategy only
    await proxy.setStrategyEnabled(lpPositionId, AUTO_COMPOUND_STRATEGY, true);
  }
}
```

## Best Practices

### 1. Always Link Related Positions

✅ **Do:**
```javascript
// Link borrow to its collateral
await aaveConnector.borrow(WETH, amount, supplyPositionId);

// Link LP to its funding source
await uniswapConnector.mintPositionUser(WETH, USDC, fee, params, borrowPositionId);
```

❌ **Don't:**
```javascript
// Create orphan positions
await aaveConnector.borrow(WETH, amount, ethers.constants.HashZero);
await uniswapConnector.mintPositionUser(WETH, USDC, fee, params, ethers.constants.HashZero);
// Automation won't know they're related!
```

### 2. Use Multicall for Linked Creation

✅ **Do:**
```javascript
// Create entire hierarchy in one transaction
await proxy.multicall([
  aaveConnector.interface.encodeFunctionData("supply", [...]),
  aaveConnector.interface.encodeFunctionData("borrow", [..., supplyPositionId]),
  uniswapConnector.interface.encodeFunctionData("mintPositionUser", [..., borrowPositionId])
]);
```

❌ **Don't:**
```javascript
// Create positions separately
await aaveConnector.supply(...);
await aaveConnector.borrow(..., supplyPositionId);
await uniswapConnector.mintPositionUser(..., borrowPositionId);
// 3x gas cost, 3x wait time
```

### 3. Check Hierarchy Before Closing

✅ **Do:**
```javascript
// Check for children before closing parent
const [, descendants] = await proxy.getPositionHierarchy(supplyPositionId);

if (descendants.length > 0) {
  // Close children first
  for (const childId of descendants.reverse()) {
    await closePosition(childId);
  }
}

// Now safe to close parent
await aaveConnector.withdraw(supplyPositionId, amount);
```

❌ **Don't:**
```javascript
// Try to close parent with active children
await aaveConnector.withdraw(supplyPositionId, amount);
// May fail if borrowed amount is being used in LP
```

## Advanced: Custom Position Metadata

**Store custom data for automation:**

```solidity
// Store target health factor for auto-repay
HHStorageLib.setPositionData(
    supplyPositionId,
    "targetHealthFactor",
    abi.encode(1.5e18) // 1.5
);

// Store rebalance threshold for auto-rebalance
HHStorageLib.setPositionData(
    lpPositionId,
    "rebalanceThreshold",
    abi.encode(10) // 10% out of range triggers rebalance
);

// Retrieve in strategy
function canExecuteStrategy(bytes32 positionId) external view returns (bool) {
    bytes memory data = HHStorageLib.getPositionData(positionId, "rebalanceThreshold");
    uint256 threshold = abi.decode(data, (uint256));

    uint256 currentDeviation = calculatePriceDeviation(positionId);

    return currentDeviation > threshold;
}
```

## Key Takeaways

✅ Position linking creates parent-child relationships
✅ Enables intelligent automation (auto-repay knows which debt to repay)
✅ Ensures correct dependency handling (close children before parents)
✅ Improves UX (dashboard shows relationships, risk propagation)
✅ Gas savings via batched operations on related positions
✅ Always link positions that are economically related

---

[Back to Technical Architecture](README.md)
