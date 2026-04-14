import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col">

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-900/40">
              V
            </div>
            <span className="font-bold text-lg tracking-tight">VeilFi</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#tech" className="hover:text-white transition-colors">Technology</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <Link
            href="/app"
            className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-900/30"
          >
            Launch App
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">

        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-24 flex flex-col items-center text-center gap-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/8 text-violet-300 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Live on Arbitrum Sepolia · Testnet
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-4xl">
              Earn yield.{" "}
              <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
                Stay invisible.
              </span>
            </h1>

            <p className="text-gray-400 text-xl max-w-2xl leading-relaxed">
              A confidential yield vault powered by{" "}
              <span className="text-white font-medium">iExec Nox TEE</span>.
              Deposit USDC, earn real Aave V3 yield, and keep your position
              completely hidden — encrypted on-chain with{" "}
              <span className="text-white font-medium">ERC-7984</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link
                href="/app"
                className="px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg transition-colors shadow-2xl shadow-violet-900/40"
              >
                Launch App →
              </Link>
              <a
                href="https://sepolia.arbiscan.io/address/0x4e2097d3Ad9C6530728Cf74bf0838D4A2043D743"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl border border-gray-700 hover:border-gray-500 hover:bg-white/5 text-gray-300 font-semibold text-lg transition-all"
              >
                View Contract ↗
              </a>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {[
                "🔒 Encrypted positions",
                "💰 Real Aave yield",
                "⚡ Intel SGX TEE",
                "🔗 ERC-7984 standard",
                "✅ Zero mocks",
              ].map((f) => (
                <span key={f} className="px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-gray-400 text-xs">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-24 bg-gray-900/30 border-y border-white/5">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Four steps. Real yield. Your position never visible on-chain.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                {
                  step: "01",
                  icon: "💵",
                  title: "Deposit USDC",
                  desc: "Approve and deposit USDC. The vault pulls your tokens in a single transaction.",
                  color: "from-violet-500/20 to-violet-500/5",
                  border: "border-violet-800/40",
                },
                {
                  step: "02",
                  icon: "📈",
                  title: "Aave earns yield",
                  desc: "Your USDC is immediately supplied to Aave V3. Real yield accrues every block.",
                  color: "from-blue-500/20 to-blue-500/5",
                  border: "border-blue-800/40",
                },
                {
                  step: "03",
                  icon: "🔒",
                  title: "Shares encrypted",
                  desc: "ERC-7984 confidential shares are issued via iExec Nox TEE. No one can read your balance.",
                  color: "from-green-500/20 to-green-500/5",
                  border: "border-green-800/40",
                },
                {
                  step: "04",
                  icon: "🏦",
                  title: "Redeem privately",
                  desc: "Submit an encrypted request. Nox TEE decrypts in a secure enclave. Receive USDC + yield.",
                  color: "from-orange-500/20 to-orange-500/5",
                  border: "border-orange-800/40",
                },
              ].map(({ step, icon, title, desc, color, border }) => (
                <div key={step} className={`relative flex flex-col gap-4 p-6 rounded-2xl bg-gradient-to-b ${color} border ${border}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-bold text-gray-600 font-mono">{step}</span>
                  </div>
                  <h3 className="font-bold text-white text-lg leading-snug">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why VeilFi */}
        <section className="py-24 max-w-6xl mx-auto px-6 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why privacy matters in DeFi</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Every on-chain balance is public. VeilFi changes that — without sacrificing yield.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🎯",
                title: "Stop being a target",
                desc: "Public balances let anyone identify high-value wallets. Encrypted positions remove you from the target list entirely.",
              },
              {
                icon: "🤫",
                title: "Position privacy",
                desc: "Nobody knows when you entered, how much you hold, or when you're about to exit. Not bots, not competitors, not anyone.",
              },
              {
                icon: "💎",
                title: "Same yield, full privacy",
                desc: "You get the exact same Aave V3 yield as anyone else — no compromise, no privacy tax. Aave earns; you stay invisible.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-800 bg-gray-900/40 hover:border-gray-700 transition-colors">
                <span className="text-3xl">{icon}</span>
                <h3 className="font-bold text-white text-lg">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech stack */}
        <section id="tech" className="py-24 bg-gray-900/30 border-y border-white/5">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">The technology</h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Three battle-tested protocols. One confidential vault.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "iExec Nox TEE",
                  tag: "Confidential Compute",
                  icon: "⚙️",
                  desc: "Intel SGX Trusted Execution Environment. Processes encrypted data inside a secure hardware enclave — even node operators cannot inspect the plaintext. Handles encrypted minting, balance tracking, and decryption proofs.",
                  badge: "Privacy Layer",
                  badgeColor: "bg-violet-900/50 text-violet-300 border-violet-800",
                },
                {
                  name: "ERC-7984",
                  tag: "Confidential Token Standard",
                  icon: "🔐",
                  desc: "The on-chain standard for encrypted fungible tokens. Vault shares are euint256 handles — the balance on-chain is an encrypted value only readable by the TEE and the share holder.",
                  badge: "Token Standard",
                  badgeColor: "bg-blue-900/50 text-blue-300 border-blue-800",
                },
                {
                  name: "Aave V3",
                  tag: "Yield Source",
                  icon: "📊",
                  desc: "The most trusted lending protocol in DeFi. All deposited USDC is supplied to Aave V3 on Arbitrum Sepolia. Yield accrues every block and is distributed proportionally on redemption.",
                  badge: "Yield Layer",
                  badgeColor: "bg-green-900/50 text-green-300 border-green-800",
                },
              ].map(({ name, tag, icon, desc, badge, badgeColor }) => (
                <div key={name} className="flex flex-col gap-5 p-6 rounded-2xl border border-gray-800 bg-gray-900/50 hover:border-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <h3 className="font-bold text-white text-lg leading-none">{name}</h3>
                        <span className="text-xs text-gray-500">{tag}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${badgeColor} flex-shrink-0`}>
                      {badge}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Contracts */}
            <div className="mt-10 p-6 rounded-2xl border border-gray-800 bg-gray-900/30">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">
                Deployed Contracts · Arbitrum Sepolia
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ["VeilVault", "0x4e2097d3Ad9C6530728Cf74bf0838D4A2043D743"],
                  ["WrappedConfidentialUSDC (ERC-7984)", "0x9cbc4779f608f4AA8c6871D25C28297B0783547c"],
                  ["USDC (testnet)", "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"],
                  ["Aave V3 Pool", "0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff"],
                ].map(([label, addr]) => (
                  <div key={addr} className="flex flex-col gap-1 p-3 rounded-xl bg-gray-900 border border-gray-800">
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
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked</h2>
            </div>
            <div className="flex flex-col divide-y divide-gray-800">
              {[
                {
                  q: "Is the yield real?",
                  a: "Yes. All deposited USDC is supplied directly to Aave V3 on Arbitrum Sepolia. Real yield accrues every block. No mocks, no simulations.",
                },
                {
                  q: "What exactly stays private?",
                  a: "Your share balance — how much you deposited, the size of your position, and when you exit. The vault's total Aave balance is public, but your individual share is encrypted with iExec Nox TEE and never stored in plaintext on-chain.",
                },
                {
                  q: "How does the redeem work?",
                  a: "You submit an encrypted redeem request. The Nox TEE (Intel SGX enclave) detects it, decrypts your share amount off-chain, and generates a cryptographic proof. The vault verifies the proof on-chain and withdraws the correct USDC + yield to your wallet.",
                },
                {
                  q: "How long does redemption take?",
                  a: "The TEE typically processes decryption requests within 30 seconds to 2 minutes on testnet. The app polls automatically — you just wait for the notification.",
                },
                {
                  q: "Which wallet do I need?",
                  a: "Any EVM wallet on Arbitrum Sepolia — MetaMask recommended. Get test USDC from the Aave testnet faucet at app.aave.com/faucet.",
                },
                {
                  q: "Is VeilFi audited?",
                  a: "This is a testnet prototype. Contracts are unaudited. Do not use with real funds on mainnet.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="py-6 flex flex-col gap-2">
                  <h3 className="font-semibold text-white text-lg">{q}</h3>
                  <p className="text-gray-400 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-center px-6 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-[80px]" />
          </div>
          <div className="relative max-w-xl mx-auto flex flex-col items-center gap-6">
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Ready to earn<br />
              <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
                invisibly?
              </span>
            </h2>
            <p className="text-gray-400 text-lg">
              Connect your wallet and deposit USDC. Your position stays private from the first block.
            </p>
            <Link
              href="/app"
              className="px-10 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg transition-colors shadow-2xl shadow-violet-900/40"
            >
              Launch App →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xs">V</div>
            <span className="text-sm font-semibold text-gray-400">VeilFi</span>
          </div>
          <p className="text-xs text-gray-600">
            Powered by iExec Nox TEE · ERC-7984 · Aave V3 · Arbitrum Sepolia
          </p>
          <a
            href="https://github.com/softalpha0/veilfi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
