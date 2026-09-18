# Connector Contracts

## What are Connectors?

**Connectors** are the bridge between HH proxies and external DeFi protocols. Each protocol (Aave, Uniswap, etc.) has its own connector that translates Hedgehog operations into protocol-specific calls.

**Design philosophy:**
- **Proxy-centric ownership** - All positions owned by `address(this)` (the proxy)
- **Dual-context execution** - Support both user and bot callers with appropriate fees
- **Modular** - Add new protocols without changing core contracts
- **Stateless** - All state stored in HHStorage, not in connectors

## Connector Architecture

```
┌──────────────────────────────────────────────────────────┐
│               HH Proxy (User's Wallet)                    │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │                  HHStorage                          │ │
│  │  - Position tracking                                │ │
│  │  - Metadata storage                                 │ │
│  └────────────────────────────────────────────────────┘ │
└────────────┬─────────────────────────┬──────────────────┘
             │ delegatecall            │ delegatecall
             ▼                         ▼
┌──────────────────────────┐  ┌────────────────────────────┐
│    AaveV3Connector       │  │    UniswapV3Connector      │
│                          │  │                            │
│  - supply()              │  │  - mintPositionUser()      │
│  - borrow()              │  │  - mintPosition()          │
│  - repay()               │  │  - increaseLiquidity()     │
│  - withdraw()            │  │  - decreaseLiquidity()     │
│                          │  │  - collect()               │
└────────────┬─────────────┘  └─────────────┬──────────────┘
             │ call                          │ call
             ▼                               ▼
┌──────────────────────────┐  ┌────────────────────────────┐
│   Aave V3 Pool           │  │   Uniswap V3 NftManager    │
└──────────────────────────┘  └────────────────────────────┘
```

## AaveV3Connector

### Overview

Handles all Aave V3 lending and borrowing operations.

### Key Functions

#### supply()

Supply collateral to Aave and receive aTokens.

```solidity
function supply(
    address asset,
    uint256 amount,
    bytes32 parentPositionId
) external returns (bytes32 positionId) {
    // Determine execution context
    bool isUserCaller = msg.sender == HHOwnable(address(this)).owner();

    uint256 netAmount;

    if (isUserCaller) {
        // User path: Pull from user with fee
        netAmount = TransferLib.transferTokenFromUser(
            asset,
            msg.sender,
            address(this),
            amount
        );
    } else {
        // Bot path: Use proxy balance with automation fee
        netAmount = amount;
        uint256 fee = FeesLib.collectAutomationFee("supply", asset, amount);
        netAmount -= fee;
    }

    // Approve Aave pool
    IERC20(asset).approve(address(aavePool), netAmount);

    // Supply to Aave
    aavePool.supply(asset, netAmount, address(this), 0);

    // Create position
    positionId = HHStorageLib.createPosition(
        PositionType.LENDING,
        address(aavePool),
        parentPositionId
    );

    // Store metadata
    HHStorageLib.setPositionData(positionId, "asset", abi.encode(asset));
    HHStorageLib.setPositionData(positionId, "amount", abi.encode(netAmount));

    emit SupplyCreated(positionId, asset, netAmount);

    return positionId;
}
```

#### borrow()

Borrow assets against supplied collateral.

```solidity
function borrow(
    address asset,
    uint256 amount,
    bytes32 supplyPositionId
) external returns (bytes32 positionId) {
    // Borrow from Aave
    aavePool.borrow(
        asset,
        amount,
        2, // Variable rate mode
        0,
        address(this) // Proxy receives borrowed assets
    );

    // Create borrow position linked to supply
    positionId = HHStorageLib.createPosition(
        PositionType.BORROWING,
        address(aavePool),
        supplyPositionId
    );

    // Store metadata
    HHStorageLib.setPositionData(positionId, "asset", abi.encode(asset));
    HHStorageLib.setPositionData(positionId, "amount", abi.encode(amount));

    // Optional: Collect borrow fee (usually 0% for user, small for bot)
    if (msg.sender != HHOwnable(address(this)).owner()) {
        uint256 fee = FeesLib.collectAutomationFee("borrow", asset, amount);
        // Fee deducted from borrowed amount
    }

    emit BorrowCreated(positionId, asset, amount, supplyPositionId);

    return positionId;
}
```

#### repay()

Repay borrowed assets.

