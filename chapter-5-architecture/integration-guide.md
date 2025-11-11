# Chapter 5: Integration Guide - Building on Hedgehog

## For Frontend Developers

### 1. Connecting to User's Proxy

```typescript
import { ethers } from 'ethers';
import HHFactoryABI from './abis/HHFactory.json';
import HHABI from './abis/HH.json';

const HH_FACTORY = '0x...'; // Deployed HHFactory address

// Get user's proxy address
async function getUserProxy(userAddress: string): Promise<string | null> {
  const factory = new ethers.Contract(HH_FACTORY, HHFactoryABI, provider);
  const proxyAddress = await factory.getProxy(userAddress);

  if (proxyAddress === ethers.constants.AddressZero) {
    return null; // No proxy deployed yet
  }

  return proxyAddress;
}

// Deploy proxy for user
async function deployProxy(signer: ethers.Signer): Promise<string> {
  const factory = new ethers.Contract(HH_FACTORY, HHFactoryABI, signer);
  const tx = await factory.deploy(0); // referralCode = 0
  const receipt = await tx.wait();

  const event = receipt.events?.find(e => e.event === 'ProxyDeployed');
  return event?.args?.proxy;
}
```

### 2. Reading User Positions

```typescript
import HHStorageV2ABI from './abis/HHStorageV2.json';

interface Position {
  id: string;
  protocol: string;
  type: 'LENDING' | 'BORROWING' | 'LIQUIDITY' | 'FARMING' | 'REWARD';
  parent: string | null;
  createdAt: number;
}

// Get all active positions
async function getActivePositions(proxyAddress: string): Promise<Position[]> {
  const proxy = new ethers.Contract(proxyAddress, HHStorageV2ABI, provider);
  const positionIds: string[] = await proxy.getActivePositions();

  const positions: Position[] = [];
  for (const id of positionIds) {
    const pos = await proxy.getPosition(id);
    positions.push({
      id,
      protocol: pos.protocol,
      type: pos.positionType,
      parent: pos.parentPosition !== ethers.constants.HashZero ? pos.parentPosition : null,
      createdAt: pos.createdAt
    });
  }

  return positions;
}
```

### 3. Executing Operations

```typescript
import AaveV3ConnectorABI from './abis/AaveV3Connector.json';

const AAVE_CONNECTOR = '0x...';

// Supply to Aave
async function supplyToAave(
  signer: ethers.Signer,
  proxyAddress: string,
  token: string,
  amount: ethers.BigNumber
) {
  // 1. Approve proxy to spend user's tokens
  const tokenContract = new ethers.Contract(token, ERC20ABI, signer);
  const allowance = await tokenContract.allowance(await signer.getAddress(), proxyAddress);

  if (allowance.lt(amount)) {
    const approveTx = await tokenContract.approve(proxyAddress, ethers.constants.MaxUint256);
    await approveTx.wait();
  }

  // 2. Encode connector call
  const connector = new ethers.Interface(AaveV3ConnectorABI);
  const calldata = connector.encodeFunctionData('supply', [token, amount]);

  // 3. Execute via proxy multicall
  const proxy = new ethers.Contract(proxyAddress, HHABI, signer);
  const tx = await proxy.multicall(
    [AAVE_CONNECTOR], // targets
    [calldata]         // data
  );

  const receipt = await tx.wait();

  // 4. Get position ID from events
  const event = receipt.events?.find(e => e.event === 'PositionCreated');
  return event?.args?.positionId;
}
```

### 4. Monitoring Automation

```typescript
// Enable strategy on position
async function enableStrategy(
  signer: ethers.Signer,
  proxyAddress: string,
  strategyAddress: string,
  positionId: string
) {
  const proxy = new ethers.Contract(proxyAddress, HHABI, signer);
  const tx = await proxy.setStrategyEnabled(positionId, strategyAddress, true);
  await tx.wait();
}

// Listen for strategy execution events
async function watchStrategyExecutions(proxyAddress: string, callback: (event: any) => void) {
  const proxy = new ethers.Contract(proxyAddress, HHABI, provider);

  proxy.on('StrategyExecuted', (strategyAddress, positionId, feeCharged, event) => {
    callback({
      strategy: strategyAddress,
      position: positionId,
      fee: feeCharged,
      txHash: event.transactionHash
    });
  });
}
```

## For Bot Developers

### 1. Position Monitoring Loop

