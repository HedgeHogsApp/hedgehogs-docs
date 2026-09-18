# Security Audits

## Audit Status

*Hedgehog Protocol is currently under development. Audits will be conducted before mainnet launch.*

## Planned Audits

### Audit Scope

The following contracts will be audited:

**Core Contracts:**
- HH (Proxy)
- HHFactory
- HHStorage / HHStorageLib
- HHDirectory
- ProtocolDirectory
- HHOwnable

**Connectors:**
- AaveV3Connector
- UniswapV3Connector

**Strategies:**
- AutoRebalanceStrategy
- AutoCompoundStrategy
- AutoRepayStrategy
- AutoCollateralizeStrategy
- AutoHarvestStrategy

**Libraries:**
- TransferLib
- FeesLib
- EmergencyExitLib
- NftZapLib
- AaveV3HealthFactor

**Total:** ~3,000-4,000 lines of Solidity code

### Audit Firms

Hedgehog plans to engage multiple audit firms:

1. **Primary Audit:** [TBD]
   - Comprehensive security review
   - Gas optimization analysis
   - Economic model review

2. **Secondary Audit:** [TBD]
   - Focus on critical paths
   - Automated tool analysis
   - Formal verification (where applicable)

3. **Ongoing Audits:**
   - New connectors/strategies audited before deployment
   - Code changes reviewed by auditors
   - Community bug bounty program

## Bug Bounty Program

### Program Details

**Platform:** Immunefi / Code4rena (TBD)

**Rewards:**
- Critical: Up to $XXX,XXX
- High: Up to $XX,XXX
- Medium: Up to $X,XXX
- Low: Up to $XXX

**Scope:**
- All deployed smart contracts
- Critical vulnerabilities leading to loss of funds
- Access control bypasses
- Economic exploits

**Out of Scope:**
- Known issues (documented)
- Gas optimization
- UI/Frontend issues
- Already reported issues

### How to Report

1. **Submit via Platform:** [Immunefi/Code4rena link]
2. **Include:**
   - Detailed description
   - Proof of concept
   - Impact assessment
   - Suggested fix (optional)

3. **Response Time:**
   - Critical: 24 hours
   - High: 48 hours
   - Medium/Low: 1 week

## Security Best Practices

### Development Process

**Code Reviews:**
- All PRs reviewed by 2+ engineers
- Security-focused review checklist
- No merge without approval

**Testing:**
- 100% line coverage target
- Fork tests against real protocols
- Invariant testing
- Fuzz testing

**Continuous Monitoring:**
- On-chain monitoring for anomalies
- Automated alerts for suspicious activity
- Regular security assessments

### Deployment Process

**Testnet Deployment:**
1. Deploy to Goerli/Sepolia
2. Run full test suite on testnet
3. Public testnet period (2-4 weeks)
4. Collect feedback and fix issues

**Mainnet Deployment:**
1. Final audit review
2. Timelock deployment (48h)
3. Limited initial launch (whitelisted users)
4. Gradual rollout to public
5. Ongoing monitoring

## Known Limitations

### Design Trade-offs

**1. Delegatecall Risks**
- **Risk:** Malicious connector could drain proxy
- **Mitigation:**
  - Only whitelisted connectors
  - Connectors audited before whitelisting
  - No user-supplied delegatecall targets

**2. Approval Model**
- **Risk:** User approves proxy with unlimited amount
- **Mitigation:**
  - User maintains full ownership
  - Can revoke approval anytime
  - Approved bot cannot withdraw funds
  - Transparent contract code

**3. Price Oracle Dependency**
- **Risk:** Strategies depend on price feeds
- **Mitigation:**
  - Use battle-tested oracles (Chainlink, Uniswap TWAP)
  - Sanity checks on price data
  - Slippage protection on all swaps

**4. Cross-Protocol Dependencies**
- **Risk:** Aave or Uniswap bugs affect Hedgehog users
- **Mitigation:**
  - Connector isolation (one protocol bug doesn't affect others)
  - Emergency exit function
  - User retains custody at all times

### Future Security Enhancements

1. **Formal Verification**
   - Prove critical invariants mathematically
   - Focus on access control and fund flow

2. **Circuit Breakers**
   - Automatic pause on anomalous activity
   - Manual pause by governance

3. **Multi-sig Operations**
   - Critical functions require multi-sig
   - Timelock for directory changes

4. **Insurance Integration**
   - Explore protocol insurance options
   - Coverage for smart contract risks

## Audit History

*This section will be updated after audits are completed.*

### Audit 1: [Firm Name] - [Date]

**Scope:** Core contracts, connectors

**Findings:**
- Critical: X
- High: Y
- Medium: Z
- Low: A

**Status:** All findings resolved

**Report:** [Link to full report]

### Audit 2: [Firm Name] - [Date]

**Scope:** Strategies, libraries

**Findings:**
- Critical: X
- High: Y
- Medium: Z
- Low: A

**Status:** All findings resolved

**Report:** [Link to full report]

## Community Security

### How to Contribute

**Security Researchers:**
- Review open-source code
- Submit bugs via bug bounty
- Participate in Code4rena contests

**Developers:**
- Follow security best practices
- Review PRs
- Contribute tests

**Users:**
- Report suspicious activity
- Start small, test thoroughly
- Understand the risks

### Resources

**Documentation:**
- [Architecture Overview](../chapter-5-architecture/README.md)
- [Smart Contracts](README.md)
- [Security Model](../appendix/security.md)

**Code:**
- [GitHub Repository](#)
- [Deployed Contracts](#)
- [Audit Reports](#)

**Contact:**
- Security Email: security@hedgehogprotocol.com
- Discord: [Link]
- Twitter: [Link]

## Disclaimer

**Use at your own risk.**

Hedgehog Protocol is experimental software. While we take security seriously and follow best practices, DeFi protocols carry inherent risks including:
- Smart contract bugs
- Economic exploits
- Protocol dependencies
- Market risks

Always start with small amounts, understand the risks, and never invest more than you can afford to lose.

---

[Back to Smart Contracts](README.md)

[Back to Documentation](../README.md)