```solidity
function repay(
    bytes32 borrowPositionId,
    uint256 amount
) external returns (uint256 repaidAmount) {
    // Get borrow position metadata
    bytes memory assetData = HHStorageLib.getPositionData(borrowPositionId, "asset");
    address asset = abi.decode(assetData, (address));

    // Collect fee based on context
    bool isUserCaller = msg.sender == HHOwnable(address(this)).owner();
    uint256 fee;

    if (isUserCaller) {
        fee = FeesLib.collectUserFee("repay", asset, amount);
    } else {
        fee = FeesLib.collectAutomationFee("repay", asset, amount);
    }

    uint256 netAmount = amount - fee;

    // Approve and repay
    IERC20(asset).approve(address(aavePool), netAmount);
    repaidAmount = aavePool.repay(asset, netAmount, 2, address(this));

    // Update position metadata
    bytes memory currentAmountData = HHStorageLib.getPositionData(borrowPositionId, "amount");
    uint256 currentAmount = abi.decode(currentAmountData, (uint256));
    uint256 newAmount = currentAmount - repaidAmount;

    HHStorageLib.setPositionData(borrowPositionId, "amount", abi.encode(newAmount));

    // If fully repaid, deactivate position
    if (newAmount == 0) {
        HHStorageLib.deactivatePosition(borrowPositionId);
    }

    emit Repaid(borrowPositionId, asset, repaidAmount);

    return repaidAmount;
}
```

#### withdraw()

Withdraw supplied collateral.

```solidity
function withdraw(
    bytes32 supplyPositionId,
    uint256 amount
) external returns (uint256 withdrawnAmount) {
    // Get position metadata
    bytes memory assetData = HHStorageLib.getPositionData(supplyPositionId, "asset");
    address asset = abi.decode(assetData, (address));

    // Withdraw from Aave
    withdrawnAmount = aavePool.withdraw(asset, amount, address(this));

    // Collect fee
    bool isUserCaller = msg.sender == HHOwnable(address(this)).owner();
    uint256 fee;

    if (isUserCaller) {
        fee = FeesLib.collectUserFee("withdraw", asset, withdrawnAmount);
    } else {
        fee = FeesLib.collectAutomationFee("withdraw", asset, withdrawnAmount);
    }

    uint256 netAmount = withdrawnAmount - fee;

    // Update position
    bytes memory currentAmountData = HHStorageLib.getPositionData(supplyPositionId, "amount");
    uint256 currentAmount = abi.decode(currentAmountData, (uint256));
    uint256 newAmount = currentAmount - withdrawnAmount;

    HHStorageLib.setPositionData(supplyPositionId, "amount", abi.encode(newAmount));

    // If fully withdrawn, deactivate
    if (newAmount == 0) {
        HHStorageLib.deactivatePosition(supplyPositionId);
    }

    // Transfer to user (or keep in proxy for bot)
    if (isUserCaller) {
        IERC20(asset).transfer(msg.sender, netAmount);
    }

    emit Withdrawn(supplyPositionId, asset, withdrawnAmount);

    return netAmount;
}
```

## UniswapV3Connector

### Overview

Handles Uniswap V3 liquidity provision and management.

**Key difference from Aave:** Uniswap V3 doesn't support delegation, so proxy MUST own NFT positions.

### Key Functions

#### mintPositionUser()

Mint new LP position (user-initiated).

```solidity
function mintPositionUser(
    address token0,
    address token1,
    uint24 fee,
    MintParams calldata params,
    bytes32 parentPositionId
) external returns (bytes32 positionId, uint256 tokenId) {
    // Pull tokens from user with fees
    uint256 netAmount0 = TransferLib.transferTokenFromUser(
        token0,
        msg.sender,
        address(this),
        params.amount0
    );

    uint256 netAmount1 = TransferLib.transferTokenFromUser(
        token1,
        msg.sender,
        address(this),
        params.amount1
    );

    // Approve Uniswap NFT manager
    IERC20(token0).approve(address(nftPositionManager), netAmount0);
    IERC20(token1).approve(address(nftPositionManager), netAmount1);

    // Mint position (proxy receives NFT)
    INonfungiblePositionManager.MintParams memory mintParams = INonfungiblePositionManager.MintParams({
        token0: token0,
        token1: token1,
        fee: fee,
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        amount0Desired: netAmount0,
        amount1Desired: netAmount1,
        amount0Min: params.amount0Min,
        amount1Min: params.amount1Min,
        recipient: address(this), // CRITICAL: Proxy owns NFT
        deadline: block.timestamp
    });

    (tokenId, , , ) = nftPositionManager.mint(mintParams);

    // Create position
    positionId = HHStorageLib.createPosition(
        PositionType.LIQUIDITY,
        address(nftPositionManager),
        parentPositionId
    );

    // Store metadata
    HHStorageLib.setPositionData(positionId, "tokenId", abi.encode(tokenId));
    HHStorageLib.setPositionData(positionId, "token0", abi.encode(token0));
    HHStorageLib.setPositionData(positionId, "token1", abi.encode(token1));
    HHStorageLib.setPositionData(positionId, "fee", abi.encode(fee));

    emit LiquidityPositionCreated(positionId, tokenId, token0, token1, fee);

    return (positionId, tokenId);
}
```

