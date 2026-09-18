# Chapter 4: Smart Contract Architecture - Technical Deep Dive

## Contract Relationships

```
USER
 │
 ├─ Deploys via: HHFactory
 │   └─ Creates: HH Proxy (user's personal contract)
 │
 └─ Interacts with: HH Proxy
      │
      ├─ Inherits: HHStorageV2 (position tracking)
      ├─ Uses: Multicall (batch execution)
      │
      ├─ Delegatecalls to: CONNECTORS
      │   ├─ AaveV3Connector (lending/borrowing)
      │   ├─ UniswapV3Connector (liquidity)
      │   └─ Future connectors (Compound, Curve, etc.)
      │
      ├─ Delegatecalls to: STRATEGIES
      │   ├─ AutoRebalanceStrategy
      │   ├─ AutoCompoundStrategy
      │   ├─ LeveragedYieldStrategy
      │   └─ DeltaNeutralStrategy
      │
      ├─ Uses Libraries:
      │   ├─ TransferLib (token transfers + fees)
      │   ├─ FeesLib (fee calculation)
      │   ├─ SwapLib (token swaps)
      │   └─ NftZapLib (LP creation helpers)
      │
      └─ Queries Directories:
          ├─ HHDirectory (fee config, protocol whitelist)
          ├─ ProtocolDirectory (protocol→connector mapping)
          └─ StrategyDirectory (approved strategies)
```

## Key Design Patterns

**1. Minimal Proxy Pattern (EIP-1167)**
```solidity
// HHFactory deploys minimal proxies pointing to HH implementation
// Gas cost: ~45k vs. ~3M for full contract deployment
// Result: $2-3 proxy deployment vs. $50-100 full deployment
```

**2. Delegatecall Pattern**
```solidity
// HH Proxy delegatecalls to connectors/strategies
// Code executes in proxy's context, accesses proxy's storage
// Result: Modular, upgradeable, gas-efficient

Example:
User calls: proxy.supply(USDC, 1000)
Proxy does: delegatecall(aaveConnector.supply(USDC, 1000))
Effect: aaveConnector code runs as if it's part of proxy
Storage: Accesses proxy's storage, not connector's
```

**3. Self-Call Pattern**
```solidity
// Connectors need to update proxy storage during delegatecall
// Solution: Connector makes external call back to proxy

In connector (running via delegatecall):
HHStorageV2(address(this)).createPosition(...)
// address(this) = proxy address, so proxy calls itself
// New call frame where msg.sender = proxy, can access storage functions

Security check in proxy:
function createPosition(...) external {
    require(msg.sender == address(this)); // Only proxy can call itself
    _createPositionInternal(...);
}
```

**4. Packed Storage Pattern**
```solidity
// HHStorageV2 packs position data into 3 storage slots
// V1: 6 slots per position (~125k gas to create)
// V2: 3 slots per position (~62k gas to create)
// Result: 50% gas savings on position creation

struct PackedPosition {
    bytes32 slot0; // protocol address (20 bytes) + protocol position ID (12 bytes)
    bytes32 slot1; // position type (1 byte) + parent ID (32 bytes) + flags (1 byte)
    bytes32 slot2; // timestamp (8 bytes) + metadata hash (24 bytes)
}
```

**5. JIT Approval Pattern**
```solidity
// Check if approval exists before calling protocol
// Only approve if needed, save gas on subsequent calls

function supply(address asset, uint256 amount) {
    // Pull tokens from user (with fee)
    uint256 amountAfterFee = TransferLib.pull(asset, user, amount);

    // JIT approval
    if (IERC20(asset).allowance(address(this), aavePool) < amountAfterFee) {
        IERC20(asset).approve(aavePool, type(uint256).max);
    }

    // Interact with protocol
    aavePool.supply(asset, amountAfterFee, address(this), 0);
}
```

## Storage Architecture: HHStorageV2

**Position Tracking System**:

```solidity
// Each position identified by unique bytes32 ID
mapping(bytes32 => PackedPosition) public positions;

// Active positions array (for querying)
bytes32[] public activePositions;

// Positions by type (LENDING, BORROWING, LIQUIDITY, etc.)
mapping(PositionType => bytes32[]) public positionsByType;

// Parent-child relationships
mapping(bytes32 => bytes32[]) public childPositions;

// Position metadata (protocol-specific data)
mapping(bytes32 => bytes) public positionMetadata;
```

**Position Types**:
```solidity
enum PositionType {
    LENDING,    // Aave supply, Compound supply
    BORROWING,  // Aave borrow, Compound borrow
    LIQUIDITY,  // Uniswap LP, Curve LP
    FARMING,    // Staking, farming positions
    REWARD      // Unclaimed rewards
}
```

