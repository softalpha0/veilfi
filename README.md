# VeilFi — Confidential Yield Vault

> *Earn yield. Stay invisible.*

**VeilFi** is a confidential DeFi vault built on [iExec Nox TEE](https://docs.iex.ec/nox-protocol) that lets you earn real yield from Aave V3 while keeping your entire position — size, entry, and exit — completely hidden on-chain.
Nope

---

## The Story

DeFi is transparent by design. Every wallet balance, every deposit, every yield position is permanently public on-chain. Anyone can look up your address and know exactly how much you have, when you moved it, and where it went.

This isn't a theoretical risk. It creates real consequences:

- **Targeted attacks** — on-chain wealth is visible to everyone, including adversaries
- **Front-running** — bots watch large transactions before they confirm
- **Social exposure** — colleagues, competitors, or strangers can trace your financial history

Aave is one of the most battle-tested yield protocols in DeFi. But using it means broadcasting your financial life to the world.

**What if you could earn Aave's yield without anyone knowing you were there?**

That's VeilFi. Same yield. Zero visibility.

---

## How iExec Nox Makes This Possible

iExec Nox is a TEE (Trusted Execution Environment) protocol built on Intel SGX. It brings confidential compute directly to EVM chains — meaning you can run logic over encrypted data without ever revealing the plaintext, even to the node operators processing the transaction.

VeilFi uses two key primitives from the Nox protocol:

### 1. `ERC-7984` — Encrypted Token Balances

VeilFi vault shares are issued as `ERC-7984` confidential tokens. Instead of storing `uint256 balance` in plain text, each balance is stored as an `euint256` — an encrypted handle. On-chain, all anyone sees is a handle like `0x0000066eee...`. The actual share amount exists only inside the TEE.

This means:
- Nobody can see how many shares you hold
- Nobody can correlate your deposit size to your future redemption
- The vault contract itself never processes your plaintext balance

### 2. Nox TEE — Trustless Off-Chain Decryption

When you redeem shares, VeilFi uses a 3-step flow powered by the Nox runtime:

```
1. requestRedeem()
   └─ You encrypt your share amount in the browser using @iexec-nox/handle SDK
   └─ Vault burns your encrypted shares → emits a burn handle
   └─ Nox.allowPublicDecryption(burnHandle) marks it for TEE processing

2. TEE Decryption (off-chain, automatic)
   └─ Nox Runner (Intel SGX enclave) detects the decryption request
   └─ Decrypts the burn handle inside the secure enclave
   └─ Generates a cryptographic decryption proof — tamper-evident, on-chain verifiable

3. finalizeRedeem()
   └─ Frontend calls publicDecrypt(burnHandle) to retrieve the TEE proof
   └─ Vault calls Nox.publicDecrypt(burnHandle, proof) — verifies the proof on-chain
   └─ Withdraws the correct USDC + yield from Aave → sends directly to your wallet
```

At no point is the share amount visible on-chain. The TEE decrypts inside a secure enclave that even iExec operators cannot inspect. The on-chain proof verifies the decryption was correct without revealing the value.

### The Encryption Flow (Browser → Chain)

```
Browser                         Chain                        TEE (SGX Enclave)
  │                               │                               │
  │  encryptInput(shares,         │                               │
  │    "uint256", VAULT_ADDR)     │                               │
  │ ─────────────────────────►  handle + handleProof              │
  │                               │                               │
  │  requestRedeem(handle,        │                               │
  │    handleProof, receiver)     │                               │
  │ ──────────────────────────────►                               │
  │                               │  Nox.allowPublicDecryption()  │
  │                               │ ─────────────────────────────►│
  │                               │                               │  decrypt(burnHandle)
  │                               │                               │  → decryptionProof
  │                               │◄──────────────────────────────│
  │  publicDecrypt(burnHandle)    │                               │
  │◄──────────────────────────────│                               │
  │                               │                               │
  │  finalizeRedeem(handle,proof) │                               │
  │ ──────────────────────────────►                               │
  │                               │  Nox.publicDecrypt() verifies │
  │                               │  → withdraw Aave → USDC sent  │
```

---

## Architecture

```
veilfi/
├── contracts/              # Solidity — Foundry
│   ├── src/
│   │   ├── VeilVault.sol              # Main vault (ERC-7984 × ERC-7540 × Aave V3)
│   │   ├── WrappedConfidentialUSDC.sol # ERC-20 → ERC-7984 wrapper
│   │   └── interfaces/IAavePool.sol   # Minimal Aave V3 interface
│   └── script/Deploy.s.sol            # Deployment script
│
├── frontend/               # Next.js 15 (App Router)
│   └── src/
│       ├── app/
│       │   ├── page.tsx               # Landing page
│       │   └── app/page.tsx           # DApp (/app)
│       ├── components/
│       │   ├── DepositForm.tsx        # Approve + deposit flow
│       │   ├── RedeemForm.tsx         # 3-step redeem with TEE polling
│       │   ├── VaultStats.tsx         # Live TVL + yield stats
│       │   └── ConnectWallet.tsx      # Wagmi wallet button
│       └── lib/
│           ├── wagmi.ts               # Chain config + contract addresses
│           └── veilVaultAbi.ts        # Contract ABIs
│
└── backend/                # Rust — Axum
    └── src/
        ├── main.rs                    # Server entry point
        ├── contracts/mod.rs           # ethers-rs contract bindings
        └── routes/                    # REST API endpoints
            ├── deposit.rs
            ├── redeem.rs
            └── vault.rs
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Privacy | iExec Nox TEE (Intel SGX) |
| Confidential tokens | ERC-7984 (`euint256` encrypted balances) |
| Async vault standard | ERC-7540 |
| Yield source | Aave V3 on Arbitrum Sepolia |
| Contracts | Solidity 0.8.28, Foundry |
| Frontend | Next.js 15, Wagmi v2, Viem |
| Backend | Rust, Axum, ethers-rs |
| Network | Arbitrum Sepolia (chainId 421614) |

---

## Deployed Contracts (Arbitrum Sepolia)

| Contract | Address |
|---|---|
| VeilVault | [`0x4e2097d3Ad9C6530728Cf74bf0838D4A2043D743`](https://sepolia.arbiscan.io/address/0x4e2097d3Ad9C6530728Cf74bf0838D4A2043D743) |
| WrappedConfidentialUSDC | [`0x9cbc4779f608f4AA8c6871D25C28297B0783547c`](https://sepolia.arbiscan.io/address/0x9cbc4779f608f4AA8c6871D25C28297B0783547c) |
| USDC (testnet) | [`0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`](https://sepolia.arbiscan.io/address/0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d) |
| Aave V3 Pool | [`0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff`](https://sepolia.arbiscan.io/address/0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff) |

---

## How to Use (Testnet)

1. Add **Arbitrum Sepolia** to MetaMask (chainId: 421614)
2. Get test ETH from the [Arbitrum Sepolia faucet](https://faucet.triangleplatform.com/arbitrum/sepolia)
3. Get test USDC from [Aave's testnet faucet](https://app.aave.com/faucet/)
4. Go to `/app` → connect wallet → **Deposit** USDC
5. Your position appears as `🔒 Encrypted` — no one on-chain can read the amount
6. Switch to **Redeem** → enter shares → wait ~60s for Nox TEE → receive USDC + yield

---

## License

MIT
