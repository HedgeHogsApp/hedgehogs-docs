# Chapter 3: How It Works - For Technical Users

## The Architecture: Why This Outperforms

**Traditional DeFi Architecture**:
```
User → Aave (direct interaction)
User → Uniswap (direct interaction)
User → Compound (direct interaction)

Problems:
- 3 approvals per token (3 × $15 = $45 per token)
- User must sign every transaction (no automation)
- Positions owned by user (can't delegate management)
- No cross-protocol composability
```

**Hedgehog Architecture**:
```
User → HH Proxy (owns all positions) → Aave/Uniswap/etc.
         ↓
    Position Tracking
         ↓
    Strategy Engine
         ↓
    Bot Network → executes strategies
```

**Why This Wins**:

1. **Proxy-Centric Ownership = Universal Automation**
   - Your HH Proxy owns all positions (aTokens, LP NFTs, everything)
   - Why? Protocols like Uniswap V3 don't support delegation
   - Only way to automate: proxy owns position, bot controls proxy
   - Result: Works with ANY protocol, regardless of their design

2. **JIT (Just-In-Time) Approvals = 95% Cost Reduction**
   - You approve proxy once: `USDC.approve(myProxy, unlimited)`
   - Proxy manages protocol approvals as needed
   - First time using Aave? Proxy approves: `USDC.approve(aave, unlimited)`
   - Next time? Approval already exists, skip
   - Result: $3 per token (one-time) vs. $45+ (per protocol per token)

3. **Delegatecall Pattern = Gas-Efficient Execution**
   - Connectors (Aave, Uniswap) are separate contracts
   - Proxy uses delegatecall to execute connector code
   - Connector code runs in proxy's context (accesses proxy's storage)
   - Result: Modular, upgradeable, gas-efficient

4. **Hierarchical Position Tracking = Complex Strategies**
   - Every position stored with unique ID
   - Positions can have parent-child relationships
   - Example: Supply (parent) → Borrow (child) → LP (grandchild)
   - Result: Track complex multi-protocol strategies

## Deep Dive: How Aave Integration Works

**What You See (Simple)**:
```javascript
// User calls: supply 1000 USDC to Aave
proxy.supply(USDC, 1000)
```

**What Actually Happens (Under the Hood)**:

```
Step 1: USER TRANSACTION
├─ User calls proxy.multicall([aaveConnector.supply(USDC, 1000)])
└─ Transaction includes ~$5 gas

Step 2: PROXY DELEGATECALL TO CONNECTOR
├─ Proxy delegatecalls AaveV3Connector.supply()
├─ Connector code runs in proxy's context
└─ msg.sender preserved = user, address(this) = proxy

Step 3: TOKEN TRANSFER WITH FEE
├─ Connector calls: TransferLib.transferFromUser(user, proxy, USDC, 1000)
├─ TransferLib pulls 1000 USDC from user
├─ Deducts 0.5% fee (5 USDC) → sends to fee collector
├─ Transfers 995 USDC to proxy
└─ Proxy now holds 995 USDC

Step 4: JIT APPROVAL CHECK
├─ Check: Does proxy have approval for Aave?
├─ If no: USDC.approve(aavePool, unlimited)
├─ If yes: Skip (save gas)
└─ Now proxy can interact with Aave

Step 5: AAVE INTERACTION
├─ Call: aavePool.supply(USDC, 995, proxy, 0)
├─ Aave takes 995 USDC from proxy
├─ Aave mints 995 aUSDC to proxy
└─ Proxy now owns 995 aUSDC (earning interest)

Step 6: POSITION TRACKING
├─ Generate position ID: hash(proxy, aave, USDC, timestamp)
├─ Store position data in HHStorageV2
├─ Position type: LENDING
├─ Protocol: Aave V3
├─ Amount: 995 aUSDC
└─ Emit PositionCreated event

Step 7: RETURN
├─ Connector returns success
├─ Proxy aggregates results
└─ User receives confirmation

Total gas: ~250k-300k (same as direct Aave interaction)
Total fees: 5 USDC (0.5%)
Net result: 995 aUSDC earning interest in your proxy
```

