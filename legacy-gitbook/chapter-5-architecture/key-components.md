# Key Components

## System Architecture Overview

Hedgehog Protocol is built on a modular architecture with distinct components that work together to enable automated DeFi position management.

```
┌─────────────────────────────────────────────────────────┐
│                         User                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    HH Proxy (User's)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │              HHStorage                            │  │
│  │  - Position tracking                              │  │
│  │  - Parent-child relationships                     │  │
│  │  - Strategy preferences                           │  │
│  └──────────────────────────────────────────────────┘  │
└────┬────────────────────────────┬────────────────┬──────┘
     │                            │                │
     │ delegatecall               │ delegatecall   │ delegatecall
     ▼                            ▼                ▼
┌─────────────┐         ┌──────────────────┐  ┌──────────────┐
│   Aave      │         │   Uniswap V3     │  │  Strategies  │
│  Connector  │         │   Connector      │  │  (Auto-*)    │
└──────┬──────┘         └────────┬─────────┘  └──────┬───────┘
       │                         │                   │
       │ call                    │ call              │ call
       ▼                         ▼                   ▼
┌─────────────┐         ┌──────────────────┐  ┌──────────────┐
│  Aave V3    │         │   Uniswap V3     │  │ TransferLib  │
│  Pool       │         │   NFT Manager    │  │ FeesLib      │
└─────────────┘         └──────────────────┘  └──────────────┘
```

## Core Components

### 1. HH Proxy

**The user's smart contract wallet** - holds all positions and executes all operations.

**Key features:**
- **Ownership**: User is the owner, has full control
- **Delegation**: User can approve a bot address for automation
- **Isolation**: Each user has their own proxy
- **Upgradeability**: Can add new connectors without redeploying

**Main functions:**
```solidity
// Execute single call
function execute(address target, bytes calldata data) external onlyOwner;

// Execute multiple calls (batching)
function multicall(Call[] calldata calls) external returns (bytes[] memory);

// Approve bot for automation
function setApproved(address approved) external onlyOwner;

// Enable/disable strategies per position
function setStrategyEnabled(bytes32 positionId, address strategy, bool enabled) external onlyOwner;
```

**Access control:**
- **Owner only**: Token transfers, emergency exit, approval changes
- **Owner + Approved**: Strategy execution, position management
- **Anyone**: Read-only functions (position queries)

### 2. HHFactory

**Deploys user proxies** using the minimal proxy pattern (EIP-1167).

**Key features:**
- **Deterministic addresses**: Uses CREATE2 for predictable proxy addresses
- **One proxy per user**: Enforces single proxy per address
- **Gas efficient**: Minimal proxy pattern reduces deployment cost to ~$5

**Main functions:**
```solidity
// Deploy proxy for msg.sender
function createProxy() external returns (address proxy);

// Check if user has proxy
function getProxy(address user) external view returns (address);

// Predict proxy address before deployment
function predictProxyAddress(address user) external view returns (address);
```

**Usage:**
```javascript
// Check if user has proxy
const existingProxy = await factory.getProxy(userAddress);

if (existingProxy === ethers.constants.AddressZero) {
  // Deploy new proxy
  const tx = await factory.connect(user).createProxy();
  const receipt = await tx.wait();

  // Extract proxy address from event
  const event = receipt.events.find(e => e.event === 'ProxyCreated');
  const proxyAddress = event.args.proxy;

  console.log(`Deployed proxy at: ${proxyAddress}`);
} else {
  console.log(`User already has proxy at: ${existingProxy}`);
}
```

### 3. HHStorage

**Position tracking and metadata storage** - embedded in each HH proxy.

**Data structures:**

**Position:**
```solidity
struct Position {
    bytes32 id;                    // Unique position ID
    PositionType positionType;     // LENDING, BORROWING, LIQUIDITY, etc.
    address protocol;              // Protocol address (Aave, Uniswap)
    bytes32 parentId;              // Parent position ID (if child)
    mapping(bytes32 => bytes) data; // Flexible key-value storage
    bool active;                   // Is position active?
}
```

**Position types:**
```solidity
enum PositionType {
    LENDING,      // Aave supply
    BORROWING,    // Aave borrow
    LIQUIDITY,    // Uniswap V3 LP
    FARMING,      // Staking for rewards
    REWARD        // Claimable rewards
}
```