```python
from web3 import Web3
from typing import List
import time

w3 = Web3(Web3.HTTPProvider('https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY'))

def get_all_proxies() -> List[str]:
    """Get all deployed HH proxies from factory events"""
    deploy_filter = hh_factory.events.ProxyDeployed.create_filter(fromBlock=DEPLOY_BLOCK)
    events = deploy_filter.get_all_entries()
    return [event['args']['proxy'] for event in events]

def can_execute(proxy_address: str, position_id: str) -> bool:
    """Check if strategy can be executed for position"""
    try:
        return strategy.functions.canExecuteStrategy(proxy_address, position_id).call()
    except Exception:
        return False

def execute_strategy(proxy_address: str, position_id: str):
    """Execute strategy on position"""
    proxy = w3.eth.contract(address=proxy_address, abi=HH_ABI)

    tx = proxy.functions.executeStrategy(
        STRATEGY_ADDRESS,
        position_id
    ).build_transaction({
        'from': BOT_ADDRESS,
        'gas': 500000,
        'gasPrice': w3.eth.gas_price,
        'nonce': w3.eth.get_transaction_count(BOT_ADDRESS)
    })

    signed_tx = w3.eth.account.sign_transaction(tx, BOT_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return tx_hash

# Main monitoring loop
def monitor_positions():
    while True:
        try:
            proxies = get_all_proxies()
            for proxy in proxies:
                positions = get_positions_for_proxy(proxy)
                for position_id in positions:
                    if can_execute(proxy, position_id):
                        execute_strategy(proxy, position_id)
            time.sleep(12)  # Wait for next block
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(12)
```

### 2. Gas Price Optimization

```python
def get_optimal_gas_price() -> int:
    """Get optimal gas price using EIP-1559"""
    latest_block = w3.eth.get_block('latest')
    base_fee = latest_block['baseFeePerGas']
    priority_fee = w3.to_wei(1.5, 'gwei')
    max_fee = int(base_fee * 1.2 + priority_fee)
    return max_fee

def should_execute_now(estimated_profit: int, gas_cost: int) -> bool:
    """Only execute if profitable after gas"""
    return estimated_profit > gas_cost * 1.5  # 50% profit margin
```

## For Protocol Developers

### Connector Template

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TransferLib} from "../libraries/TransferLib.sol";
import {FeesLib} from "../libraries/FeesLib.sol";
import {HHStorageV2} from "../core/HHStorageV2.sol";

contract YourProtocolConnector {
    using TransferLib for address;
    using FeesLib for bytes32;

    address public immutable YOUR_PROTOCOL;
    address public immutable HH_DIRECTORY;

    constructor(address _protocol, address _directory) {
        YOUR_PROTOCOL = _protocol;
        HH_DIRECTORY = _directory;
    }

    /// @notice User deposits tokens to YourProtocol
    function deposit(
        address asset,
        uint256 amount
    ) external returns (bytes32 positionId) {
        // 1. Transfer tokens from user with fee
        uint256 amountAfterFee = TransferLib.transferFromUser(
            asset,
            msg.sender,
            address(this),
            amount,
            HH_DIRECTORY,
            keccak256(abi.encodePacked(address(this), "deposit"))
        );

        // 2. JIT approval for protocol
        if (IERC20(asset).allowance(address(this), YOUR_PROTOCOL) < amountAfterFee) {
            IERC20(asset).approve(YOUR_PROTOCOL, type(uint256).max);
        }

        // 3. Interact with protocol
        uint256 protocolPositionId = IYourProtocol(YOUR_PROTOCOL).deposit(
            asset,
            amountAfterFee,
            address(this)  // Proxy receives position tokens
        );

        // 4. Track position (self-call pattern)
        positionId = HHStorageV2(address(this)).createPositionForConnector(
            YOUR_PROTOCOL,
            protocolPositionId,
            HHStorageV2.PositionType.YOUR_TYPE,
            bytes32(0),
            ""
        );

        emit PositionCreated(positionId, asset, amountAfterFee);
    }

    /// @notice Withdraw from protocol
    function withdraw(bytes32 positionId, uint256 amount) external {
        HHStorageV2.Position memory pos = HHStorageV2(address(this)).getPosition(positionId);

        IYourProtocol(YOUR_PROTOCOL).withdraw(pos.protocolPositionId, amount);

        // Charge fee if bot execution
        if (msg.sender != HHStorageV2(address(this)).owner()) {
            FeesLib.collectAutomationFee(asset, amount, HH_DIRECTORY, "withdraw");
        }

        if (amount == pos.amount) {
            HHStorageV2(address(this)).closePosition(positionId);
        }
    }
}
```

### Testing Your Connector

```solidity
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import {BaseHedgehogForkTest} from "./BaseHedgehogForkTest.sol";

contract YourProtocolConnectorTest is BaseHedgehogForkTest {
    function setUp() public override {
        super.setUp();
        yourConnector = new YourProtocolConnector(YOUR_PROTOCOL, directory);

        vm.prank(admin);
        directory.whitelistProtocol(YOUR_PROTOCOL, true);
    }

    function test_Deposit() public {
        deal(USDC, user, 1000e6);

        vm.startPrank(user);
        IERC20(USDC).approve(userProxy, type(uint256).max);

        bytes memory data = abi.encodeCall(yourConnector.deposit, (USDC, 1000e6));
        bytes memory result = HH(payable(userProxy)).multicall(
            [address(yourConnector)],
            [data]
        );

        bytes32 positionId = abi.decode(result, (bytes32));
        assertTrue(positionId != bytes32(0));

        uint256 balance = IYourProtocol(YOUR_PROTOCOL).balanceOf(userProxy);
        assertGt(balance, 0);
    }
}
```

---

*Next: [Chapter 6: Competitive Advantage](06-competitive-advantage.md) - Market positioning and target users*
