# Directory System

## Overview

The **Directory System** provides a two-tier permission and configuration architecture for Hedgehog Protocol:

1. **HHDirectory** - Global protocol permissions and fee configuration
2. **ProtocolDirectory** - Protocol-to-connector mapping

This separation of concerns allows for:
- Flexible protocol whitelisting
- Upgradeable connector mapping
- Centralized fee configuration
- Security through access control

## HHDirectory

### Purpose

**HHDirectory** manages protocol-wide permissions and fee settings.

**Key responsibilities:**
- Whitelist protocols that proxies can interact with
- Whitelist callers (bots, strategies) allowed to trigger multicalls
- Configure fee collector address
- Set fee rates for user and automation operations

### Contract Interface

```solidity
interface IHHDirectory {
    // Protocol whitelisting
    function isProtocolWhitelisted(address protocol) external view returns (bool);
    function setProtocolWhitelisted(address protocol, bool whitelisted) external;

    // Caller whitelisting
    function isCallerWhitelisted(address caller) external view returns (bool);
    function setCallerWhitelisted(address caller, bool whitelisted) external;

    // Fee management
    function getFeeCollector() external view returns (address);
    function setFeeCollector(address feeCollector) external;

    function getUserFeeRate(bytes32 operation) external view returns (uint256);
    function setUserFeeRate(bytes32 operation, uint256 bps) external;

    function getAutomationFeeRate(bytes32 operation) external view returns (uint256);
    function setAutomationFeeRate(bytes32 operation, uint256 bps) external;
}
```

### Protocol Whitelisting

**Purpose:** Prevent proxies from calling malicious contracts.

```solidity
// HHDirectory.sol
mapping(address => bool) public protocolWhitelist;

function setProtocolWhitelisted(address protocol, bool whitelisted) external onlyOwner {
    protocolWhitelist[protocol] = whitelisted;
    emit ProtocolWhitelistUpdated(protocol, whitelisted);
}
```

**Usage in proxy:**
```solidity
// HH.sol
function execute(address target, bytes calldata data) external onlyOwner {
    require(directory.isProtocolWhitelisted(target), "Protocol not whitelisted");

    (bool success, bytes memory result) = target.call(data);
    require(success, "Execution failed");

    return result;
}
```

**Example:**
```javascript
// Whitelist Aave V3
await hhDirectory.setProtocolWhitelisted(AAVE_POOL_ADDRESS, true);

// Whitelist Uniswap V3
await hhDirectory.setProtocolWhitelisted(UNISWAP_NFT_MANAGER, true);

// Now proxies can interact with these protocols
await proxy.execute(AAVE_POOL_ADDRESS, aaveCalldata); // ✅ Allowed

// But not with random contracts
await proxy.execute(MALICIOUS_CONTRACT, data); // ❌ Reverts
```

### Caller Whitelisting

**Purpose:** Control which addresses can trigger automated operations.

```solidity
mapping(address => bool) public callerWhitelist;

function setCallerWhitelisted(address caller, bool whitelisted) external onlyOwner {
    callerWhitelist[caller] = whitelisted;
    emit CallerWhitelistUpdated(caller, whitelisted);
}
```

**Usage in proxy:**
```solidity
// HH.sol
function multicall(Call[] calldata calls) external returns (bytes[] memory) {
    address owner = HHOwnable(address(this)).owner();
    address approved = HHOwnable(address(this)).approved();

    bool isOwner = msg.sender == owner;
    bool isApproved = msg.sender == approved;
    bool isWhitelisted = directory.isCallerWhitelisted(msg.sender);

    require(isOwner || (isApproved && isWhitelisted), "Not authorized");

    // Execute calls...
}
```

**Example:**
```javascript
// Whitelist bot address
await hhDirectory.setCallerWhitelisted(BOT_ADDRESS, true);

// Whitelist all strategy contracts
await hhDirectory.setCallerWhitelisted(AUTO_REBALANCE_STRATEGY, true);
await hhDirectory.setCallerWhitelisted(AUTO_COMPOUND_STRATEGY, true);
await hhDirectory.setCallerWhitelisted(AUTO_REPAY_STRATEGY, true);

// Now bots can execute strategies
await autoRebalanceStrategy.connect(bot).executeStrategy(positionId); // ✅ Allowed

// But random addresses cannot
await autoRebalanceStrategy.connect(attacker).executeStrategy(positionId); // ❌ Reverts
```