#### mintPosition()

Mint new LP position (bot-initiated, uses proxy balance).

```solidity
function mintPosition(
    address token0,
    address token1,
    uint24 fee,
    MintParams calldata params,
    bytes32 parentPositionId
) external returns (bytes32 positionId, uint256 tokenId) {
    // Bot path: Collect automation fee from amounts
    uint256 fee0 = FeesLib.collectAutomationFee("mintPosition", token0, params.amount0);
    uint256 fee1 = FeesLib.collectAutomationFee("mintPosition", token1, params.amount1);

    uint256 netAmount0 = params.amount0 - fee0;
    uint256 netAmount1 = params.amount1 - fee1;

    // Approve and mint (same as user path)
    IERC20(token0).approve(address(nftPositionManager), netAmount0);
    IERC20(token1).approve(address(nftPositionManager), netAmount1);

    INonfungiblePositionManager.MintParams memory mintParams = INonfungiblePositionManager.MintParams({
        token0: token0,
        token1: token1,
        fee: fee,
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        amount0Desired: netAmount0,
        amount1Desired: netAmount1,
        amount0Min: params.amount0Min,
        amount1Min: params.amount1Min,
        recipient: address(this), // Proxy owns NFT
        deadline: block.timestamp
    });

    (tokenId, , , ) = nftPositionManager.mint(mintParams);

    // Create position (same as user path)
    positionId = HHStorageLib.createPosition(
        PositionType.LIQUIDITY,
        address(nftPositionManager),
        parentPositionId
    );

    // Store metadata
    HHStorageLib.setPositionData(positionId, "tokenId", abi.encode(tokenId));
    HHStorageLib.setPositionData(positionId, "token0", abi.encode(token0));
    HHStorageLib.setPositionData(positionId, "token1", abi.encode(token1));
    HHStorageLib.setPositionData(positionId, "fee", abi.encode(fee));

    emit LiquidityPositionCreated(positionId, tokenId, token0, token1, fee);

    return (positionId, tokenId);
}
```

#### decreaseLiquidity()

Remove liquidity from position.

```solidity
function decreaseLiquidity(
    bytes32 positionId,
    uint128 liquidity
) external returns (uint256 amount0, uint256 amount1) {
    // Get NFT tokenId
    bytes memory tokenIdData = HHStorageLib.getPositionData(positionId, "tokenId");
    uint256 tokenId = abi.decode(tokenIdData, (uint256));

    // Decrease liquidity
    INonfungiblePositionManager.DecreaseLiquidityParams memory params = INonfungiblePositionManager.DecreaseLiquidityParams({
        tokenId: tokenId,
        liquidity: liquidity,
        amount0Min: 0,
        amount1Min: 0,
        deadline: block.timestamp
    });

    (amount0, amount1) = nftPositionManager.decreaseLiquidity(params);

    // Collect fees based on context
    bool isUserCaller = msg.sender == HHOwnable(address(this)).owner();

    bytes memory token0Data = HHStorageLib.getPositionData(positionId, "token0");
    bytes memory token1Data = HHStorageLib.getPositionData(positionId, "token1");
    address token0 = abi.decode(token0Data, (address));
    address token1 = abi.decode(token1Data, (address));

    if (isUserCaller) {
        FeesLib.collectUserFee("decreaseLiquidity", token0, amount0);
        FeesLib.collectUserFee("decreaseLiquidity", token1, amount1);
    } else {
        FeesLib.collectAutomationFee("decreaseLiquidity", token0, amount0);
        FeesLib.collectAutomationFee("decreaseLiquidity", token1, amount1);
    }

    emit LiquidityDecreased(positionId, tokenId, liquidity, amount0, amount1);

    return (amount0, amount1);
}
```

