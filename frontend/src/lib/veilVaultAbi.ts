// VeilVault ABI — generated from Foundry out/VeilVault.sol/VeilVault.json
export const VEIL_VAULT_ABI = [
  // Read
  {
    name: "totalAssets",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "totalDeposited",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "redeemRequester",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "burnHandle", type: "bytes32" }],
    outputs: [{ type: "address" }],
  },
  // Write
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "requestRedeem",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "encShares", type: "bytes32" },    // externalEuint256 handle
      { name: "inputProof", type: "bytes" },
      { name: "receiver", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "finalizeRedeem",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "burnHandle", type: "bytes32" },
      { name: "decryptedAmountAndProof", type: "bytes" },
    ],
    outputs: [],
  },
  // Selective disclosure
  {
    name: "grantAuditorAccess",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "auditor", type: "address" }],
    outputs: [],
  },
  {
    name: "encryptedBalanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "holder", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  // Events
  {
    name: "AuditorAccessGranted",
    type: "event",
    inputs: [
      { name: "user",    type: "address", indexed: true },
      { name: "auditor", type: "address", indexed: true },
    ],
  },
  {
    name: "Deposited",
    type: "event",
    inputs: [
      { name: "depositor", type: "address", indexed: true },
      { name: "assets", type: "uint256", indexed: false },
    ],
  },
  {
    name: "RedeemRequested",
    type: "event",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "burnHandle", type: "bytes32", indexed: false },
    ],
  },
  {
    name: "RedeemFinalized",
    type: "event",
    inputs: [
      { name: "receiver", type: "address", indexed: true },
      { name: "assets", type: "uint256", indexed: false },
    ],
  },
] as const;

// USDC ERC-20 ABI
export const USDC_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;
