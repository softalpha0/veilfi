"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWalletClient } from "wagmi";
import { parseGwei, isAddress } from "viem";
import { VEIL_VAULT_ABI } from "@/lib/veilVaultAbi";
import { VAULT_ADDRESS } from "@/lib/wagmi";

const GAS = {
  maxFeePerGas:         parseGwei("0.1"),
  maxPriorityFeePerGas: parseGwei("0.001"),
} as const;

type Step = "idle" | "granting" | "done" | "error";

export function DisclosureForm() {
  const { address, isConnected } = useAccount();
  const { data: walletClient }   = useWalletClient();
  const { writeContractAsync }   = useWriteContract();

  const [mounted, setMounted]       = useState(false);
  const [auditor, setAuditor]       = useState("");
  const [step, setStep]             = useState<Step>("idle");
  const [txHash, setTxHash]         = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const validAuditor = auditor.trim() !== "" && isAddress(auditor.trim());

  const handleGrant = async () => {
    if (!address || !walletClient || !validAuditor) return;
    setError(null);
    setStep("granting");

    try {
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VEIL_VAULT_ABI,
        functionName: "grantAuditorAccess",
        args: [auditor.trim() as `0x${string}`],
        ...GAS,
      });
      setTxHash(hash);
      setStep("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      // Surface a clean error for "no shares held"
      if (msg.includes("NoSharesHeld") || msg.includes("no shares")) {
        setError("You have no vault shares to disclose. Deposit first.");
      } else {
        setError(msg);
      }
      setStep("error");
    }
  };

  const reset = () => {
    setStep("idle");
    setAuditor("");
    setTxHash(null);
    setError(null);
  };

  if (!mounted) return (
    <div className="w-full p-6 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse h-40" />
  );

  return (
    <div className="w-full p-6 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col gap-5">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Selective Disclosure</h2>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-900/50 text-blue-300 border border-blue-800">
            Auditor Access
          </span>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Grant a specific wallet — a regulator, auditor, or trusted party — the ability
          to read your encrypted vault balance. Your position remains hidden from everyone else.
        </p>
      </div>

      {/* How it works */}
      <div className="flex flex-col gap-2 p-4 rounded-xl bg-gray-800/60 border border-gray-700 text-xs text-gray-400">
        <div className="flex gap-3">
          <span className="text-gray-600 w-4 flex-shrink-0">1.</span>
          <span>You enter the auditor&apos;s wallet address and confirm the transaction</span>
        </div>
        <div className="flex gap-3">
          <span className="text-gray-600 w-4 flex-shrink-0">2.</span>
          <span>The contract calls <code className="text-violet-400">Nox.allow(yourBalance, auditor)</code> — granting them read access to your encrypted balance handle</span>
        </div>
        <div className="flex gap-3">
          <span className="text-gray-600 w-4 flex-shrink-0">3.</span>
          <span>The auditor uses the Nox SDK to decrypt the handle and verify your balance. Nobody else can read it.</span>
        </div>
      </div>

      {/* Form */}
      {step === "done" ? (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-800 flex flex-col gap-2">
            <p className="text-sm font-semibold text-blue-200">Access granted</p>
            <p className="text-xs text-blue-300/70">
              <span className="font-mono break-all">{auditor}</span>
              {" "}can now decrypt and verify your vault balance using the Nox SDK.
              Your position remains hidden from all other parties.
            </p>
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
          <button onClick={reset} className="text-sm text-gray-400 hover:text-white transition text-left">
            Grant access to another address →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Auditor wallet address</label>
            <input
              type="text"
              placeholder="0x..."
              value={auditor}
              onChange={(e) => setAuditor(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white
                         placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm font-mono"
              disabled={step === "granting"}
            />
            {auditor && !validAuditor && (
              <p className="text-xs text-red-400">Enter a valid Ethereum address</p>
            )}
          </div>

          <button
            onClick={handleGrant}
            disabled={!isConnected || !validAuditor || step === "granting"}
            className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-600
                       disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition text-sm"
          >
            {step === "granting" ? "Granting access…" : "Grant Auditor Access"}
          </button>

          {step === "error" && error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl p-3 break-words">
              {error}
            </p>
          )}

          {!isConnected && (
            <p className="text-sm text-yellow-500">Connect your wallet to use selective disclosure.</p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-700 border-t border-gray-800 pt-3">
        This calls <code>grantAuditorAccess(address)</code> on the VeilVault contract,
        which uses <code>Nox.allow(balance, auditor)</code> to grant cryptographic read access
        to your encrypted ERC-7984 balance handle.
      </p>
    </div>
  );
}
