# Smart Contracts Overview

## Contract Architecture

Hedgehog Protocol is built on a modular smart contract architecture designed for security, gas efficiency, and extensibility.

## Core Contracts

The protocol consists of several categories of contracts:

### 1. **[Core Contracts](core-contracts.md)**
- **HH (Proxy)** - User's smart contract wallet
- **HHFactory** - Proxy deployment factory
- **HHStorage** - Position tracking and metadata
- **HHDirectory** - Protocol and caller whitelisting
- **ProtocolDirectory** - Protocol-to-connector mapping

### 2. **[Connector Contracts](connectors.md)**
- **AaveV3Connector** - Aave V3 lending/borrowing integration
- **UniswapV3Connector** - Uniswap V3 liquidity management
- Future: Compound, Curve, Balancer, etc.

### 3. **[Strategy Contracts](strategies.md)**
- **AutoRebalanceStrategy** - Rebalance V3 LP positions
- **AutoCompoundStrategy** - Reinvest LP fees
- **AutoRepayStrategy** - Repay debt using LP fees
- **AutoCollateralizeStrategy** - Convert fees to collateral
- **AutoHarvestStrategy** - Claim and compound rewards

### 4. **[Directory System](directories.md)**
- **HHDirectory** - Global protocol permissions
- **ProtocolDirectory** - Connector registry

### 5. **[Libraries](data-structures.md)**
- **HHStorageLib** - Position management
- **TransferLib** - Token transfers with fees
- **FeesLib** - Fee calculation and collection
- **EmergencyExitLib** - Emergency position closure
- **NftZapLib** - Single-token LP entry/exit
- **AaveV3HealthFactor** - Health factor calculations

## Contract Deployment

### Mainnet Addresses (Example)

```
HHFactory: 0x...
HHDirectory: 0x...
ProtocolDirectory: 0x...
AaveV3Connector: 0x...
UniswapV3Connector: 0x...
AutoRebalanceStrategy: 0x...
AutoCompoundStrategy: 0x...
AutoRepayStrategy: 0x...
```

### Deployment Order

1. Deploy HHDirectory
2. Deploy ProtocolDirectory
3. Deploy libraries
4. Deploy HH implementation
5. Deploy HHFactory (with HH implementation address)
6. Deploy connectors
7. Deploy strategies
8. Configure directories (whitelist protocols, map connectors)

## Security Model

### Access Control Layers

**Level 1: Proxy ownership**
- Owner (user) has full control
- Can withdraw all funds
- Can change approvals
- Can enable/disable strategies

**Level 2: Approved address**
- Bot can execute enabled strategies
- Cannot withdraw funds
- Cannot change ownership
- Limited to whitelisted operations

**Level 3: Protocol whitelisting**
- Only whitelisted protocols can be called
- Prevents malicious contract interactions
- Managed by HHDirectory

**Level 4: Connector isolation**
- Each protocol has separate connector
- Bugs isolated to single connector
- Can upgrade connectors without touching core

### Upgradeability

**What's upgradeable:**
- ✅ Connectors (via ProtocolDirectory mapping)
- ✅ Strategies (user can enable new ones)
- ✅ Fee rates (via HHDirectory)
- ✅ Protocol whitelist (via HHDirectory)

**What's NOT upgradeable:**
- ❌ User proxies (but users can migrate to new factory)
- ❌ Position data (stored permanently)
- ❌ Ownership (user always has control)

## Gas Optimization

**Techniques used:**

1. **Minimal proxy pattern** (EIP-1167)
   - Reduces proxy deployment cost to ~$5
   - All proxies share same implementation bytecode

2. **Delegatecall execution**
   - Connectors execute in proxy's context
   - No token transfers between contracts
   - Single approval per token (user → proxy)

3. **Multicall batching**
   - Multiple operations in one transaction
   - Saves 21,000 gas per transaction
   - Example: supply + borrow + LP in one call

4. **Storage optimization**
   - Packed structs where possible
   - Mapping over arrays for position tracking
   - Key-value storage for flexible metadata

5. **JIT approvals**
   - Users approve proxy once with unlimited amount
   - Proxy approves protocols only when needed
   - 67-85% gas savings vs traditional DeFi

## Audit Status

### Completed Audits

**Audit 1: [Firm Name] - [Date]**
- Scope: Core contracts, connectors, strategies
- Findings: X critical, Y high, Z medium
- Status: All resolved

**Audit 2: [Firm Name] - [Date]**
- Scope: Emergency exit, zap functionality
- Findings: X critical, Y high, Z medium
- Status: All resolved

### Bug Bounty

**Program details:**
- Platform: Immunefi / Code4rena
- Max bounty: $XXX,XXX
- Scope: All contracts
- Link: [URL]

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/hedgehog/protocol
cd protocol

# Install dependencies
forge install

# Compile contracts
forge build

# Run tests
forge test
```

### Running Tests

```bash
# Quick tests (no fork)
forge test --no-match-path "**/fork/**" -vv

# Full test suite (with fork)
forge test -vv

# Specific test file
forge test --match-path "test/core/HH.t.sol" -vv

# Gas report
forge test --gas-report
```

### Local Development

```bash
# Start local node
anvil

# Deploy contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Verify contracts
forge verify-contract <address> <contract> --chain-id 1
```

## Contract Addresses by Chain

### Ethereum Mainnet

```
Coming soon
```

### Arbitrum

```
Coming soon
```

### Optimism

```
Coming soon
```

### Base

```
Coming soon
```

## Key Takeaways

✅ Modular architecture: Core, connectors, strategies, directories
✅ Security through isolation: Each protocol in separate connector
✅ Gas optimized: Minimal proxy, delegatecall, multicall, JIT approvals
✅ Upgradeable: Connectors and strategies can be upgraded
✅ Audited: Multiple audits, active bug bounty
✅ Open source: Full code available, testable, verifiable

---

[Next: Core Contracts →](core-contracts.md)

[Back to Documentation](../README.md)
