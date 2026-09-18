# Security

## Security Philosophy

Hedgehog Protocol prioritizes security through:
- **Defense in depth** - Multiple layers of protection
- **User custody** - Users always control their funds
- **Battle-tested components** - Building on Aave, Uniswap
- **Open source** - Transparent, auditable code
- **Community-driven** - Bug bounties, responsible disclosure

## Security Model

### Layer 1: User Ownership

**Users maintain full custody:**

```
User (EOA)
  ↓ owns
HH Proxy Contract
  ↓ contains
All Positions (aTokens, LP NFTs, etc.)
```

**Key properties:**
- ✅ User can withdraw all funds anytime
- ✅ User can revoke bot access instantly
- ✅ User can upgrade strategies
- ❌ No one else can withdraw user funds
- ❌ No admin keys that can freeze funds
- ❌ No centralized control

### Layer 2: Access Control

**Three tiers of access:**

**Owner (User):**
- Execute any operation
- Withdraw funds
- Change approved address
- Enable/disable strategies
- Emergency exit

**Approved (Bot):**
- Execute enabled strategies only
- CANNOT withdraw funds
- CANNOT change ownership
- CANNOT execute arbitrary calls

**Whitelisted Protocols:**
- Only approved protocols can be called
- Prevents interaction with malicious contracts
- Managed by HHDirectory governance

**Code:**
```solidity
function execute(address target, bytes calldata data) external onlyOwner {
    require(directory.isProtocolWhitelisted(target), "Not whitelisted");
    // Execute call
}

function multicall(Call[] calldata calls) external {
    require(
        msg.sender == owner ||
        (msg.sender == approved && directory.isCallerWhitelisted(msg.sender)),
        "Unauthorized"
    );
    // Execute calls
}
```

### Layer 3: Protocol Isolation

**Connector architecture isolates protocols:**

```
Bug in AaveV3Connector → Only Aave positions affected
Bug in UniswapV3Connector → Only Uniswap positions affected

Connectors are stateless:
- No token storage
- No position ownership
- All state in proxy
```

**Benefits:**
- Limit blast radius of bugs
- Upgrade connectors independently
- Add new protocols safely

### Layer 4: Delegatecall Safety

**Delegatecall security:**

```solidity
// Proxy executes connector code
(bool success, bytes memory result) = connector.delegatecall(data);
```

**Risks:**
- Malicious connector could manipulate proxy storage
- Need to trust connector code

**Mitigations:**
- Only whitelisted connectors
- Connectors audited before whitelisting
- No user-supplied delegatecall targets
- Governance-controlled whitelist

### Layer 5: Economic Security

**Incentive alignment:**

**Users:**
- Keep majority of value generated
- Save money vs alternatives
- Maintain custody and control

**Bots:**
- Earn automation fees
- Incentivized to execute profitable strategies
- Competition ensures reliable execution

**Protocol:**
- Earn fees for sustainable development
- Reputation at stake for security
- Long-term value > short-term exploits

## Threat Model

### What We Protect Against

**1. Malicious Actors**

**Attack:** Try to drain user funds
**Defense:**
- Access control (only owner can withdraw)
- Protocol whitelisting (no malicious contracts)
- Audited code (reduce attack surface)

**Attack:** MEV/sandwich attacks on swaps
**Defense:**
- Slippage protection on all swaps
- Private transaction options (Flashbots)
- Optimal routing via 1inch/UniswapV3

**Attack:** Reentrancy attacks
**Defense:**
- ReentrancyGuard on critical functions
- Checks-effects-interactions pattern
- Read-only reentrancy awareness

**2. Protocol Bugs**

**Scenario:** Bug in Hedgehog contracts
**Defense:**
- Multiple audits
- Bug bounty program
- Gradual rollout
- Emergency pause (if needed)

**Scenario:** Bug in Aave/Uniswap
**Defense:**
- User maintains custody (can exit anytime)
- Emergency exit function
- Monitor protocol health
- Diversification across protocols

**3. Oracle Manipulation**

**Scenario:** Price oracle returns wrong price
**Defense:**
- Use reputable oracles (Chainlink, Uniswap TWAP)
- Sanity checks on price data
- Slippage protection
- Multi-oracle fallbacks

**4. Governance Attacks**

**Scenario:** Malicious governance proposal
**Defense:**
- Timelock on critical changes (48h)
- Multi-sig requirements
- Community review period
- Rate limits on fee changes (max 10%)

