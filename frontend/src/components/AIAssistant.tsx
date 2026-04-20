"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Prepended to every question so ChainGPT knows the VeilFi context
const CONTEXT_PREFIX = `You are the VeilFi AI assistant. Answer only about VeilFi and DeFi/privacy topics. Be concise.

VeilFi facts:
- Confidential yield vault on Arbitrum Sepolia
- Users deposit USDC → supplied to Aave V3 for real yield
- Shares are encrypted ERC-7984 tokens (euint256 handles) via iExec Nox TEE (Intel SGX) — NOT ZK or FHE
- Deposit amount is plaintext; share balance is fully encrypted on-chain
- Redeem flow: encrypt shares → requestRedeem → Nox TEE decrypts off-chain (30s–2min) → finalizeRedeem verifies TEE proof → USDC+yield sent to wallet
- Selective disclosure: grantAuditorAccess(address) lets one specific wallet read your encrypted balance
- VeilVault: 0xa6c86c13ebc37cea6626cb55c68151b93ba02c72 | wcUSDC: 0x8bd6036a82a265aff9ae71db195739d54d386da0
- Shares use 6 decimals (10 USDC = 10,000,000 shares)

User question: `;

async function callChainGPT(
  question: string,
  history: Message[],
  apiKey: string,
): Promise<string> {
  // Build conversation context from history (skip greeting message)
  const historyContext = history
    .filter((m) => m.role !== "assistant" || history.indexOf(m) > 0)
    .slice(-6) // last 3 exchanges
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const fullQuestion = historyContext
    ? `${CONTEXT_PREFIX}${question}\n\nPrevious conversation:\n${historyContext}`
    : `${CONTEXT_PREFIX}${question}`;

  const res = await fetch("https://api.chaingpt.org/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "general_assistant",
      question: fullQuestion,
      chatHistory: "off",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  const text = await res.text();

  // Response may be plain text (streaming) or JSON { data: { bot: "..." } }
  try {
    const data = JSON.parse(text);
    return data?.data?.bot ?? data?.bot ?? text;
  } catch {
    // Plain text stream — use directly
    return text.trim() || "Sorry, I couldn't get a response.";
  }
}

export function AIAssistant() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Hi! I'm the VeilFi assistant. Ask me anything about deposits, redeeming, privacy, or how the Nox TEE works.",
      }]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const submitQuestion = async (text: string) => {
    if (!text.trim() || loading) return;

    const apiKey = process.env.NEXT_PUBLIC_CHAINGPT_API_KEY;
    if (!apiKey) {
      setError("ChainGPT API key not configured.");
      return;
    }

    setInput("");
    setError(null);
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const reply = await callChainGPT(text, messages, apiKey);
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitQuestion(input);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle AI assistant"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl shadow-violet-900/60
                    flex items-center justify-center transition-all duration-200
                    ${open
                      ? "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                      : "bg-violet-600 hover:bg-violet-500 text-white"
                    }`}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1z"/>
            <path d="M12 19a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1z"/>
            <path d="M4.22 4.22a1 1 0 0 1 1.42 0l1.42 1.42a1 1 0 0 1-1.42 1.42L4.22 5.64a1 1 0 0 1 0-1.42z"/>
            <path d="M16.94 16.94a1 1 0 0 1 1.42 0l1.42 1.42a1 1 0 0 1-1.42 1.42l-1.42-1.42a1 1 0 0 1 0-1.42z"/>
            <path d="M2 12a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2H3a1 1 0 0 1-1-1z"/>
            <path d="M19 12a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2h-2a1 1 0 0 1-1-1z"/>
            <path d="M4.22 19.78a1 1 0 0 1 0-1.42l1.42-1.42a1 1 0 1 1 1.42 1.42l-1.42 1.42a1 1 0 0 1-1.42 0z"/>
            <path d="M16.94 7.06a1 1 0 0 1 0-1.42l1.42-1.42a1 1 0 1 1 1.42 1.42l-1.42 1.42a1 1 0 0 1-1.42 0z"/>
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)]
                     bg-[#0d1117] border border-gray-800 rounded-2xl shadow-2xl shadow-black/60
                     flex flex-col overflow-hidden"
          style={{ height: "480px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700
                              flex items-center justify-center text-white font-bold text-xs shadow-sm">
                V
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white leading-tight">VeilFi Assistant</span>
                <span className="text-[10px] text-gray-500 leading-tight">Powered by ChainGPT</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 text-sm">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-gray-800 text-gray-200 rounded-bl-sm border border-gray-700"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-xl rounded-bl-sm px-3 py-2.5 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2 break-words">
                {error}
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {messages.length === 1 && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {["How does the TEE work?", "How do I redeem?", "What is selective disclosure?"].map((q) => (
                <button
                  key={q}
                  onClick={() => submitQuestion(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-gray-700
                             text-gray-400 hover:text-violet-300 hover:border-violet-700 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3">
            <div className="flex gap-2 items-center bg-gray-800 border border-gray-700
                            focus-within:border-violet-600 rounded-xl px-3 py-2 transition">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about VeilFi…"
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600
                           outline-none disabled:opacity-50"
              />
              <button
                onClick={() => submitQuestion(input)}
                disabled={!input.trim() || loading}
                className="text-violet-400 hover:text-violet-300 disabled:opacity-30 transition flex-shrink-0"
                aria-label="Send"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