### Fee Configuration

**Purpose:** Centralized management of protocol fees.

```solidity
address public feeCollector;

mapping(bytes32 => uint256) public userFeeRates;      // BPS (e.g., 50 = 0.5%)
mapping(bytes32 => uint256) public automationFeeRates; // BPS (e.g., 10 = 0.1%)

function setFeeCollector(address _feeCollector) external onlyOwner {
    feeCollector = _feeCollector;
    emit FeeCollectorUpdated(_feeCollector);
}

function setUserFeeRate(bytes32 operation, uint256 bps) external onlyOwner {
    require(bps <= 1000, "Max 10%"); // Safety limit
    userFeeRates[operation] = bps;
    emit UserFeeRateUpdated(operation, bps);
}

function setAutomationFeeRate(bytes32 operation, uint256 bps) external onlyOwner {
    require(bps <= 500, "Max 5%"); // Safety limit
    automationFeeRates[operation] = bps;
    emit AutomationFeeRateUpdated(operation, bps);
}
```

**Example:**
```javascript
// Set fee collector
await hhDirectory.setFeeCollector(TREASURY_ADDRESS);

// Configure user fees (0.5% for most operations)
await hhDirectory.setUserFeeRate(ethers.utils.id("supply"), 50);       // 0.5%
await hhDirectory.setUserFeeRate(ethers.utils.id("mintPosition"), 50); // 0.5%
await hhDirectory.setUserFeeRate(ethers.utils.id("borrow"), 0);        // 0% (free for users)
await hhDirectory.setUserFeeRate(ethers.utils.id("withdraw"), 50);     // 0.5%

// Configure automation fees (lower to incentivize automation)
await hhDirectory.setAutomationFeeRate(ethers.utils.id("rebalance"), 10);     // 0.1%
await hhDirectory.setAutomationFeeRate(ethers.utils.id("compound"), 20);      // 0.2%
await hhDirectory.setAutomationFeeRate(ethers.utils.id("repay"), 15);         // 0.15%
await hhDirectory.setAutomationFeeRate(ethers.utils.id("collateralize"), 15); // 0.15%
await hhDirectory.setAutomationFeeRate(ethers.utils.id("harvest"), 20);       // 0.2%
```

**Usage in connectors:**
```solidity
// AaveV3Connector.sol
function supply(address asset, uint256 amount, bytes32 parentPositionId) external returns (bytes32) {
    bool isUserCaller = msg.sender == HHOwnable(address(this)).owner();

    uint256 netAmount;

    if (isUserCaller) {
        // Get user fee rate from directory
        uint256 feeBps = directory.getUserFeeRate(keccak256("supply"));

        // Transfer from user with fee
        netAmount = TransferLib.transferTokenFromUser(asset, msg.sender, address(this), amount);
        // TransferLib uses directory fee rate internally
    } else {
        // Get automation fee rate from directory
        uint256 feeBps = directory.getAutomationFeeRate(keccak256("supply"));

        // Collect automation fee
        uint256 fee = (amount * feeBps) / 10_000;
        TransferLib.transferToFeeCollector(asset, fee);

        netAmount = amount - fee;
    }

    // Supply to Aave...
}
```

## ProtocolDirectory

### Purpose

**ProtocolDirectory** maps protocol addresses to their corresponding connector contracts.

**Key responsibilities:**
- Map protocols to connectors
- Allow connector upgrades without changing proxies
- Provide connector lookup for proxies

### Contract Interface

```solidity
interface IProtocolDirectory {
    function getConnector(address protocol) external view returns (address);
    function setConnector(address protocol, address connector) external;
    function removeConnector(address protocol) external;
}
```

### Implementation

```solidity
// ProtocolDirectory.sol
mapping(address => address) public connectors;

function setConnector(address protocol, address connector) external onlyOwner {
    require(protocol != address(0), "Invalid protocol");
    require(connector != address(0), "Invalid connector");

    connectors[protocol] = connector;

    emit ConnectorUpdated(protocol, connector);
}

function getConnector(address protocol) external view returns (address) {
    address connector = connectors[protocol];
    require(connector != address(0), "No connector for protocol");
    return connector;
}

function removeConnector(address protocol) external onlyOwner {
    delete connectors[protocol];
    emit ConnectorRemoved(protocol);
}
```

### Example Usage

