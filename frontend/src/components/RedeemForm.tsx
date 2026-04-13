"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useWalletClient, usePublicClient } from "wagmi";
import { parseGwei, decodeEventLog } from "viem";
import { createViemHandleClient } from "@iexec-nox/handle";
import { VEIL_VAULT_ABI } from "@/lib/veilVaultAbi";
import { VAULT_ADDRESS } from "@/lib/wagmi";

const GAS = {
  maxFeePerGas:         parseGwei("0.1"),
  maxPriorityFeePerGas: parseGwei("0.001"),
} as const;

// TEE processing poll config
const POLL_INTERVAL_MS = 20_000;  // try publicDecrypt every 20s
const POLL_MAX_TRIES   = 18;       // give up after ~6 minutes

type Step =
  | "idle"
  | "encrypting"
  | "requesting"
  | "awaiting_tee"   // burn handle submitted, TEE decrypting
  | "polling"        // auto-retrying publicDecrypt
  | "finalizing"     // sending finalizeRedeem tx
  | "done"
  | "error";

export function RedeemForm() {
  const { address, isConnected } = useAccount();
  const { data: walletClient }   = useWalletClient();
  const publicClient             = usePublicClient();
  const { writeContractAsync }   = useWriteContract();

  const [mounted, setMounted]         = useState(false);
  const [shares, setShares]           = useState("");
  const [step, setStep]               = useState<Step>("idle");
  const [burnHandle, setBurnHandle]   = useState<`0x${string}` | null>(null);
  const [txHash, setTxHash]           = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [pollCount, setPollCount]     = useState(0);
  const [nextPollIn, setNextPollIn]   = useState(0);   // countdown seconds
  const pollRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Clean up timers on unmount
  useEffect(() => () => {
    if (pollRef.current)  clearTimeout(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // ── Step 1: encrypt share amount + submit requestRedeem ────────────────────
  const handleRequestRedeem = async () => {
    if (!address || !walletClient || !shares || !publicClient) return;
    setError(null);

    try {
      // 1a. Encrypt the share amount client-side with Nox SDK
      setStep("encrypting");
      const handleClient = await createViemHandleClient(walletClient);
      const { handle, handleProof } = await handleClient.encryptInput(
        BigInt(shares),
        "uint256",
        VAULT_ADDRESS,
      );

      // 1b. Submit requestRedeem on-chain
      setStep("requesting");
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VEIL_VAULT_ABI,
        functionName: "requestRedeem",
        args: [handle, handleProof, address],
        ...GAS,
      });

      // 1c. Wait for receipt and parse the REAL burn handle from the event.
      //     The contract's _burn() creates a NEW euint256 — different from `handle`.
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      let realBurnHandle: `0x${string}` | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: VEIL_VAULT_ABI,
            eventName: "RedeemRequested",
            data: log.data,
            topics: log.topics,
          });
          realBurnHandle = (decoded.args as { burnHandle: `0x${string}` }).burnHandle;
          break;
        } catch { /* not this log */ }
      }

      if (!realBurnHandle) {
        // Fallback: use the input handle (less ideal but better than null)
        realBurnHandle = handle as `0x${string}`;
      }

      setBurnHandle(realBurnHandle);
      setStep("awaiting_tee");

      // 1d. Start auto-polling after initial delay
      startPolling(realBurnHandle, 0);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStep("error");
    }
  };

  // ── Polling: auto-retry publicDecrypt every POLL_INTERVAL_MS ───────────────
  const startPolling = (handle: `0x${string}`, attempt: number) => {
    if (attempt >= POLL_MAX_TRIES) {
      setError(
        "TEE is taking longer than expected. Click 'Retry Finalize' to keep trying.",
      );
      setStep("error");
      return;
    }

    setPollCount(attempt + 1);

    // Countdown timer for UX
    let secs = Math.round(POLL_INTERVAL_MS / 1000);
    setNextPollIn(secs);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      secs -= 1;
      setNextPollIn(secs);
      if (secs <= 0 && timerRef.current) clearInterval(timerRef.current);
    }, 1000);

    // Schedule next attempt
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = setTimeout(
      () => tryFinalize(handle, attempt + 1),
      attempt === 0 ? 5_000 : POLL_INTERVAL_MS,   // first try after 5s
    );
  };

  const tryFinalize = async (handle: `0x${string}`, attempt: number) => {
    if (!walletClient) return;
    setStep("polling");

    try {
      const handleClient = await createViemHandleClient(walletClient);
      const { decryptionProof } = await handleClient.publicDecrypt(handle);

      // TEE ready — send finalizeRedeem
      setStep("finalizing");
      if (timerRef.current) clearInterval(timerRef.current);

      const hash = await writeContractAsync({
        address: VAULT_ADDRESS,
        abi: VEIL_VAULT_ABI,
        functionName: "finalizeRedeem",
        args: [handle, decryptionProof],
        ...GAS,
      });

      setTxHash(hash);
      setStep("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      // If TEE hasn't processed yet, keep polling silently
      if (
        msg.includes("does not exist") ||
        msg.includes("not publicly decryptable") ||
        msg.includes("not found")
      ) {
        setStep("awaiting_tee");
        startPolling(handle, attempt);
      } else {
        // Real error
        setError(msg || "Finalize failed");
        setStep("error");
      }
    }
  };

  // Manual retry button (if user hit error or wants to force retry)
  const handleManualFinalize = () => {
    if (!burnHandle) return;
    setError(null);
    tryFinalize(burnHandle, pollCount);
  };

  const reset = () => {
    if (pollRef.current)  clearTimeout(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setStep("idle");
    setShares("");
    setBurnHandle(null);
    setTxHash(null);
    setError(null);
    setPollCount(0);
    setNextPollIn(0);
  };

  if (!mounted) return (
    <div className="w-full p-6 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse h-48" />
  );

  // ── Stepper labels ─────────────────────────────────────────────────────────
  const stepIndex =
    ["idle","encrypting","requesting","error"].includes(step) ? 0 :
    ["awaiting_tee","polling"].includes(step)                 ? 1 :
    ["finalizing","done"].includes(step)                      ? 2 : 0;

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
      <div className="flex items-center gap-2 text-xs flex-wrap">
        {[
          "1. Encrypt & Request",
          "2. TEE Decrypts",
          "3. Receive USDC",
        ].map((label, i) => {
          const active = i === stepIndex;
          const done   = i < stepIndex || step === "done";
          return (
            <div key={label} className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full font-semibold transition ${
                done   ? "bg-green-800 text-green-300" :
                active ? "bg-violet-700 text-white" :
                         "bg-gray-800 text-gray-500"
              }`}>
                {done && i < stepIndex ? `✓ ${label}` : label}
              </span>
              {i < 2 && <span className="text-gray-700">→</span>}
            </div>
          );
        })}
      </div>

      {/* ── idle / encrypting / requesting / error ── */}
      {(step === "idle" || step === "encrypting" || step === "requesting" || step === "error") && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-400">
            Enter how many shares to redeem. The amount is{" "}
            <span className="text-violet-400 font-medium">encrypted by Nox TEE</span>
            {" "}— never visible on-chain. USDC + yield will be sent to{" "}
            <span className="text-white font-mono text-xs">
              {address ? `${address.slice(0,6)}…${address.slice(-4)}` : "your wallet"}
            </span>.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="e.g. 10000000  (10 USDC worth of shares)"
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
            Shares use 6 decimals — 10 USDC deposited ≈ 10,000,000 shares
          </p>
          {step === "error" && error && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl p-3 break-words">
                {error}
              </p>
              {burnHandle && (
                <button
                  onClick={handleManualFinalize}
                  className="text-sm text-violet-400 hover:text-violet-300 underline text-left"
                >
                  Retry Finalize (TEE may now be ready)
                </button>
              )}
            </div>
          )}
          {!isConnected && (
            <p className="text-sm text-yellow-500">Connect your wallet to redeem.</p>
          )}
        </div>
      )}

      {/* ── awaiting TEE / polling ── */}
      {(step === "awaiting_tee" || step === "polling") && burnHandle && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-violet-900/20 border border-violet-800 flex flex-col gap-2">
            <p className="text-sm text-violet-200 font-semibold">
              ✓ Request submitted — Nox TEE is decrypting your shares
            </p>
            <p className="text-xs text-violet-300/70">
              The TEE runs in a secure Intel SGX enclave off-chain. It reads your encrypted
              burn handle, decrypts the share amount, and generates a cryptographic proof.
              This typically takes <strong>30 seconds – 2 minutes</strong>.
            </p>
          </div>

          {/* Live status */}
          <div className="p-3 rounded-xl bg-gray-800 border border-gray-700 flex items-center gap-3">
            <span className="animate-spin text-lg">⚙️</span>
            <div className="flex flex-col">
              <span className="text-sm text-violet-300">
                {step === "polling"
                  ? `Checking TEE (attempt ${pollCount})…`
                  : nextPollIn > 0
                    ? `Next check in ${nextPollIn}s (attempt ${pollCount + 1})`
                    : "Preparing first check…"
                }
              </span>
              <span className="text-xs text-gray-500 font-mono break-all mt-1">
                Handle: {burnHandle.slice(0,14)}…{burnHandle.slice(-6)}
              </span>
            </div>
          </div>

          {/* Receiver info */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>💰</span>
            <span>
              When done, USDC + yield → <span className="text-white font-mono">
                {address ? `${address.slice(0,6)}…${address.slice(-4)}` : "your wallet"}
              </span>
            </span>
          </div>

          {/* Manual override */}
          <button
            onClick={handleManualFinalize}
            className="w-full py-3 rounded-xl border border-violet-700 text-violet-400
                       hover:bg-violet-900/30 font-semibold transition text-sm"
          >
            Force Check Now
          </button>
        </div>
      )}

      {/* ── finalizing ── */}
      {step === "finalizing" && (
        <div className="p-4 rounded-xl bg-gray-800 border border-green-800 text-center flex flex-col gap-2">
          <div className="text-green-400 font-semibold text-sm animate-pulse">
            🔓 TEE proof verified — withdrawing from Aave…
          </div>
          <div className="text-xs text-gray-500">
            Sending USDC + yield to your wallet. Confirm in MetaMask.
          </div>
        </div>
      )}

      {/* ── done ── */}
      {step === "done" && (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-xl bg-green-900/30 border border-green-800 text-green-300 text-sm flex flex-col gap-1">
            <span className="font-bold">✅ Redemption complete!</span>
            <span>USDC + yield has been sent to your wallet.</span>
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
            Redeem more →
          </button>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-gray-700 border-t border-gray-800 pt-3">
        Share amounts are encrypted by the Nox SDK before being sent on-chain.
        The TEE decrypts off-chain in a secure enclave and returns your USDC + yield.
      </p>
    </div>
  );
}
