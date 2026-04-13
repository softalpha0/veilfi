"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ConnectWallet } from "@/components/ConnectWallet";
import { DepositForm } from "@/components/DepositForm";
import { RedeemForm } from "@/components/RedeemForm";
import { VaultStats } from "@/components/VaultStats";
import { USDC_ABI } from "@/lib/veilVaultAbi";
import { USDC_ADDRESS, VAULT_ADDRESS } from "@/lib/wagmi";

type Tab = "deposit" | "redeem";

function UserBalance() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: usdcBal } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  if (!mounted || !address) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm">
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">Wallet USDC</span>
        <span className="text-white font-mono font-semibold">
          {usdcBal !== undefined ? `${parseFloat(formatUnits(usdcBal, 6)).toFixed(2)}` : "—"}
        </span>
      </div>
      <div className="w-px h-8 bg-gray-700" />
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">Vault Shares</span>
        <span className="text-violet-300 font-mono font-semibold">🔒 Encrypted</span>
      </div>
    </div>
  );
}

export default function AppPage() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("deposit");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">

      {/* Nav */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">V</div>
            <span className="font-bold text-lg tracking-tight">VeilFi</span>
          </Link>
          <span className="text-xs text-gray-500 border border-gray-700 rounded px-2 py-0.5">
            Arbitrum Sepolia
          </span>
        </div>
        <div className="flex items-center gap-3">
          {mounted && isConnected && <UserBalance />}
          <ConnectWallet />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-8">

        {/* Page title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Vault</h1>
          <p className="text-sm text-gray-400">
            Deposit USDC to earn Aave yield with encrypted positions via{" "}
            <span className="text-violet-400">iExec Nox TEE</span>.
          </p>
        </div>

        {/* Vault Stats */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vault Stats</h2>
          <VaultStats />
        </section>

        {/* Protocol info strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Protocol", value: "iExec Nox TEE" },
            { label: "Yield Source", value: "Aave V3" },
            { label: "Share Token", value: "ERC-7984" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1 p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-sm font-semibold text-white">{value}</span>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <section className="flex flex-col gap-4">
          <div className="flex gap-1 p-1 rounded-xl bg-gray-900 border border-gray-800 w-fit">
            {(["deposit", "redeem"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                  tab === t
                    ? "bg-violet-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "deposit" ? <DepositForm /> : <RedeemForm />}

          <p className="text-xs text-gray-600">
            {tab === "deposit"
              ? "USDC is supplied to Aave instantly. Encrypted vault shares are minted to your address — your balance is only visible to you."
              : "Share amounts are encrypted by the Nox SDK before being sent on-chain. The TEE decrypts off-chain and returns your USDC + yield."}
          </p>
        </section>

        {/* How it works */}
        <section className="p-6 rounded-2xl border border-gray-800 bg-gray-900/40 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-200 text-sm uppercase tracking-wider">How it works</h2>
          <ol className="flex flex-col gap-3 text-sm text-gray-400">
            {[
              ["Deposit", "Approve USDC → vault supplies to Aave V3 → encrypted ERC-7984 shares minted to you."],
              ["Earn", "Your USDC earns real Aave yield every block. Total vault assets grow over time."],
              ["Redeem", "Nox SDK encrypts your share count → on-chain request → TEE decrypts → you receive USDC + yield."],
            ].map(([t, d], i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-900 text-violet-300 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span><strong className="text-gray-300">{t}:</strong> {d}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Contract addresses */}
        <section className="p-5 rounded-2xl border border-gray-800 bg-gray-900/30 flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deployed Contracts</h2>
          {[
            ["VeilVault", VAULT_ADDRESS],
            ["WrappedConfidentialUSDC", "0x9cbc4779f608f4AA8c6871D25C28297B0783547c"],
          ].map(([label, addr]) => (
            <div key={addr} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs">
              <span className="text-gray-500 w-44 flex-shrink-0">{label}</span>
              <a
                href={`https://sepolia.arbiscan.io/address/${addr}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-violet-400 hover:text-violet-300 transition break-all"
              >
                {addr} ↗
              </a>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-700">
        VeilFi · Built for the iExec Vibe Coding Challenge · Nox TEE × ERC-7984 × Aave V3
      </footer>
    </div>
  );
}
