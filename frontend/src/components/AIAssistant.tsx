"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are the VeilFi AI assistant — a concise, helpful guide for users of VeilFi, a confidential yield vault on Arbitrum Sepolia.

Key facts about VeilFi:
- Users deposit USDC, which is supplied to Aave V3 to earn real yield
- Vault shares are issued as encrypted ERC-7984 tokens — nobody on-chain can see a user's balance or position size
- Privacy is powered by iExec Nox TEE (Intel SGX trusted execution environment) — NOT zero-knowledge proofs or FHE
- The Nox SDK encrypts share amounts client-side before they hit the chain
- Redeeming: user sends encrypted share amount → Nox TEE decrypts off-chain inside the SGX enclave → generates a cryptographic proof → finalizeRedeem verifies the proof and withdraws USDC + yield from Aave
- TEE decryption typically takes 30 seconds to 2 minutes
- Selective disclosure: users can call grantAuditorAccess(address) to let a specific wallet read their encrypted balance handle — useful for regulators, auditors, or proving your position to someone you trust
- ERC-7984 is the encrypted token standard used for confidential balances
- ERC-7540 is the async vault standard (request → finalize flow)
- Deployed on Arbitrum Sepolia (testnet) for the iExec Vibe Coding Challenge hackathon
- VeilVault contract: 0xa6c86c13ebc37cea6626cb55c68151b93ba02c72
- WrappedConfidentialUSDC: 0x8bd6036a82a265aff9ae71db195739d54d386da0

Keep answers short and clear. If asked about something unrelated to VeilFi or DeFi privacy, politely redirect.`;

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
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

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
      const res = await fetch("https://api.chaingpt.org/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "cgpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...newMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
          stream: false,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`API error ${res.status}: ${body}`);
      }

      const data = await res.json();
      const reply: string = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't get a response.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const sendQuestion = async (q: string) => {
    const apiKey = process.env.NEXT_PUBLIC_CHAINGPT_API_KEY;
    if (!apiKey) { setError("ChainGPT API key not configured."); return; }
    setError(null);
    const newMessages: Message[] = [...messages, { role: "user", content: q }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("https://api.chaingpt.org/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "cgpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...newMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
          stream: false,
        }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply: string = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't get a response.";
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
      send();
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
          /* X icon */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          /* Sparkle / AI icon */
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
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)]
                        bg-[#0d1117] border border-gray-800 rounded-2xl shadow-2xl shadow-black/60
                        flex flex-col overflow-hidden"
             style={{ height: "480px" }}>

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
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
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

          {/* Suggested questions (only if only 1 message = greeting) */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {[
                "How does the TEE work?",
                "How do I redeem?",
                "What is selective disclosure?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => sendQuestion(q)}
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
                onClick={send}
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