**Hierarchical Positions**:
```
Position A (LENDING): 1000 USDC supplied to Aave
    │
    ├─ Position B (BORROWING): 700 ETH borrowed from Aave
    │   └─ childOf: Position A
    │
    └─ Position C (LIQUIDITY): ETH-USDC LP on Uniswap
        └─ childOf: Position B (used borrowed ETH to create LP)
```

**Why Hierarchical Tracking Matters**:
- Track complex strategies (borrow → LP → farm)
- Emergency exit knows full dependency chain
- Bots understand strategy context
- Users see complete position relationships

## Fee System Architecture

**Dual-Context Fee Collection**:

```solidity
// In connector code (running via delegatecall in proxy):

function supply(address asset, uint256 amount) external {
    // Determine execution context
    bool isUserCall = msg.sender == owner(address(this));
    bool isBotCall = msg.sender == approved(address(this));

    uint256 feeRate;
    if (isUserCall) {
        // User doing manual operation: higher fee
        feeRate = HHDirectory.getUserFee("supply"); // 0.5% = 50 bps
    } else if (isBotCall) {
        // Bot doing automation: lower fee to incentivize
        feeRate = HHDirectory.getAutomationFee("supply"); // 0.1% = 10 bps
    } else {
        revert("Unauthorized");
    }

    // Transfer with fee
    uint256 amountAfterFee = TransferLib.transferFromUser(
        asset,
        msg.sender,
        address(this),
        amount,
        feeRate
    );

    // Proceed with protocol interaction
    aavePool.supply(asset, amountAfterFee, address(this), 0);
}
```

**Fee Collection Points**:

| Operation | Fee Collection Method | Example |
|-----------|---------------------|---------|
| **Token Pull** (supply, LP mint) | TransferLib deducts during transfer | 1000 USDC → 5 fee → 995 to proxy |
| **Position Value** (borrow, withdraw) | FeesLib calculates on operation value | Borrow 10 ETH → 0.01 ETH fee |
| **Result Value** (collect fees, harvest) | FeesLib calculates on results | Collect 100 USDC fees → 0.2 fee |

**Fee Configuration** (in HHDirectory):

```solidity
// Mapping: operation hash → fee basis points
mapping(bytes32 => uint256) public userFees;
mapping(bytes32 => uint256) public automationFees;

// Set fees (admin only)
function setFees(bytes32[] operationHashes, uint256[] feeBPS) external onlyAdmin {
    for (uint i = 0; i < operationHashes.length; i++) {
        userFees[operationHashes[i]] = feeBPS[i];
    }
}

// Example: Set Aave supply fee to 0.5% (50 bps)
bytes32 supplyHash = keccak256(abi.encodePacked(aaveConnector, "supply"));
setFees([supplyHash], [50]);
```

## Security Model

**Four Layers of Protection**:

1. **Entry Point Security**
```solidity
modifier onlyOwnerOrApproved() {
    require(
        msg.sender == owner || msg.sender == approved,
        "Not authorized"
    );
    _;
}

// Only owner or approved bot can call sensitive functions
function executeStrategy(...) external onlyOwnerOrApproved { }
```

2. **Protocol Whitelisting**
```solidity
// HHDirectory maintains list of approved protocols
mapping(address => bool) public whitelistedProtocols;

// Connector can only interact with whitelisted protocols
modifier onlyWhitelistedProtocol(address protocol) {
    require(HHDirectory.isWhitelisted(protocol), "Protocol not approved");
    _;
}
```

3. **Self-Call Security**
```solidity
// Storage functions only callable by proxy itself (during delegatecall)
function createPosition(...) external {
    require(msg.sender == address(this), "Only via delegatecall");
    _createPositionInternal(...);
}
```

4. **Emergency Exit**
```solidity
// Owner can always exit ALL positions immediately
function emergencyExit() external onlyOwner {
    // Exit all Aave positions
    for (bytes32 posId in aavePositions) {
        aaveConnector.withdraw(posId, max);
    }

    // Exit all Uniswap positions
    for (bytes32 posId in uniswapPositions) {
        uniswapConnector.decreaseLiquidity(posId, 100%);
        uniswapConnector.collect(posId);
    }

    // Transfer all tokens to owner
    for (address token in allTokens) {
        IERC20(token).transfer(owner, balance);
    }
}
```

**Trust Model**:
- User = Full control (owner of proxy)
- Bot = Limited control (can execute strategies, can't withdraw to self)
- Protocol = No control (no admin keys, immutable core logic)
- Connectors = Whitelisted only (governance can add/remove)

---

*Next: [Chapter 5: Integration Guide](05-integration-guide.md) - For developers building on Hedgehog*
