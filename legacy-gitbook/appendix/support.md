# Support

## Getting Help

Need help with Hedgehog Protocol? We're here for you.

## Quick Links

### 📚 Documentation
- [How Hedgehog Works](../chapter-2-how-it-works/README.md)
- [Creating Your Proxy](../chapter-2-how-it-works/creating-a-proxy.md)
- [Automation Guide](../chapter-3-automation/README.md)
- [FAQ](faq.md)

### 💬 Community
- [Discord](#) - Live chat with community and team
- [Twitter](#) - Updates and announcements
- [GitHub](#) - Technical issues and features

### 🚨 Emergency
- Security issues: security@hedgehogprotocol.com
- [Emergency Exit Guide](../chapter-2-how-it-works/emergency-exit.md)

## Support Channels

### Discord (Fastest Response)

**Join our Discord for real-time help:** [Discord Invite](#)

**Support channels:**
- `#support` - General questions
- `#technical-support` - Technical issues
- `#strategy-help` - Strategy configuration
- `#bug-reports` - Report bugs

**Response time:**
- Community: Usually < 30 minutes
- Team: Usually < 2 hours during business hours

**Before asking:**
1. Check [FAQ](faq.md)
2. Search previous messages
3. Provide detailed information (see below)

### GitHub Issues

**For technical bugs and feature requests:** [GitHub Issues](#)

**When to use:**
- Bug reports
- Feature requests
- Documentation improvements
- Technical discussions

**Response time:** 1-3 business days

**How to report:**
1. Search existing issues
2. Use issue template
3. Provide reproduction steps
4. Include relevant code/screenshots

### Email Support

**General support:** support@hedgehogprotocol.com

**Response time:** 1-2 business days

**When to use:**
- Private matters
- Account issues
- Partnership inquiries

### Security Issues

**Security concerns:** security@hedgehogprotocol.com

**Response time:** <24 hours

**Use for:**
- Suspected vulnerabilities
- Security questions
- Suspicious activity on your account

**Do NOT use for:**
- General support (use Discord)
- Feature requests (use GitHub)

## Common Issues

### Proxy Creation

**Issue:** "Transaction failed" when creating proxy

**Solutions:**
1. Check you don't already have a proxy
   ```javascript
   const existingProxy = await factory.getProxy(yourAddress);
   console.log(existingProxy);
   // If not 0x0000..., you already have one
   ```

2. Check gas limit
   ```javascript
   // Increase gas limit
   await factory.createProxy({ gasLimit: 500000 });
   ```

3. Check network (must be on correct chain)

See: [Creating Your Proxy](../chapter-2-how-it-works/creating-a-proxy.md)

### Token Approvals

**Issue:** "Insufficient allowance" error

**Solution:**
```javascript
// Approve proxy for token
await token.approve(proxyAddress, ethers.constants.MaxUint256);

// Verify approval
const allowance = await token.allowance(yourAddress, proxyAddress);
console.log(`Allowance: ${allowance.toString()}`);
```

**Issue:** "Approval failed"

**Solutions:**
1. Some tokens (USDT) require 0 approval first:
   ```javascript
   await usdt.approve(proxyAddress, 0);
   await usdt.approve(proxyAddress, ethers.constants.MaxUint256);
   ```

2. Check token balance
3. Check you're calling from correct address

### Position Creation

**Issue:** "Position creation failed"

**Solutions:**
1. Verify token approvals (see above)
2. Check token balance
3. Check Aave/Uniswap protocol status
4. Try again with higher gas limit
5. Check error message for specifics

**Issue:** "Health factor too low" when borrowing

**Solution:**
- Reduce borrow amount
- Add more collateral
- Check Aave liquidation threshold for your assets

See: [Health Factor](../chapter-3-automation/health-factor.md)

### Automation

**Issue:** Strategies not executing

**Solutions:**
1. Verify strategy enabled:
   ```javascript
   const enabled = await proxy.strategyEnabled(positionId, strategyAddress);
   console.log(`Enabled: ${enabled}`);
   ```

2. Verify bot approved:
   ```javascript
   const approved = await proxy.approved();
   console.log(`Approved bot: ${approved}`);
   ```

3. Check strategy conditions:
   ```javascript
   const canExecute = await strategy.canExecuteStrategy(positionId);
   console.log(`Can execute: ${canExecute}`);
   ```

4. Verify bot is whitelisted in HHDirectory

**Issue:** Bot executed but position looks wrong

**Solution:**
1. Check transaction on Etherscan
2. Look for events emitted
3. Verify strategy configuration
4. Report if unexpected behavior

See: [Automation Overview](../chapter-3-automation/README.md)

### Emergency Issues

**Issue:** Health factor dropping fast

**Actions:**
1. **Immediate:** Manually repay debt
   ```javascript
   await proxy.multicall([
       aaveConnector.repay(borrowPositionId, repayAmount)
   ]);
   ```

2. **Or:** Add more collateral
   ```javascript
   await proxy.multicall([
       aaveConnector.supply(USDC, additionalAmount, supplyPositionId)
   ]);
   ```

3. **Last resort:** Emergency exit
   ```javascript
   await proxy.emergencyExitAllPositions();
   ```

See: [Emergency Exit](../chapter-2-how-it-works/emergency-exit.md)

**Issue:** Suspicious activity on account

**Actions:**
1. Revoke bot access immediately:
   ```javascript
   await proxy.setApproved(ethers.constants.AddressZero);
   ```

2. Disable all strategies:
   ```javascript
   const positions = await proxy.getActivePositions();
   for (const posId of positions) {
       await proxy.setStrategyEnabled(posId, strategy, false);
   }
   ```

3. Close positions and withdraw funds
4. Report to security@hedgehogprotocol.com

## Troubleshooting Guide

### Checklist Before Asking for Help

**Gather this information:**
- [ ] What were you trying to do?
- [ ] What happened instead?
- [ ] Error message (exact text or screenshot)
- [ ] Transaction hash (if applicable)
- [ ] Your proxy address
- [ ] Network (mainnet, Arbitrum, etc.)
- [ ] What you've tried already

**Example good support request:**
```
Issue: Auto-rebalance not executing for my position

Details:
- Proxy: 0x1234...
- Position ID: 0xabcd...
- Network: Ethereum mainnet
- Strategy: AutoRebalanceStrategy (0x5678...)
- Current price: $2,150 (outside range $1,900-$2,100)
- canExecuteStrategy() returns: true
- strategyEnabled: true
- Bot approved: 0x9abc...
- Last successful execution: 2 days ago

What I've tried:
- Verified strategy enabled
- Checked bot approval
- Confirmed price is out of range
- Waited 24 hours

Transaction hash: 0xdef... (shows strategy should execute)
```

### Debug Commands

**Check proxy status:**
```javascript
// Get proxy address
const proxy = await factory.getProxy(userAddress);

// Get owner
const owner = await proxy.owner();

// Get approved bot
const approved = await proxy.approved();

// Get all positions
const positions = await proxy.getActivePositions();

console.log(`Proxy: ${proxy}`);
console.log(`Owner: ${owner}`);
console.log(`Approved: ${approved}`);
console.log(`Positions: ${positions.length}`);
```

**Check position details:**
```javascript
const position = await proxy.getPosition(positionId);

console.log(`Type: ${position.positionType}`);
console.log(`Protocol: ${position.protocol}`);
console.log(`Parent: ${position.parentId}`);
console.log(`Active: ${position.active}`);
```

**Check strategy status:**
```javascript
const enabled = await proxy.strategyEnabled(positionId, strategyAddress);
const canExecute = await strategy.canExecuteStrategy(positionId);
const config = await strategy.getConfig(positionId);

console.log(`Enabled: ${enabled}`);
console.log(`Can execute: ${canExecute}`);
console.log(`Config: ${config}`);
```

**Check health factor:**
```javascript
const accountData = await aavePool.getUserAccountData(proxyAddress);
const healthFactor = ethers.utils.formatEther(accountData.healthFactor);

console.log(`Health Factor: ${healthFactor}`);
console.log(`Total collateral: ${ethers.utils.formatUnits(accountData.totalCollateralBase, 8)}`);
console.log(`Total debt: ${ethers.utils.formatUnits(accountData.totalDebtBase, 8)}`);
```

## Video Tutorials

*Coming soon*

**Planned topics:**
- Creating your first proxy
- Setting up a delta-neutral position
- Configuring automation strategies
- Emergency procedures
- Advanced strategies

## Developer Support

### SDK Documentation

*Coming soon*

**Resources:**
- SDK reference
- Integration examples
- API documentation
- Testing guide

### Developer Discord

**Join:** [Discord](#) → `#developers`

**Topics:**
- SDK questions
- Integration help
- Smart contract questions
- Bot development

### Grant Program

**Building something cool?** Apply for a grant!

See: [Developer Grants](community.md#developer-grants)

## Contact Information

### General Support
- **Discord:** [Link](#) (Fastest)
- **Email:** support@hedgehogprotocol.com
- **GitHub:** [Link](#)

### Business Inquiries
- **Partnerships:** partnerships@hedgehogprotocol.com
- **Press:** press@hedgehogprotocol.com

### Security
- **Email:** security@hedgehogprotocol.com
- **PGP Key:** [Link](#)
- **Bug Bounty:** [Link](#)

### Community
- **Twitter:** [@HedgehogProtocol](#)
- **Discord:** [Link](#)
- **Medium:** [@HedgehogProtocol](#)

## Office Hours

**Team availability:**
- **Discord:** 24/7 (community), 9am-5pm UTC (team)
- **Email:** 1-2 business days
- **GitHub:** 1-3 business days

**Community calls:**
- **Weekly:** Thursdays 3pm UTC
- **Developer:** First Monday 4pm UTC
- **AMA:** Quarterly

See: [Community Events](community.md#community-events)

## Feedback

**We love feedback!** Tell us:
- What's working well
- What's confusing
- What features you want
- How we can improve

**Submit feedback:**
- Discord: `#feedback`
- GitHub: Feature requests
- Email: feedback@hedgehogprotocol.com
- Community calls: Open mic

---

**Remember:** The community is here to help. Don't hesitate to ask questions!

[Back to Appendix](../README.md)

[Back to Documentation](../README.md)
