"use client";

import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { VEIL_VAULT_ABI } from "@/lib/veilVaultAbi";
import { VAULT_ADDRESS } from "@/lib/wagmi";
import { formatUnits } from "viem";

export function VaultStats() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: totalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VEIL_VAULT_ABI,
    functionName: "totalAssets",
  });

  const { data: totalDeposited } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VEIL_VAULT_ABI,
    functionName: "totalDeposited",
  });

  const fmt = (v?: bigint) =>
    v !== undefined
      ? `$${parseFloat(formatUnits(v, 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "—";

  const yieldEarned =
    totalAssets !== undefined && totalDeposited !== undefined && totalAssets > totalDeposited
      ? totalAssets - totalDeposited
      : BigInt(0);

  const hasYield = yieldEarned > BigInt(0);

  if (!mounted) return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {/* Total Assets */}
      <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-900 border border-gray-800">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Total in Aave</span>
        <span className="text-xl font-bold text-white font-mono">{fmt(totalAssets)}</span>
        <span className="text-xs text-gray-600">Earning yield</span>
      </div>

      {/* Total Deposited */}
      <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-900 border border-gray-800">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Deposited</span>
        <span className="text-xl font-bold text-white font-mono">{fmt(totalDeposited)}</span>
        <span className="text-xs text-gray-600">Principal</span>
      </div>

      {/* Yield Earned */}
      <div className={`flex flex-col gap-2 p-4 rounded-xl border transition-colors ${
        hasYield
          ? "bg-green-950/30 border-green-900/60"
          : "bg-gray-900 border-gray-800"
      }`}>
        <span className="text-xs text-gray-500 uppercase tracking-wider">Yield Earned</span>
        <span className={`text-xl font-bold font-mono ${hasYield ? "text-green-400" : "text-white"}`}>
          {hasYield ? fmt(yieldEarned) : "$0.00"}
        </span>
        <span className="text-xs text-gray-600">
          {hasYield ? "↑ Accruing" : "Accruing..."}
        </span>
      </div>
    </div>
  );
}
