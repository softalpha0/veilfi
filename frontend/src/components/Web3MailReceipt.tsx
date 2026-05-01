"use client";

import { useState } from "react";
import { IExecWeb3mail } from "@iexec/web3mail";

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

interface Props {
  txHash: string;
  receiverAddress: string;
}

type Status = "idle" | "fetching" | "sending" | "done" | "no_contact" | "error";

export function Web3MailReceipt({ txHash, receiverAddress }: Props) {
  const [status, setStatus]     = useState<Status>("idle");
  const [error, setError]       = useState<string | null>(null);

  const sendReceipt = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("No wallet provider found.");
      setStatus("error");
      return;
    }

    setError(null);
    setStatus("fetching");

    try {
      const web3mail = new IExecWeb3mail(window.ethereum);

      // Find protected email contacts for the receiver address
      const contacts = await web3mail.fetchUserContacts({
        userAddress: receiverAddress,
      });

      if (!contacts || contacts.length === 0) {
        setStatus("no_contact");
        return;
      }

      setStatus("sending");

      const protectedData = contacts[0].address;

      await web3mail.sendEmail({
        protectedData,
        emailSubject: "VeilFi — Redemption Complete",
        emailContent: `
Your VeilFi vault redemption has been finalized.

USDC + yield has been sent to your wallet.

Transaction: ${txHash}
View on Arbiscan: https://sepolia.arbiscan.io/tx/${txHash}

Your position was fully private throughout — encrypted by iExec Nox TEE.

— VeilFi
        `.trim(),
        senderName: "VeilFi",
        contentType: "text/plain",
      });

      setStatus("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send email";
      setError(msg);
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 border border-green-800 rounded-xl px-3 py-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
        Email receipt sent via iExec Web3Mail
      </div>
    );
  }

  if (status === "no_contact") {
    return (
      <div className="flex flex-col gap-1.5 text-xs p-3 rounded-xl bg-gray-800 border border-gray-700">
        <span className="text-gray-400 font-semibold">No protected email found</span>
        <p className="text-gray-500 leading-relaxed">
          To receive email receipts, protect your email address with iExec DataProtector first.
        </p>
        <a
          href="https://explorer.iex.ec/arbitrum-sepolia-testnet"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-400 hover:text-violet-300 transition underline"
        >
          Set up on iExec Explorer ↗
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={sendReceipt}
        disabled={status === "fetching" || status === "sending"}
        className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-gray-700
                   text-gray-400 hover:text-violet-300 hover:border-violet-700
                   disabled:opacity-40 disabled:cursor-not-allowed transition w-fit"
      >
        {/* Mail icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        {status === "fetching" ? "Checking contact…" :
         status === "sending"  ? "Sending via Web3Mail…" :
         "Send email receipt via iExec Web3Mail"}
      </button>

      {status === "error" && error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-3 py-2 break-words">
          {error}
        </p>
      )}
    </div>
  );
}