**Key Technical Insights**:

1. **Delegatecall Context Preservation**
   - Connector code runs as if it's part of proxy
   - Can access proxy's storage, balances, approvals
   - Can't access connector's storage
   - Result: Clean separation, upgradeable connectors

2. **Proxy Owns aTokens, Not User**
   - Traditional: User owns aUSDC directly
   - Hedgehog: Proxy owns aUSDC, user owns proxy
   - Why? Enables automation (bot can manage aTokens)
   - Safety: User can emergency exit to withdraw aTokens

3. **Fee Collection Point = Token Transfer**
   - Fees charged BEFORE protocol interaction
   - TransferLib handles: pull from user → deduct fee → transfer to proxy
   - Clean, auditable, no complex fee logic in connectors

4. **Position Tracking = Multi-Protocol Intelligence**
   - Every interaction creates/updates position record
   - Positions stored in gas-optimized packed format (3 storage slots)
   - Queryable by type, protocol, parent, etc.
   - Result: Bots can monitor all positions efficiently

## Deep Dive: How Uniswap V3 Integration Works

**The Challenge**: Uniswap V3 LP positions are NFTs, owner MUST manage

**Traditional Approach (Impossible)**:
```
User creates LP → User owns NFT → User must sign every rebalance
Result: No automation possible
```

**Hedgehog Approach (Proxy Ownership)**:
```
User calls proxy → Proxy creates LP → Proxy owns NFT → Bot can manage
Result: Full automation enabled
```

**Detailed Flow: Creating Uniswap V3 LP**

```
Step 1: USER TRANSACTION
├─ User calls: proxy.mintPositionUser(ETH, USDC, 1 ETH, 2000 USDC, priceRange)
└─ Transaction includes tokens to deposit

Step 2: DUAL TOKEN TRANSFER WITH FEES
├─ TransferLib pulls 1 ETH from user
├─ Deducts 0.5% fee (0.005 ETH) → fee collector
├─ Transfers 0.995 ETH to proxy
├─ TransferLib pulls 2000 USDC from user
├─ Deducts 0.5% fee (10 USDC) → fee collector
├─ Transfers 1990 USDC to proxy
└─ Proxy now holds: 0.995 ETH + 1990 USDC

Step 3: JIT APPROVAL FOR UNISWAP
├─ Check: Does proxy have approval for NonfungiblePositionManager?
├─ If no: ETH.approve(nftManager, unlimited)
├─ If no: USDC.approve(nftManager, unlimited)
└─ Now proxy can create LP

Step 4: UNISWAP NFT POSITION CREATION
├─ Call: nftManager.mint({
│   token0: USDC,
│   token1: ETH,
│   fee: 3000, // 0.3% fee tier
│   tickLower: -887220, // price range lower bound
│   tickUpper: 887220,  // price range upper bound
│   amount0Desired: 1990,
│   amount1Desired: 0.995,
│   amount0Min: 1980,
│   amount1Min: 0.990,
│   recipient: address(this), // PROXY receives NFT
│   deadline: block.timestamp
│ })
├─ Uniswap creates LP position
├─ Mints NFT with tokenId = 123456
├─ Sends NFT to proxy (proxy now owns NFT #123456)
└─ Returns: (tokenId=123456, liquidity=5000000, amount0=1990, amount1=0.995)

Step 5: POSITION TRACKING
├─ Generate position ID: hash(proxy, uniswap, tokenId, timestamp)
├─ Store position data:
│   ├─ Position type: LIQUIDITY
│   ├─ Protocol: Uniswap V3
│   ├─ NFT ID: 123456
│   ├─ Token pair: ETH-USDC
│   ├─ Price range: [tickLower, tickUpper]
│   └─ Liquidity: 5000000
└─ Emit PositionCreated event

Step 6: ENABLE AUTOMATION (Optional)
├─ User: "Enable AutoRebalance for this position"
├─ Bot monitors position every block
├─ When price moves out of range:
│   ├─ Bot calls: proxy.executeStrategy(AutoRebalance, positionId)
│   ├─ Strategy decreases liquidity from old range
│   ├─ Strategy increases liquidity in new range
│   ├─ Charges 0.1% automation fee
│   └─ Position stays profitable
└─ User never has to touch it

Total gas: ~350k-400k (NFT minting is expensive)
Total fees: 0.005 ETH + 10 USDC (0.5% entry)
Automation fees: 0.1% on rebalances (cheaper than manual)
Net result: Proxy owns LP NFT earning fees, auto-rebalanced 24/7
```