**Key functions:**
```solidity
// Create new position
function createPosition(
    PositionType positionType,
    address protocol,
    bytes32 parentId
) internal returns (bytes32 positionId);

// Store position-specific data
function setPositionData(
    bytes32 positionId,
    bytes32 key,
    bytes memory value
) internal;

// Retrieve position data
function getPositionData(
    bytes32 positionId,
    bytes32 key
) internal view returns (bytes memory);

// Get all active positions
function getActivePositions() external view returns (bytes32[] memory);
```

**Example usage:**
```solidity
// Create Aave supply position
bytes32 supplyPositionId = HHStorageLib.createPosition(
    PositionType.LENDING,
    AAVE_POOL,
    bytes32(0) // No parent
);

// Store position metadata
HHStorageLib.setPositionData(
    supplyPositionId,
    "asset",
    abi.encode(USDC)
);

HHStorageLib.setPositionData(
    supplyPositionId,
    "amount",
    abi.encode(10000e6)
);

// Create child borrow position
bytes32 borrowPositionId = HHStorageLib.createPosition(
    PositionType.BORROWING,
    AAVE_POOL,
    supplyPositionId // Parent is the supply position
);
```

### 4. Protocol Connectors

**Bridge between proxies and DeFi protocols** - each protocol has its own connector.

**AaveV3Connector:**
```solidity
// Supply collateral
function supply(
    address asset,
    uint256 amount,
    bytes32 parentPositionId
) external returns (bytes32 positionId);

// Borrow against collateral
function borrow(
    address asset,
    uint256 amount,
    bytes32 supplyPositionId
) external returns (bytes32 positionId);

// Repay debt
function repay(
    bytes32 borrowPositionId,
    uint256 amount
) external;

// Withdraw collateral
function withdraw(
    bytes32 supplyPositionId,
    uint256 amount
) external;
```

**UniswapV3Connector:**
```solidity
// Mint new LP position (user-initiated)
function mintPositionUser(
    address token0,
    address token1,
    uint24 fee,
    MintParams calldata params,
    bytes32 parentPositionId
) external returns (bytes32 positionId, uint256 tokenId);

// Mint new LP position (bot-initiated)
function mintPosition(
    address token0,
    address token1,
    uint24 fee,
    MintParams calldata params,
    bytes32 parentPositionId
) external returns (bytes32 positionId, uint256 tokenId);

// Increase liquidity
function increaseLiquidity(
    bytes32 positionId,
    uint256 amount0,
    uint256 amount1
) external;

// Decrease liquidity
function decreaseLiquidity(
    bytes32 positionId,
    uint128 liquidity
) external;

// Collect fees
function collect(
    bytes32 positionId
) external returns (uint256 amount0, uint256 amount1);
```

**Design pattern:**
- All connectors use `address(this)` for position ownership (proxy-centric)
- Integrate with TransferLib for fee collection
- Emit events for frontend tracking
- Support both user and bot execution contexts

### 5. Strategy System

**Automated operations** executed by bots on behalf of users.

**Base Strategy Interface:**
```solidity
interface IStrategy {
    // Check if strategy can execute
    function canExecuteStrategy(bytes32 positionId) external view returns (bool);

    // Execute strategy
    function executeStrategy(bytes32 positionId) external;

    // Get strategy configuration
    function getConfig(bytes32 positionId) external view returns (bytes memory);

    // Set strategy configuration
    function setConfig(bytes32 positionId, bytes memory config) external;
}
```

**Available strategies:**

1. **AutoRebalanceStrategy**: Rebalance Uniswap V3 LP when price exits range
2. **AutoCompoundStrategy**: Reinvest LP fees for compound growth
3. **AutoRepayStrategy**: Use LP fees to repay Aave debt
4. **AutoCollateralizeStrategy**: Convert fees to collateral
5. **AutoHarvestStrategy**: Claim and reinvest protocol rewards

**Execution flow:**
```
Bot monitors positions:
  └─ Calls canExecuteStrategy(positionId) for each enabled strategy
      ├─ Returns false: Do nothing
      └─ Returns true:
          └─ Bot calls executeStrategy(positionId)
              └─ Strategy executes via proxy's delegatecall
                  └─ Connector calls made to protocols
                      └─ Fees collected automatically
                          └─ Event emitted
```

### 6. Directory System

**Two-tier permission and configuration system.**

