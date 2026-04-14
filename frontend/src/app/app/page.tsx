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
      <div className="flex flex-col items-end">
        <span className="text-xs text-gray-500">Wallet USDC</span>
        <span className="text-white font-mono font-semibold text-sm">
          {usdcBal !== undefined
            ? `$${parseFloat(formatUnits(usdcBal, 6)).toFixed(2)}`
            : "—"}
        </span>
      </div>
      <div className="w-px h-8 bg-gray-700" />
      <div className="flex flex-col items-end">
        <span className="text-xs text-gray-500">Vault Shares</span>
        <span className="text-violet-300 font-semibold text-sm flex items-center gap-1">
          <span>🔒</span> Encrypted
        </span>
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
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col">

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/90 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors text-sm"
            >
              <span>←</span>
              <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="w-px h-5 bg-gray-800" />
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-900/40">
                V
              </div>
              <span className="font-bold text-lg tracking-tight">VeilFi</span>
            </Link>
            <span className="hidden sm:inline text-xs text-gray-500 border border-gray-800 rounded-lg px-2 py-1">
              Arbitrum Sepolia
            </span>
          </div>
          <div className="flex items-center gap-3">
            {mounted && isConnected && <UserBalance />}
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-10 flex flex-col gap-8">

        {/* Page header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Vault</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-800/60">
              Live
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Deposit USDC → earn Aave V3 yield → position encrypted by{" "}
            <span className="text-violet-400">iExec Nox TEE</span>.
          </p>
        </div>

        {/* Vault Stats */}
        <VaultStats />

        {/* Protocol badges */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Privacy", value: "Nox TEE", icon: "🔒" },
            { label: "Yield", value: "Aave V3", icon: "📈" },
            { label: "Token", value: "ERC-7984", icon: "🪙" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-center">
              <span className="text-lg">{icon}</span>
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-xs font-semibold text-white">{value}</span>
            </div>
          ))}
        </div>

        {/* Tab switcher + forms */}
        <div className="flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-gray-900 border border-gray-800 w-fit">
            {(["deposit", "redeem"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  tab === t
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t === "deposit" ? "⬇ Deposit" : "⬆ Redeem"}
              </button>
            ))}
          </div>

          {tab === "deposit" ? <DepositForm /> : <RedeemForm />}
        </div>

        {/* Privacy notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-950/30 border border-violet-900/40">
          <span className="text-violet-400 text-lg flex-shrink-0">🔐</span>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-violet-200">Your position is private</span>
            <p className="text-xs text-violet-300/60 leading-relaxed">
              {tab === "deposit"
                ? "Share amounts are encrypted by the Nox SDK before reaching the chain. No one can determine how much you deposited or what your balance is."
                : "Redemption amounts are encrypted client-side and decrypted inside an Intel SGX enclave. The plaintext never appears on-chain."}
            </p>
          </div>
        </div>

        {/* Contracts */}
        <div className="p-5 rounded-2xl border border-gray-800 bg-gray-900/30 flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deployed Contracts</h2>
          <div className="flex flex-col gap-3">
            {[
              ["VeilVault", VAULT_ADDRESS],
              ["WrappedConfidentialUSDC", "0x9cbc4779f608f4AA8c6871D25C28297B0783547c"],
            ].map(([label, addr]) => (
              <div key={addr} className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">{label}</span>
                <a
                  href={`https://sepolia.arbiscan.io/address/${addr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-violet-400 hover:text-violet-300 transition-colors text-xs break-all"
                >
                  {addr} ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <span className="text-xs text-gray-700">
            VeilFi · Nox TEE × ERC-7984 × Aave V3
          </span>
          <a
            href="https://github.com/softalpha0/veilfi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-700 hover:text-gray-500 transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
