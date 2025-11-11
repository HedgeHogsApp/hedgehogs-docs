# Creating a Proxy

## What is a Hedgehog Proxy?

Your **Hedgehog Proxy** (HH Proxy) is your personal smart contract that acts as your gateway to the Hedgehog Protocol. Think of it as your own DeFi manager that lives on-chain - you own it, you control it, and it holds all your positions across different protocols.

## Why Do You Need a Proxy?

Traditional DeFi requires you to:
- Approve each protocol separately for each token ($15-50 per approval)
- Sign every single transaction manually
- Monitor positions yourself 24/7
- Pay gas for every operation

With a Hedgehog Proxy, you:
- Approve your proxy once per token ($2-3 total)
- Enable automation for hands-free management
- Let bots handle rebalancing, compounding, and risk management
- Save 67-85% on approval costs

## How to Deploy Your Proxy

### Prerequisites

- MetaMask or compatible Web3 wallet
- ~$10-15 in ETH for gas (one-time deployment)
- Connected to Ethereum Mainnet

### Step-by-Step Deployment

#### 1. Connect Your Wallet

Visit the Hedgehog Protocol dashboard and connect your wallet. Make sure you're on the correct network (Ethereum Mainnet).

#### 2. Deploy Your Proxy

Click the "Deploy Proxy" button. You'll be prompted to sign a transaction.

**What happens:**
```solidity
HHFactory.deployHH(approvedAddress, referralCode)
  ├─ Uses CREATE2 for deterministic address
  ├─ Clones HH implementation (minimal proxy pattern)
  ├─ Sets you as the owner
  └─ Emits HHDeployed event
```

**Transaction Details:**
- Gas Cost: ~150,000-200,000 gas (~$10-15 at 50 gwei)
- Contract: HHFactory
- Your Address: Becomes the proxy owner
- Proxy Address: Deterministic based on your address

#### 3. Verify Deployment

Once confirmed, you'll see:
- Your proxy address displayed in the dashboard
- A link to view your proxy on Etherscan
- Options to approve tokens and create positions

### Technical Details

**Proxy Deployment Process:**

```solidity
function deployHH(address _approved, bytes32 referralCode) external returns (address) {
    // Check factory is active
    require(isActive, "Factory is inactive");

    // Check user doesn't already have a proxy
    address existingProxy = _hhs[msg.sender];
    require(existingProxy == address(0), "Proxy already exists");

    // Deploy via CREATE2 (deterministic address)
    bytes32 salt = keccak256(abi.encodePacked(msg.sender));
    address proxy = Clones.cloneDeterministic(hedgehogImplementation, salt);

    // Initialize proxy
    HH(payable(proxy)).initialize(
        msg.sender,        // owner
        _approved,         // approved bot address
        directory,         // HHDirectory
        protocolDirectory  // ProtocolDirectory
    );

    // Store mappings
    _hhs[msg.sender] = proxy;
    _owners[proxy] = msg.sender;
    _referralCodes[proxy] = referralCode;

    emit HHDeployed(msg.sender, proxy);

    return proxy;
}
```

**Key Features:**

1. **Minimal Proxy Pattern (EIP-1167)**
   - Gas cost: ~45k vs. ~3M for full deployment
   - All proxies share same implementation
   - Result: $2-3 deployment vs. $50-100 traditional

2. **Deterministic Addresses**
   - Same address for same owner across chains
   - Predictable before deployment
   - Uses CREATE2 with keccak256(owner) as salt

3. **Owner Control**
   - You are the sole owner
   - Only you can withdraw funds
   - You can approve/revoke bot access anytime

4. **Upgrade Path**
   - Factory supports upgrades via `previousFactory` link
   - Existing proxies continue working
   - Seamless migration to new implementations

## After Deployment: Next Steps

### 1. Approve Tokens

Before using any token with Hedgehog, approve your proxy once:

```javascript
// Example: Approve USDC
USDC.approve(yourProxyAddress, MAX_UINT256)
```

**Cost:** ~$2-3 per token (one-time)

**What this does:**
- Grants your proxy permission to spend your tokens
- Proxy then manages all protocol approvals (Aave, Uniswap, etc.)
- You never pay approval fees to individual protocols

### 2. Create Your First Position

Options:
- **Supply to Aave:** Earn interest on stablecoins/ETH
- **Create Uniswap LP:** Provide liquidity and earn trading fees
- **Leveraged Strategy:** Borrow and LP for higher yields

See [How Hedgehog Works](02-how-it-works.md) for strategy guides.

### 3. Enable Automation (Optional)

Approve a bot address to manage your positions:

```solidity
proxy.setApproved(botAddress)
```

**Benefits:**
- Bot can execute strategies on your behalf
- Auto-rebalance, auto-compound, auto-repay
- Lower fees than manual management (0.1-0.3% vs 0.5%)
- You retain full ownership and can revoke anytime

## Proxy Ownership & Security

### You Always Have Full Control

**What you can do:**
- Create/close positions
- Withdraw all funds instantly
- Approve/revoke bot access
- Execute [Emergency Exit](emergency-exit.md)
- Transfer tokens

**What bots can do:**
- Execute enabled strategies only
- Rebalance LP positions
- Compound fees
- Repay debt (using your position's funds)

**What bots CANNOT do:**
- Withdraw funds to themselves
- Create new positions without your approval
- Transfer ownership
- Execute non-whitelisted strategies

### Multi-Signature Support

For institutional users or DAOs:
- Deploy proxy with multi-sig as owner
- Requires multiple signatures for sensitive operations
- Same automation benefits with added security

## Finding Your Proxy

### Via Dashboard
Your proxy address is displayed prominently on the Hedgehog dashboard.

### Via Smart Contract
```solidity
HHFactory factory = HHFactory(FACTORY_ADDRESS);
address myProxy = factory.hhs(myAddress);
```

### Via Etherscan
1. Go to HHFactory contract on Etherscan
2. Read Contract → `hhs(address owner)`
3. Enter your address
4. Returns your proxy address (or 0x0 if not deployed)

## Proxy Upgrades

Hedgehog uses a factory upgrade pattern:
- New features released via new HHFactory deployment
- Old factories remain active (backward compatible)
- Your proxy continues working
- No action required unless you want new features

**Upgrade Process:**
1. New HHFactory deployed with enhanced features
2. You deploy a new proxy from new factory (optional)
3. Transfer positions to new proxy (if desired)
4. Old proxy remains functional

## Cost Breakdown

| Item | Cost | Frequency |
|------|------|-----------|
| **Proxy Deployment** | $10-15 | One-time |
| **Token Approvals** | $2-3 per token | One-time per token |
| **Total Setup (3 tokens)** | **$16-24** | **One-time** |
| vs. Traditional DeFi | $150-200 | Per protocol set |
| **Savings** | **$134-184** | **~87% savings** |

## Troubleshooting

### "Proxy already exists"
- You can only have one proxy per address
- Check if you already deployed via dashboard or `hhs(yourAddress)` call

### "Factory is inactive"
- Current factory may be deprecated
- Check for new factory address in official docs

### "Transaction failed"
- Ensure you have enough ETH for gas
- Check network (must be Mainnet for production)
- Try increasing gas limit to 300,000

## Related Pages

- [How Hedgehog Works](02-how-it-works.md) - Understanding the proxy architecture
- [Emergency Exit](emergency-exit.md) - How to withdraw all funds
- [Health Factor](health-factor.md) - Managing borrow positions
- [Configure Automated Strategies](automations/configure-automated-strategies.md) - Setting up automation

---

*Need help? Visit our [Discord](https://discord.gg/hedgehog) or check the [FAQ](../FAQ/general-questions.md)*