### What We DON'T Protect Against

**Market Risk:**
- Price volatility
- Impermanent loss
- Liquidation from price movements

→ Use automation strategies to mitigate

**User Error:**
- Misconfigured strategies
- Approving malicious addresses
- Ignoring warnings

→ Clear UX, warnings, and documentation

**Force Majeure:**
- Ethereum network failure
- Regulatory action
- Black swan events

→ Diversify, understand risks, start small

## Audits

See [Security Audits](../chapter-6-contracts/audits.md) for details.

**Status:** Audits in progress

**Firms:** [TBD]

**Scope:** Full protocol (core, connectors, strategies, libraries)

**Bug Bounty:** [Immunefi/Code4rena] - Up to $XXX,XXX rewards

## Best Practices for Users

### Before You Start

**1. Understand the Risks**
- Read documentation thoroughly
- Understand impermanent loss
- Understand liquidation risk
- Start with small amounts

**2. Verify Contracts**
- Check contract addresses
- Verify on Etherscan
- Use official links only
- Be aware of phishing

**3. Test First**
- Use testnet if available
- Start with minimum amounts
- Verify strategy behavior
- Monitor for a few days before scaling

### When Using Hedgehog

**1. Security Checklist**
- ✅ Create proxy from official factory
- ✅ Verify proxy address
- ✅ Approve only official bot addresses
- ✅ Enable only strategies you understand
- ✅ Configure appropriate risk parameters

**2. Ongoing Monitoring**
- Check positions daily (or enable alerts)
- Monitor health factor if borrowing
- Review automation executions
- Watch for unusual activity

**3. Emergency Procedures**
- Know how to disable automation
- Know how to manually close positions
- Know how to use emergency exit
- Have contact for support

### Red Flags

**Stop immediately if:**
- ❌ Someone asks for your private key
- ❌ You're directed to unofficial contract addresses
- ❌ Frontend shows unexpected transactions
- ❌ Positions show unusual behavior
- ❌ Health factor critical with no auto-repay
- ❌ Bots behaving erratically

**Actions:**
1. Revoke bot approval
2. Close positions manually
3. Report issue to team
4. Use emergency exit if needed

## Incident Response

### If You Suspect a Security Issue

**1. For Users:**
```
Critical issue (funds at risk):
1. Disable automation: proxy.setApproved(address(0))
2. Emergency exit: proxy.emergencyExitAllPositions()
3. Report immediately: security@hedgehogprotocol.com

Non-critical issue:
1. Report via Discord/GitHub
2. Provide details
3. Wait for response
```

**2. For Security Researchers:**
```
Found a vulnerability:
1. DO NOT exploit it
2. DO NOT disclose publicly
3. Report via bug bounty program
4. Responsible disclosure: 90 days
5. Coordinate with team for fix
```

### Hedgehog Response Plan

**Severity Levels:**

**Critical (Funds at Risk):**
- Response: <1 hour
- Emergency pause if needed
- Public disclosure after patch
- Post-mortem published

**High (Potential Risk):**
- Response: <24 hours
- Investigate and patch
- Notify affected users
- Update documentation

**Medium/Low:**
- Response: <1 week
- Prioritize in development
- Include in next release
- Update docs if needed

## Security Roadmap

### Current (V1)

- ✅ Multi-layered access control
- ✅ Protocol whitelisting
- ✅ Connector isolation
- ✅ Open source code
- 🔄 Security audits (in progress)
- 🔄 Bug bounty program (launching)

### Near-term (V1.1)

- ⏳ Emergency pause mechanism
- ⏳ Timelock for governance actions
- ⏳ Multi-sig for critical functions
- ⏳ On-chain monitoring dashboards

### Future (V2+)

- 📋 Formal verification of critical paths
- 📋 Insurance integration
- 📋 Decentralized governance
- 📋 Advanced circuit breakers
- 📋 Cross-chain security

## Contact

**Security Issues:**
- Email: security@hedgehogprotocol.com
- Bug Bounty: [Program link]
- PGP Key: [Link]

**General Support:**
- Discord: [Link]
- Twitter: [Link]
- GitHub: [Link]

**Emergency:**
- Email: security@hedgehogprotocol.com (monitored 24/7)
- Discord: @security-team

---

**Remember:** Security is a shared responsibility. We build secure infrastructure, but users must understand risks, follow best practices, and never invest more than they can afford to lose.

[Back to Appendix](../README.md)
