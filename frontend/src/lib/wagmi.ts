import { createConfig, http } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  connectors: [injected(), metaMask()],
  transports: {
    [arbitrumSepolia.id]: http("https://arb-sepolia.g.alchemy.com/v2/Qk1oxxpIX5dRJm0dsYtsZ"),
  },
});

// Deployed on Arbitrum Sepolia
export const VAULT_ADDRESS: `0x${string}` =
  (process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`) ??
  "0x4e2097d3Ad9C6530728Cf74bf0838D4A2043D743";

export const WRAPPED_USDC_ADDRESS: `0x${string}` =
  (process.env.NEXT_PUBLIC_WRAPPED_USDC_ADDRESS as `0x${string}`) ??
  "0x9cbc4779f608f4AA8c6871D25C28297B0783547c";

export const USDC_ADDRESS: `0x${string}` =
  "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";
