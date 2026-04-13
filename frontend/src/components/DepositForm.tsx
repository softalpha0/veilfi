"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { parseUnits, formatUnits, parseGwei } from "viem";

// Arbitrum Sepolia base fee is ~0.02 gwei — add a 5x buffer to avoid underpricing
const GAS = {
  maxFeePerGas:         parseGwei("0.1"),
  maxPriorityFeePerGas: parseGwei("0.001"),
} as const;
import { VEIL_VAULT_ABI, USDC_ABI } from "@/lib/veilVaultAbi";
import { VAULT_ADDRESS, USDC_ADDRESS } from "@/lib/wagmi";

type Step = "idle" | "approving" | "depositing" | "done" | "error";

export function DepositForm() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("idle");

  useEffect(() => { setMounted(true); }, []);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
  });

  const handleDeposit = async () => {
    if (!address || !amount) return;
    setError(null);
    const assets = parseUnits(amount, 6);

    try {
      // Step 1 — Approve USDC if needed
      if (!allowance || allowance < assets) {
        setStep("approving");
        await writeContractAsync({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: "approve",
          args: [VAULT_ADDRESS, assets],
          ...GAS,
        });
      }

      // Step 2 — Deposit into VeilVault
      // Vault pulls USDC → supplies to Aave → mints encrypted ERC-7984 shares
      setStep("depositing");
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VEIL_VAULT_ABI,
        functionName: "deposit",
        args: [assets, address],
        ...GAS,
      });

      setTxHash(hash);
      setStep("done");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStep("error");
    }
  };

  const reset = () => {
    setStep("idle");
    setAmount("");
    setTxHash(null);
    setError(null);
  };

  const statusMsg: Record<Step, string> = {
    idle:       "",
    approving:  "Approving USDC spend…",
    depositing: "Depositing to VeilVault → Aave…",
    done:       "Deposit complete! Encrypted vault shares minted to your address.",
    error:      "",
  };

  if (!mounted) return (
    <div className="w-full p-6 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse h-48" />
  );

  return (
    <div className="w-full p-6 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Deposit USDC</h2>
        {usdcBalance !== undefined && (
          <span className="text-xs text-gray-500">
            Balance: {parseFloat(formatUnits(usdcBalance, 6)).toFixed(2)} USDC
          </span>
        )}
      </div>

      <p className="text-sm text-gray-400">
        Your vault shares are encrypted on-chain via{" "}
        <span className="text-violet-400 font-medium">iExec Nox TEE</span> —
        nobody can see your position size.
      </p>

      {step === "done" ? (
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-green-900/30 border border-green-800 text-green-300 text-sm">
            {statusMsg.done}
          </div>
          {txHash && (
            <a
              href={`https://sepolia.arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:underline font-mono break-all"
            >
              View on Arbiscan →
            </a>
          )}
          <button onClick={reset} className="text-sm text-gray-400 hover:text-white transition">
            Make another deposit
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Amount (USDC)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white
                         placeholder-gray-600 focus:outline-none focus:border-violet-500"
              disabled={step !== "idle" && step !== "error"}
            />
            <button
              onClick={handleDeposit}
              disabled={!isConnected || !amount || (step !== "idle" && step !== "error")}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500
                         disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition"
            >
              {step === "idle" || step === "error" ? "Deposit" : "…"}
            </button>
          </div>

          {step !== "idle" && step !== "error" && (
            <p className="text-sm text-violet-300 animate-pulse">{statusMsg[step]}</p>
          )}

          {step === "error" && error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {!isConnected && (
            <p className="text-sm text-yellow-500">Connect your wallet to deposit.</p>
          )}
        </>
      )}
    </div>
  );
}