**Why Proxy Ownership is Mandatory**:

```solidity
// Uniswap V3 NonfungiblePositionManager.mint() function:
function mint(MintParams calldata params) external returns (
    uint256 tokenId,
    uint128 liquidity,
    uint256 amount0,
    uint256 amount1
) {
    // ... liquidity calculation ...

    // NFT is ALWAYS minted to params.recipient
    _mint(params.recipient, tokenId);

    // Position owner = NFT owner (no delegation)
    positions[tokenId] = Position({
        nonce: 0,
        operator: address(0),
        token0: params.token0,
        token1: params.token1,
        fee: params.fee,
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        liquidity: liquidity,
        feeGrowthInside0LastX128: feeGrowthInside0LastX128,
        feeGrowthInside1LastX128: feeGrowthInside1LastX128,
        tokensOwed0: 0,
        tokensOwed1: 0
    });
}

// To modify position, you must be NFT owner or approved operator
function decreaseLiquidity(DecreaseLiquidityParams calldata params) external {
    require(_isApprovedOrOwner(msg.sender, params.tokenId));
    // ... decrease logic ...
}
```

**Translation**:
- Uniswap has NO "onBehalfOf" parameter
- NFT owner = position manager (no exceptions)
- For bot to rebalance: Bot must control NFT
- For bot to control NFT: Proxy must own NFT
- For proxy to own NFT: User must approve proxy as their interface

**This is why proxy-centric architecture is the ONLY way to automate Uniswap V3.**

## The Strategy Engine: How Automation Works

**Architecture**:
```
Off-Chain: BOT NETWORK
├─ Monitors all HH Proxies
├─ Queries positions from HHStorageV2
├─ For each position:
│   ├─ Checks if strategy is enabled
│   └─ Calls strategy.canExecuteStrategy(positionId)
└─ If true: Sends transaction to execute strategy

On-Chain: STRATEGY CONTRACTS
├─ canExecuteStrategy(positionId): Pure view function
│   ├─ Checks position state (price range, health factor, etc.)
│   └─ Returns true/false (should execute?)
└─ executeStrategy(positionId): State-changing function
    ├─ Validates caller is authorized bot
    ├─ Executes strategy logic (rebalance, compound, repay)
    ├─ Charges automation fee (0.1-0.2%)
    └─ Emits StrategyExecuted event
```

**Example: AutoRebalance Strategy for Uniswap V3**

```
BOT MONITORING LOOP (every block):
├─ Query all LIQUIDITY positions from proxy storage
├─ For each Uniswap LP position:
│   ├─ Get current price from Uniswap pool
│   ├─ Get position's price range [tickLower, tickUpper]
│   ├─ Check: currentPrice < tickLower OR currentPrice > tickUpper?
│   └─ If out of range: Call strategy
└─ Sleep until next block

STRATEGY EXECUTION (on-chain):
├─ Bot calls: proxy.executeStrategy(AutoRebalance, positionId)
├─ Proxy delegatecalls AutoRebalanceStrategy.executeStrategy()
├─ Strategy logic:
│   ├─ Fetch NFT tokenId from position storage
│   ├─ Call: uniswap.decreaseLiquidity(tokenId, 100%) // remove all liquidity
│   ├─ Collect tokens: proxy receives ETH + USDC
│   ├─ Calculate new optimal price range (e.g., ±10% from current)
│   ├─ Call: uniswap.mint(ETH, USDC, newTickLower, newTickUpper, recipient=proxy)
│   ├─ Proxy receives new NFT with fresh price range
│   ├─ Charge 0.1% automation fee from position value
│   ├─ Update position storage with new NFT ID
│   └─ Emit: StrategyExecuted(AutoRebalance, positionId, feeCharged)
└─ Position is now in-range, earning fees again

USER IMPACT:
├─ LP was out of range: earning 0 fees
├─ Bot rebalanced: now in range again
├─ Cost: 0.1% fee (~$5 on $5k position) + gas (paid by bot)
├─ Alternative: Manual rebalance = $15 gas + your time + you have to notice
└─ Result: Better yields, lower cost, zero effort
```