**HHDirectory:**
```solidity
// Whitelist protocol for proxy interaction
function setProtocolWhitelisted(address protocol, bool whitelisted) external onlyOwner;

// Whitelist caller (strategy/bot) for multicall
function setCallerWhitelisted(address caller, bool whitelisted) external onlyOwner;

// Set fee collector address
function setFeeCollector(address feeCollector) external onlyOwner;

// Configure fee rates by operation
function setUserFeeRate(bytes32 operation, uint256 bps) external onlyOwner;
function setAutomationFeeRate(bytes32 operation, uint256 bps) external onlyOwner;
```

**ProtocolDirectory:**
```solidity
// Map protocol to connector
function setConnector(address protocol, address connector) external onlyOwner;

// Get connector for protocol
function getConnector(address protocol) external view returns (address);
```

**Usage:**
```javascript
// Whitelist Aave V3
await hhDirectory.setProtocolWhitelisted(AAVE_POOL, true);

// Map Aave to connector
await protocolDirectory.setConnector(AAVE_POOL, AAVE_CONNECTOR);

// Whitelist bot for automation
await hhDirectory.setCallerWhitelisted(BOT_ADDRESS, true);

// Set fee rates
await hhDirectory.setUserFeeRate(
  ethers.utils.id("supply"),
  50 // 0.5%
);

await hhDirectory.setAutomationFeeRate(
  ethers.utils.id("rebalance"),
  10 // 0.1%
);
```

### 7. Fee System

**Dual-context fee collection** based on execution context (user vs bot).

**TransferLib:**
```solidity
// Transfer tokens from user to proxy (with fee deduction)
function transferTokenFromUser(
    address token,
    address from,
    address to,
    uint256 amount
) internal returns (uint256 netAmount);

// Transfer to fee collector
function transferToFeeCollector(
    address token,
    uint256 amount
) internal;
```

**FeesLib:**
```solidity
// Calculate and collect user fee
function collectUserFee(
    bytes32 operation,
    address token,
    uint256 amount
) internal returns (uint256 fee);

// Calculate and collect automation fee
function collectAutomationFee(
    bytes32 operation,
    address token,
    uint256 amount
) internal returns (uint256 fee);
```

**Fee collection points:**
- **User path**: Fees deducted during token transfer (TransferLib)
- **Bot path**: Fees calculated on operation value (FeesLib)
- **All fees**: Sent to designated fee collector address

## Component Interactions

### Example: Create Delta-Neutral LP Position

```
User calls proxy.multicall([...]):

1. Proxy receives call from user (msg.sender = owner)
   └─ Validates caller is owner or approved

2. Proxy delegatecalls to AaveV3Connector.supply():
   └─ Connector pulls USDC from user via TransferLib
       └─ TransferLib deducts 0.5% fee (user context)
       └─ Net USDC transferred to proxy
   └─ Connector calls Aave Pool to supply
   └─ Proxy receives aUSDC (yield-bearing token)
   └─ HHStorage creates LENDING position
   └─ Returns positionId

3. Proxy delegatecalls to AaveV3Connector.borrow():
   └─ Connector calls Aave Pool to borrow ETH
   └─ Proxy receives ETH
   └─ FeesLib collects 0% fee (borrow typically free for users)
   └─ HHStorage creates BORROWING position (parent = supply position)
   └─ Returns positionId

4. Proxy delegatecalls to UniswapV3Connector.mintPositionUser():
   └─ Connector pulls remaining USDC + ETH from user via TransferLib
       └─ TransferLib deducts 0.5% fee on each token
   └─ Connector calls Uniswap NFT Manager to mint position
   └─ Proxy receives NFT (LP position)
   └─ HHStorage creates LIQUIDITY position (parent = borrow position)
   └─ Returns positionId and tokenId

5. Proxy returns all results to user

Result:
- User paid ~1% total fees (0.5% per token transfer)
- Proxy now owns: aUSDC, ETH debt, Uniswap NFT
- Positions linked: Supply → Borrow → LP
- User saved 67-85% vs traditional approval costs
```

## Key Takeaways

✅ **Modular architecture** - Each component has single responsibility
✅ **Proxy-centric** - All positions owned by proxy for automation
✅ **Delegatecall pattern** - Connectors execute in proxy's context
✅ **Dual-context fees** - Different rates for user vs bot execution
✅ **Hierarchical positions** - Parent-child relationships track dependencies
✅ **Whitelisting** - Security through protocol and caller restrictions

---

[Next: Position Linking →](position-linking.md)

[Back to Technical Architecture](README.md)