#### collect()

Collect fees and withdrawn tokens.

```solidity
function collect(
    bytes32 positionId
) external returns (uint256 amount0, uint256 amount1) {
    // Get NFT tokenId
    bytes memory tokenIdData = HHStorageLib.getPositionData(positionId, "tokenId");
    uint256 tokenId = abi.decode(tokenIdData, (uint256));

    // Collect
    INonfungiblePositionManager.CollectParams memory params = INonfungiblePositionManager.CollectParams({
        tokenId: tokenId,
        recipient: address(this), // Proxy receives tokens
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
    });

    (amount0, amount1) = nftPositionManager.collect(params);

    // Collect fees
    bool isUserCaller = msg.sender == HHOwnable(address(this)).owner();

    bytes memory token0Data = HHStorageLib.getPositionData(positionId, "token0");
    bytes memory token1Data = HHStorageLib.getPositionData(positionId, "token1");
    address token0 = abi.decode(token0Data, (address));
    address token1 = abi.decode(token1Data, (address));

    if (isUserCaller) {
        FeesLib.collectUserFee("collect", token0, amount0);
        FeesLib.collectUserFee("collect", token1, amount1);
    } else {
        FeesLib.collectAutomationFee("collect", token0, amount0);
        FeesLib.collectAutomationFee("collect", token1, amount1);
    }

    emit FeesCollected(positionId, tokenId, amount0, amount1);

    return (amount0, amount1);
}
```

## Creating New Connectors

### Template

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {HHStorageLib, PositionType} from "../libraries/HHStorageLib.sol";
import {TransferLib} from "../libraries/TransferLib.sol";
import {FeesLib} from "../libraries/FeesLib.sol";
import {HHOwnable} from "../core/HHOwnable.sol";

contract NewProtocolConnector {
    address public immutable protocolAddress;

    constructor(address _protocolAddress) {
        protocolAddress = _protocolAddress;
    }

    function someOperation(
        address asset,
        uint256 amount,
        bytes32 parentPositionId
    ) external returns (bytes32 positionId) {
        // 1. Determine caller context
        bool isUserCaller = msg.sender == HHOwnable(address(this)).owner();

        // 2. Handle tokens based on context
        uint256 netAmount;

        if (isUserCaller) {
            // User path: Pull from user with fee
            netAmount = TransferLib.transferTokenFromUser(
                asset,
                msg.sender,
                address(this),
                amount
            );
        } else {
            // Bot path: Use proxy balance with automation fee
            uint256 fee = FeesLib.collectAutomationFee("someOperation", asset, amount);
            netAmount = amount - fee;
        }

        // 3. Interact with protocol
        // CRITICAL: Always use address(this) as recipient/owner
        IProtocol(protocolAddress).doSomething(asset, netAmount, address(this));

        // 4. Create position
        positionId = HHStorageLib.createPosition(
            PositionType.SOME_TYPE,
            protocolAddress,
            parentPositionId
        );

        // 5. Store metadata
        HHStorageLib.setPositionData(positionId, "asset", abi.encode(asset));
        HHStorageLib.setPositionData(positionId, "amount", abi.encode(netAmount));

        // 6. Emit event
        emit OperationExecuted(positionId, asset, netAmount);

        return positionId;
    }
}
```

### Checklist

- [ ] **Proxy-centric**: All positions owned by `address(this)`
- [ ] **Dual-context**: Support both user and bot callers
- [ ] **Fee collection**: Use TransferLib (user) or FeesLib (bot)
- [ ] **Position tracking**: Create positions in HHStorage
- [ ] **Metadata storage**: Store relevant data for automation
- [ ] **Event emission**: Emit events for frontend/indexers
- [ ] **Error handling**: Descriptive error messages
- [ ] **Gas optimization**: Minimize storage operations
- [ ] **Reentrancy protection**: If needed (usually handled by proxy)

## Key Takeaways

✅ Connectors bridge proxies and protocols
✅ Proxy-centric ownership: ALL positions owned by `address(this)`
✅ Dual-context execution: Different fee paths for user vs bot
✅ Stateless design: All state in HHStorage, not connector
✅ Modular: Easy to add new protocols without core changes
✅ Template-driven: Follow pattern for consistency

---

[Back to Smart Contracts](README.md)