**Key Technical Points**:

1. **Bots are Stateless**
   - No off-chain database of positions needed
   - Query positions directly from HHStorageV2 on-chain
   - canExecuteStrategy() is pure view function (no gas)
   - Result: Any bot can monitor any proxy

2. **Strategies are Modular**
   - Each strategy = separate contract
   - Proxy delegatecalls strategy code
   - Strategies can call multiple connectors
   - Result: Easy to add new strategies without touching core

3. **Execution is Permissionless**
   - ANY bot can execute strategies
   - Authorization checked on-chain (bot must be approved by user)
   - Competition between bots = lower fees, faster execution
   - Result: Decentralized, censorship-resistant

4. **Fees Align Incentives**
   - Automation fees LOWER than manual fees
   - Bots earn fees by executing strategies
   - Users save money by using automation
   - Protocol earns revenue from all operations
   - Result: Win-win-win

## Multi-Protocol Strategies: The Real Alpha

**Simple Strategy**: AutoCompound on single Uniswap LP
```
LP earns fees → Bot collects → Bot adds fees back to LP → Compound effect
```

**Advanced Strategy**: Leveraged Yield Farming (Aave + Uniswap)
```
Step 1: User supplies $10k USDC to Aave (collateral)
Step 2: User borrows $7k ETH against USDC (70% LTV)
Step 3: User creates $14k ETH-USDC LP on Uniswap ($7k ETH + $7k USDC)
Step 4: Enable automation:
  ├─ AutoRebalance: Keep LP in range
  ├─ AutoCompound: Reinvest LP fees
  └─ AutoRepay: Use LP fees to pay down Aave debt if health factor drops

Result:
- Effective leverage: 1.4x ($14k LP from $10k capital)
- Earning: 40% APY on $14k = $5,600/year
- Paying: 3% borrow rate on $7k = $210/year
- Net: $5,390/year = 53.9% APY on original $10k
- Risk: Auto-managed, bot prevents liquidation
```

**Complex Strategy**: Delta-Neutral Farming (Market-Neutral)
```
Goal: Earn LP fees WITHOUT price exposure

Setup:
├─ Supply $5k USDC to Aave
├─ Borrow $5k ETH from Aave
├─ Create $10k ETH-USDC LP on Uniswap ($5k ETH + $5k USDC)
└─ Net position: Long $5k ETH (LP) + Short $5k ETH (debt) = Delta-neutral

Automation:
├─ AutoRebalance: Keep LP in range
├─ AutoHedge: If ETH price moves, adjust debt to maintain delta neutrality
└─ AutoCompound: Reinvest LP fees

Result:
- LP earns 40% APY on $10k = $4k/year
- Borrow cost: 3% on $5k = $150/year
- Net: $3,850/year = 38.5% APY
- Price risk: Near zero (hedged)
- Automation handles all adjustments
```

**Why This Outperforms**:

1. **Capital Efficiency**: Use same capital across multiple protocols
2. **Risk Management**: Automated health factor monitoring, auto-deleverage
3. **Compound Effect**: Every fee reinvested immediately (not sitting idle)
4. **No Missed Opportunities**: Bot executes 24/7, you never miss a rebalance
5. **Lower Costs**: Automation fees < gas costs of manual management

---

*Next: [Chapter 4: Smart Contract Architecture](04-smart-contract-architecture.md) - Contract design patterns and security*
