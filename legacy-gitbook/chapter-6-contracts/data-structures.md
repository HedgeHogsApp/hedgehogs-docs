# Data Structures

## Overview

Hedgehog Protocol uses several key data structures to track positions, store metadata, and manage automation. This section details the core data structures and their usage.

## Position Structure

### Position

The core data structure representing any DeFi position:

```solidity
struct Position {
    bytes32 id;                     // Unique position identifier
    PositionType positionType;      // Type of position
    address protocol;               // Protocol address
    bytes32 parentId;               // Parent position ID (0x0 if root)
    mapping(bytes32 => bytes) data; // Flexible key-value storage
    bool active;                    // Is position currently active
}
```

### Position Types

```solidity
enum PositionType {
    LENDING,      // Aave supply position
    BORROWING,    // Aave borrow position
    LIQUIDITY,    // Uniswap V3 LP position
    FARMING,      // Staking for rewards
    REWARD        // Claimable rewards position
}
```

### Position Metadata

Positions store protocol-specific data using key-value pairs:

```solidity
// Store data
HHStorageLib.setPositionData(positionId, "asset", abi.encode(USDC));
HHStorageLib.setPositionData(positionId, "amount", abi.encode(10000e6));
HHStorageLib.setPositionData(positionId, "timestamp", abi.encode(block.timestamp));

// Retrieve data
bytes memory assetData = HHStorageLib.getPositionData(positionId, "asset");
address asset = abi.decode(assetData, (address));
```

### Common Metadata Keys

| Key | Data Type | Used By | Description |
|-----|-----------|---------|-------------|
| `asset` | `address` | Aave positions | Token address |
| `amount` | `uint256` | Aave positions | Supplied/borrowed amount |
| `tokenId` | `uint256` | Uniswap positions | NFT token ID |
| `token0` | `address` | Uniswap positions | First token in pair |
| `token1` | `address` | Uniswap positions | Second token in pair |
| `fee` | `uint24` | Uniswap positions | Fee tier (500, 3000, 10000) |
| `tickLower` | `int24` | Uniswap positions | Lower tick boundary |
| `tickUpper` | `int24` | Uniswap positions | Upper tick boundary |
| `liquidity` | `uint128` | Uniswap positions | Current liquidity amount |

## Uniswap V3 Structures

### MintParams

Parameters for minting a new Uniswap V3 position:

```solidity
struct MintParams {
    uint256 amount0;       // Amount of token0 to add
    uint256 amount1;       // Amount of token1 to add
    int24 tickLower;       // Lower tick boundary
    int24 tickUpper;       // Upper tick boundary
    uint256 amount0Min;    // Min amount0 (slippage protection)
    uint256 amount1Min;    // Min amount1 (slippage protection)
}
```

**Example:**
```javascript
const mintParams = {
    amount0: ethers.utils.parseEther("1.0"),      // 1 ETH
    amount1: ethers.utils.parseUnits("2000", 6),  // 2000 USDC
    tickLower: -204240,                            // ~$1,900
    tickUpper: -201240,                            // ~$2,100
    amount0Min: ethers.utils.parseEther("0.95"),  // 5% slippage
    amount1Min: ethers.utils.parseUnits("1900", 6)
};
```

### IncreaseLiquidityParams

Parameters for adding liquidity to existing position:

```solidity
struct IncreaseLiquidityParams {
    uint256 tokenId;       // NFT token ID
    uint256 amount0;       // Additional token0
    uint256 amount1;       // Additional token1
    uint256 amount0Min;    // Min amount0 (slippage)
    uint256 amount1Min;    // Min amount1 (slippage)
}
```

### DecreaseLiquidityParams

Parameters for removing liquidity:

```solidity
struct DecreaseLiquidityParams {
    uint256 tokenId;       // NFT token ID
    uint128 liquidity;     // Amount of liquidity to remove
    uint256 amount0Min;    // Min token0 to receive
    uint256 amount1Min;    // Min token1 to receive
}
```

## Strategy Configuration Structures

### RebalanceConfig

Configuration for Auto-Rebalance strategy:

```solidity
struct RebalanceConfig {
    uint256 priceDeviationBps;  // Trigger threshold (basis points)
    uint24 newRangeWidth;       // Width of new range
    uint256 minLiquidityValue;  // Min value to rebalance
    uint24 slippageBps;         // Max slippage tolerance
}
```

### CompoundConfig

Configuration for Auto-Compound strategy:

```solidity
struct CompoundConfig {
    uint256 minFeesValue;       // Min fees to compound
    uint256 compoundFrequency;  // Min time between compounds
    uint24 slippageBps;         // Max slippage
    bool autoRebalance;         // Rebalance when compounding
}
```

### RepayConfig

Configuration for Auto-Repay strategy:

