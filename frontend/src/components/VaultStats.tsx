"use client";

import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { VEIL_VAULT_ABI } from "@/lib/veilVaultAbi";
import { VAULT_ADDRESS } from "@/lib/wagmi";
import { formatUnits } from "viem";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-gray-900 border border-gray-800">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-2xl font-bold text-white font-mono">{value}</span>
    </div>
  );
}

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
    v !== undefined ? `$${parseFloat(formatUnits(v, 6)).toLocaleString()}` : "—";

  const yieldEarned =
    totalAssets !== undefined && totalDeposited !== undefined && totalAssets > totalDeposited
      ? totalAssets - totalDeposited
      : undefined;

  if (!mounted) return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-900 border border-gray-800 animate-pulse" />)}
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      <Stat label="Total Assets in Aave" value={fmt(totalAssets)} />
      <Stat label="Total Deposited"       value={fmt(totalDeposited)} />
      <Stat label="Yield Earned"          value={fmt(yieldEarned)} />
    </div>
  );
}
