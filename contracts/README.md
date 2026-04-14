# VeilFi Contracts

Solidity contracts for VeilFi, built with Foundry.

## Contracts

| Contract | Description |
|---|---|
| `VeilVault.sol` | Main vault — ERC-7984 confidential shares, ERC-7540 async redeem, Aave V3 yield |
| `WrappedConfidentialUSDC.sol` | Wraps ERC-20 USDC into a confidential ERC-7984 token |
| `interfaces/IAavePool.sol` | Minimal Aave V3 pool interface |

## Setup

Uses npm packages for iExec Nox dependencies (not forge install):

```bash
npm install
forge build
```

## Deploy

```bash
PRIVATE_KEY=0x... forge script script/Deploy.s.sol \
  --rpc-url https://sepolia-rollup.arbitrum.io/rpc \
  --broadcast
```

## Deployed (Arbitrum Sepolia)

- VeilVault: `0x4e2097d3Ad9C6530728Cf74bf0838D4A2043D743`
- WrappedConfidentialUSDC: `0x9cbc4779f608f4AA8c6871D25C28297B0783547c`