```javascript
// Map Aave V3 Pool to AaveV3Connector
await protocolDirectory.setConnector(
    AAVE_POOL_ADDRESS,
    AAVE_V3_CONNECTOR_ADDRESS
);

// Map Uniswap V3 to UniswapV3Connector
await protocolDirectory.setConnector(
    UNISWAP_NFT_MANAGER_ADDRESS,
    UNISWAP_V3_CONNECTOR_ADDRESS
);

// Later: Upgrade AaveV3Connector to fix a bug
await protocolDirectory.setConnector(
    AAVE_POOL_ADDRESS,
    NEW_AAVE_V3_CONNECTOR_ADDRESS
);

// All proxies now use new connector (no proxy changes needed!)
```

### Proxy Connector Resolution

```solidity
// HH.sol
function _delegatecallConnector(address protocol, bytes memory data) internal returns (bytes memory) {
    // Get connector from directory
    address connector = protocolDirectory.getConnector(protocol);

    // Delegatecall to connector
    (bool success, bytes memory result) = connector.delegatecall(data);
    require(success, "Connector call failed");

    return result;
}
```

## Directory Governance

### Access Control

**HHDirectory and ProtocolDirectory** are owned by protocol governance:

```solidity
// Both contracts inherit Ownable
contract HHDirectory is Ownable {
    // Only owner can:
    // - Whitelist protocols
    // - Whitelist callers
    // - Set fee rates
    // - Change fee collector
}

contract ProtocolDirectory is Ownable {
    // Only owner can:
    // - Map connectors
    // - Upgrade connectors
    // - Remove connectors
}
```

**Initial deployment:**
```javascript
// Deploy directories with deployer as owner
const hhDirectory = await HHDirectory.deploy(DEPLOYER_ADDRESS);
const protocolDirectory = await ProtocolDirectory.deploy(DEPLOYER_ADDRESS);

// Later: Transfer to multisig or DAO
await hhDirectory.transferOwnership(GOVERNANCE_MULTISIG);
await protocolDirectory.transferOwnership(GOVERNANCE_MULTISIG);
```

### Governance Operations

**Example governance flow:**

```javascript
// Proposal: Add Compound V3 support

// 1. Deploy Compound connector
const compoundConnector = await CompoundV3Connector.deploy();

// 2. Governance vote and execution:
await governance.executeProposal([
    // Whitelist Compound protocol
    hhDirectory.interface.encodeFunctionData("setProtocolWhitelisted", [
        COMPOUND_V3_COMET,
        true
    ]),

    // Map to connector
    protocolDirectory.interface.encodeFunctionData("setConnector", [
        COMPOUND_V3_COMET,
        compoundConnector.address
    ]),

    // Set fee rates
    hhDirectory.interface.encodeFunctionData("setUserFeeRate", [
        ethers.utils.id("compoundSupply"),
        50 // 0.5%
    ]),
    hhDirectory.interface.encodeFunctionData("setAutomationFeeRate", [
        ethers.utils.id("compoundSupply"),
        10 // 0.1%
    ])
]);

// 3. All proxies can now use Compound!
await proxy.multicall([
    compoundConnector.interface.encodeFunctionData("supply", [USDC, 10000e6])
]);
```

## Security Considerations

### 1. Whitelist Hygiene

**Best practices:**
- Only whitelist audited protocols
- Regularly review whitelist
- Remove deprecated protocols
- Monitor for suspicious activity

### 2. Fee Limits

**Safety checks:**
```solidity
function setUserFeeRate(bytes32 operation, uint256 bps) external onlyOwner {
    require(bps <= 1000, "Max 10%"); // Prevent excessive fees
    userFeeRates[operation] = bps;
}
```

### 3. Connector Upgrades

**Risk:** Malicious connector could drain funds

**Mitigation:**
- Connectors are stateless (no token storage)
- All funds in proxies (user-controlled)
- Audit all connectors before mapping
- Timelock for connector changes (governance)

### 4. Multi-Sig Governance

**Recommendation:**
```
- 3-of-5 multisig for directory ownership
- Timelock (24-48h) for critical changes
- Emergency pause function (if needed)
```

## Key Takeaways

✅ **HHDirectory** manages global permissions and fees
✅ **ProtocolDirectory** maps protocols to connectors
✅ Separation allows flexible upgrades
✅ Centralized fee configuration
✅ Security through whitelisting
✅ Governance-controlled access

---

[Next: Data Structures →](data-structures.md)

[Back to Smart Contracts](README.md)
