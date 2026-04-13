"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWalletClient, usePublicClient } from "wagmi";
import { parseGwei } from "viem";
import { createViemHandleClient } from "@iexec-nox/handle";
import { VEIL_VAULT_ABI } from "@/lib/veilVaultAbi";
import { VAULT_ADDRESS } from "@/lib/wagmi";

const GAS = {
  maxFeePerGas:         parseGwei("0.1"),
  maxPriorityFeePerGas: parseGwei("0.001"),
} as const;

type Step =
  | "idle"
  | "encrypting"
  | "requesting"
  | "awaiting_tee"   // burn handle submitted, waiting for TEE
  | "finalizing"     // calling finalizeRedeem
  | "done"
  | "error";

export function RedeemForm() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [mounted, setMounted]       = useState(false);
  const [shares, setShares]         = useState("");
  const [step, setStep]             = useState<Step>("idle");
  const [burnHandle, setBurnHandle] = useState<`0x${string}` | null>(null);
  const [txHash, setTxHash]         = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // ── Step 1: encrypt + requestRedeem ────────────────────────────────────────
  const handleRequestRedeem = async () => {
    if (!address || !walletClient || !shares) return;
    setError(null);

    try {
      setStep("encrypting");
      const handleClient = await createViemHandleClient(walletClient);
      const { handle, handleProof } = await handleClient.encryptInput(
        BigInt(shares),
        "uint256",
        VAULT_ADDRESS,
      );

      setStep("requesting");
      await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VEIL_VAULT_ABI,
        functionName: "requestRedeem",
        args: [handle, handleProof, address],
        ...GAS,
      });

      setBurnHandle(handle as `0x${string}`);
      setStep("awaiting_tee");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStep("error");
    }
  };

  // ── Step 2: finalizeRedeem with TEE-decrypted proof ────────────────────────
  const handleFinalizeRedeem = async () => {
    if (!address || !walletClient || !burnHandle || !publicClient) return;
    setError(null);

    try {
      setStep("finalizing");
      const handleClient = await createViemHandleClient(walletClient);

      // Ask Nox TEE to decrypt the burn handle and give us the proof
      const { decryptionProof } = await handleClient.publicDecrypt(burnHandle);

      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VEIL_VAULT_ABI,
        functionName: "finalizeRedeem",
        args: [burnHandle, decryptionProof],
        ...GAS,
      });

      setTxHash(hash);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Finalize failed");
      setStep("error");
    }
  };

  const reset = () => {
    setStep("idle");
    setShares("");
    setBurnHandle(null);
    setTxHash(null);
    setError(null);
  };

  if (!mounted) return (
    <div className="w-full p-6 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse h-48" />
  );

  return (
    <div className="w-full p-6 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Redeem Shares</h2>
        <span className="text-xs px-2 py-1 rounded-full bg-violet-900/50 text-violet-300 border border-violet-800">
          USDC → your wallet
        </span>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { key: "request", label: "1. Encrypt & Request" },
          { key: "tee",     label: "2. TEE Decrypts" },
          { key: "receive", label: "3. Receive USDC" },
        ].map(({ key, label }, i) => {
          const active =
            (key === "request" && ["idle", "encrypting", "requesting", "error"].includes(step)) ||
            (key === "tee"     && step === "awaiting_tee") ||
            (key === "receive" && ["finalizing", "done"].includes(step));
          const done =
            (key === "request" && ["awaiting_tee", "finalizing", "done"].includes(step)) ||
            (key === "tee"     && ["finalizing", "done"].includes(step)) ||
            (key === "receive" && step === "done");

          return (
            <div key={key} className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full font-semibold transition ${
                done   ? "bg-green-800 text-green-300" :
                active ? "bg-violet-700 text-white" :
                         "bg-gray-800 text-gray-500"
              }`}>
                {label}
              </span>
              {i < 2 && <span className="text-gray-700">→</span>}
            </div>
          );
        })}
      </div>

      {/* ── Step: idle / encrypting / requesting / error ── */}
      {(step === "idle" || step === "encrypting" || step === "requesting" || step === "error") && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-400">
            Enter how many shares to redeem. The amount is{" "}
            <span className="text-violet-400 font-medium">encrypted by Nox TEE</span>{" "}
            — never visible on-chain. USDC + yield will be sent to{" "}
            <span className="text-white font-mono text-xs">
              {address ? `${address.slice(0,6)}…${address.slice(-4)}` : "your wallet"}
            </span>.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Shares to redeem (e.g. 10000000 = 10 USDC)"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white
                         placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm"
              disabled={step !== "idle" && step !== "error"}
            />
            <button
              onClick={handleRequestRedeem}
              disabled={!isConnected || !shares || (step !== "idle" && step !== "error")}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500
                         disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition"
            >
              {step === "encrypting" ? "Encrypting…" :
               step === "requesting" ? "Submitting…" : "Request"}
            </button>
          </div>
          <p className="text-xs text-gray-600">
            Shares use 6 decimals — 10 USDC = 10,000,000 shares.
          </p>
          {step === "error" && error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl p-3">{error}</p>
          )}
          {!isConnected && (
            <p className="text-sm text-yellow-500">Connect your wallet to redeem.</p>
          )}
        </div>
      )}

      {/* ── Step: awaiting TEE decryption ── */}
      {step === "awaiting_tee" && burnHandle && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-violet-900/20 border border-violet-800 flex flex-col gap-2">
            <p className="text-sm text-violet-200 font-semibold">✓ Request submitted — waiting for Nox TEE</p>
            <p className="text-xs text-violet-300/70">
              The Nox TEE is decrypting your share amount off-chain. Once ready,
              click <strong>Finalize Redeem</strong> below — your USDC + yield
              will be sent directly to your wallet.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-gray-800 border border-gray-700 flex flex-col gap-1">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Burn Handle</span>
            <span className="font-mono text-xs text-violet-300 break-all">{burnHandle}</span>
          </div>

          <button
            onClick={handleFinalizeRedeem}
            className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white font-bold transition"
          >
            Finalize Redeem → Receive USDC to my wallet
          </button>
          <p className="text-xs text-gray-600 text-center">
            This calls <code>finalizeRedeem</code> with the TEE proof — Aave withdraws and sends you USDC + yield.
          </p>
        </div>
      )}

      {/* ── Step: finalizing ── */}
      {step === "finalizing" && (
        <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 text-center text-sm text-violet-300 animate-pulse">
          Finalizing… Nox TEE proof verified, withdrawing from Aave…
        </div>
      )}

      {/* ── Step: done ── */}
      {step === "done" && (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-xl bg-green-900/30 border border-green-800 text-green-300 text-sm">
            ✓ Redemption complete! USDC + yield sent to your wallet.
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
          <button onClick={reset} className="text-sm text-gray-400 hover:text-white transition text-center">
            Redeem more
          </button>
        </div>
      )}
    </div>
  );
}