```solidity
struct RepayConfig {
    uint256 triggerHealthFactor;  // Trigger when HF < this
    uint256 targetHealthFactor;   // Repay to reach this HF
    uint256 maxRepayPercentage;   // Max % of debt per tx
    uint24 swapPoolFee;           // Uniswap fee tier
    uint256 minAmountOut;         // Min tokens from swap
    bool useATokens;              // Use aTokens if available
}
```

## Storage Patterns

### Mapping-Based Storage

Hedgehog uses mappings for gas-efficient storage:

```solidity
// HHStorage.sol
contract HHStorage {
    // Position tracking
    mapping(bytes32 => Position) public positions;
    mapping(uint256 => bytes32) public activePositions;
    uint256 public activePositionCount;

    // Strategy preferences
    mapping(bytes32 => mapping(address => bool)) public strategyEnabled;

    // Approvals
    mapping(address => bool) public isApproved;
}
```

**Benefits:**
- O(1) lookup time
- No array iteration
- Lower gas costs for large datasets

### Key-Value Pattern

Flexible metadata storage within positions:

```solidity
// Position-specific data
mapping(bytes32 => bytes) data;

// Set any data type
function setPositionData(bytes32 positionId, bytes32 key, bytes memory value) internal {
    positions[positionId].data[key] = value;
}

// Get any data type
function getPositionData(bytes32 positionId, bytes32 key) internal view returns (bytes memory) {
    return positions[positionId].data[key];
}
```

**Benefits:**
- Protocol-agnostic storage
- No struct changes needed for new protocols
- Efficient for sparse data

## Event Structures

### Position Events

```solidity
event PositionCreated(
    bytes32 indexed positionId,
    PositionType indexed positionType,
    address indexed protocol,
    bytes32 parentId
);

event PositionClosed(
    bytes32 indexed positionId
);

event PositionDataUpdated(
    bytes32 indexed positionId,
    bytes32 indexed key,
    bytes value
);
```

### Strategy Events

```solidity
event StrategyEnabled(
    bytes32 indexed positionId,
    address indexed strategy,
    bool enabled
);

event StrategyExecuted(
    bytes32 indexed positionId,
    address indexed strategy,
    uint256 value,
    uint256 fee
);

event StrategyConfigUpdated(
    bytes32 indexed positionId,
    address indexed strategy
);
```

### Fee Events

```solidity
event FeeCollected(
    address indexed token,
    uint256 amount,
    address indexed collector,
    bytes32 operation
);

event FeeRateUpdated(
    bytes32 indexed operation,
    uint256 userFeeBps,
    uint256 automationFeeBps
);
```

## Helper Functions

### Position ID Generation

```solidity
function generatePositionId(
    PositionType positionType,
    address protocol,
    address owner,
    uint256 nonce
) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(
        positionType,
        protocol,
        owner,
        nonce,
        block.timestamp
    ));
}
```

### Tick Math Helpers

```solidity
// Convert price to tick
function priceToTick(uint256 price, uint8 decimals0, uint8 decimals1) public pure returns (int24) {
    // Implementation based on Uniswap V3 tick math
}

// Convert tick to price
function tickToPrice(int24 tick, uint8 decimals0, uint8 decimals1) public pure returns (uint256) {
    // Implementation based on Uniswap V3 tick math
}

// Calculate tick range for given width
function calculateTickRange(
    int24 currentTick,
    uint24 widthBps
) public pure returns (int24 lower, int24 upper) {
    int24 tickSpacing = 60; // For 0.3% fee tier
    int24 range = int24(uint24(widthBps) * 60 / 10000);

    lower = (currentTick - range) / tickSpacing * tickSpacing;
    upper = (currentTick + range) / tickSpacing * tickSpacing;
}
```

## Gas Optimization Techniques

### Packed Structs

```solidity
// Pack small values together to save storage slots
struct PackedConfig {
    uint24 fee;          // 3 bytes
    uint24 slippageBps;  // 3 bytes
    bool autoRebalance;  // 1 byte
    // Total: 7 bytes (fits in 1 slot with other data)
}
```

### Bitpacking for Flags

```solidity
// Store multiple boolean flags in single uint256
uint256 public flags;

function setFlag(uint8 index, bool value) internal {
    if (value) {
        flags |= (1 << index);
    } else {
        flags &= ~(1 << index);
    }
}

function getFlag(uint8 index) internal view returns (bool) {
    return (flags & (1 << index)) != 0;
}
```

### Calldata Optimization

```solidity
// Use calldata instead of memory for read-only structs
function processParams(MintParams calldata params) external {
    // Cheaper than MintParams memory params
    // No copy from calldata to memory
}
```

## Key Takeaways

✅ **Position structure** - Core data model for all DeFi positions
✅ **Flexible metadata** - Key-value storage for protocol-specific data
✅ **Strategy configs** - Typed configs for each automation strategy
✅ **Gas optimization** - Mappings, packed structs, calldata usage
✅ **Event-driven** - Comprehensive events for indexing/monitoring

---

[Next: Security Audits →](audits.md)

[Back to Smart Contracts](README.md)
