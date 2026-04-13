import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">

      {/* Nav */}
      <header className="border-b border-gray-800/60 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">V</div>
          <span className="font-bold text-lg tracking-tight">VeilFi</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#how" className="hover:text-white transition">How it works</a>
          <a href="#tech" className="hover:text-white transition">Tech</a>
          <a href="#faq" className="hover:text-white transition">FAQ</a>
        </nav>
        <Link
          href="/app"
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition"
        >
          Launch App
        </Link>
      </header>

      <main className="flex-1 flex flex-col">

        {/* Hero */}
        <section className="max-w-7xl mx-auto w-full px-6 pt-24 pb-20 flex flex-col items-center text-center gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse inline-block" />
            Live on Arbitrum Sepolia · iExec Vibe Coding Challenge
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight max-w-4xl">
            Earn yield.<br />
            <span className="text-violet-400">Stay invisible.</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl leading-relaxed">
            VeilFi is a confidential yield vault. Deposit USDC, earn real Aave V3 yield,
            and keep your position size completely hidden — powered by{" "}
            <span className="text-white font-medium">iExec Nox TEE</span> and{" "}
            <span className="text-white font-medium">ERC-7984</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/app"
              className="px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg transition shadow-lg shadow-violet-900/40"
            >
              Launch App →
            </Link>
            <a
              href="https://sepolia.arbiscan.io/address/0x4e2097d3Ad9C6530728Cf74bf0838D4A2043D743"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold text-lg transition"
            >
              View Contract
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 mt-8 w-full max-w-lg">
            {[
              ["ERC-7984", "Confidential Token"],
              ["Aave V3", "Real Yield"],
              ["Nox TEE", "Privacy Layer"],
            ].map(([val, label]) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-white">{val}</span>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-gray-900/40 border-y border-gray-800/60 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-14">How it works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Deposit USDC",
                  desc: "Approve and deposit any amount of USDC. The vault pulls your tokens in a single transaction.",
                  color: "violet",
                },
                {
                  step: "02",
                  title: "Aave earns yield",
                  desc: "Your USDC is immediately supplied to Aave V3. Real yield accrues every block.",
                  color: "blue",
                },
                {
                  step: "03",
                  title: "Encrypted shares minted",
                  desc: "ERC-7984 confidential shares are issued to you via iExec Nox TEE. Nobody on-chain can read your balance.",
                  color: "green",
                },
                {
                  step: "04",
                  title: "Redeem privately",
                  desc: "Submit a confidential redeem request. Nox TEE decrypts your shares and returns your USDC + yield.",
                  color: "orange",
                },
              ].map(({ step, title, desc, color }) => (
                <div key={step} className="flex flex-col gap-3 p-6 rounded-2xl bg-gray-900 border border-gray-800">
                  <span className={`text-xs font-bold text-${color}-400 tracking-widest`}>{step}</span>
                  <h3 className="font-semibold text-white text-lg">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech stack */}
        <section id="tech" className="py-20 max-w-7xl mx-auto px-6 w-full">
          <h2 className="text-3xl font-bold text-center mb-14">Built on</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "iExec Nox",
                tag: "Confidential Compute",
                desc: "Trusted Execution Environment (TEE) layer that processes encrypted data without exposing plaintext on-chain. Handles share minting, balance tracking, and decryption.",
                badge: "Core",
              },
              {
                name: "ERC-7984",
                tag: "Confidential Token Standard",
                desc: "The confidential fungible token standard. Vault shares implement ERC-7984 — balances and transfer amounts are fully encrypted handles that only authorized parties can decrypt.",
                badge: "Standard",
              },
              {
                name: "Aave V3",
                tag: "Yield Layer",
                desc: "Battle-tested DeFi lending protocol. All deposited USDC is supplied to Aave V3 on Arbitrum Sepolia, generating real yield that is returned proportionally on redemption.",
                badge: "Yield",
              },
            ].map(({ name, tag, desc, badge }) => (
              <div key={name} className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-800 bg-gray-900/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-xl">{name}</h3>
                    <span className="text-xs text-gray-500">{tag}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-violet-900/50 text-violet-300 border border-violet-800">
                    {badge}
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Contract addresses */}
          <div className="mt-10 p-6 rounded-2xl border border-gray-800 bg-gray-900/30">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Deployed Contracts · Arbitrum Sepolia</h3>
            <div className="flex flex-col gap-2">
              {[
                ["VeilVault", "0x4e2097d3Ad9C6530728Cf74bf0838D4A2043D743"],
                ["WrappedConfidentialUSDC (ERC-7984)", "0x9cbc4779f608f4AA8c6871D25C28297B0783547c"],
                ["Underlying USDC", "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"],
                ["Aave V3 Pool", "0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff"],
              ].map(([label, addr]) => (
                <div key={addr} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
                  <span className="text-gray-500 w-56 flex-shrink-0">{label}</span>
                  <a
                    href={`https://sepolia.arbiscan.io/address/${addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-violet-400 hover:text-violet-300 transition text-xs"
                  >
                    {addr}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-gray-900/40 border-t border-gray-800/60 py-20">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-14">FAQ</h2>
            <div className="flex flex-col gap-6">
              {[
                ["Is the yield real?", "Yes. All deposited USDC is supplied to Aave V3 on Arbitrum Sepolia — real yield accrues in real-time. No mocks, no simulations."],
                ["What stays private?", "Your share balance — how much you deposited, when, and how much you hold — is encrypted via iExec Nox TEE. The vault's total Aave balance is public, but your individual position is not."],
                ["How does redemption work?", "You submit an encrypted redeem request. Nox's TEE decrypts the share amount off-chain and provides a proof. The vault uses the proof to withdraw the correct USDC + yield amount."],
                ["Which wallet do I need?", "Any EVM wallet on Arbitrum Sepolia (MetaMask recommended). Get test USDC from the Aave testnet faucet at app.aave.com/faucet."],
                ["Is VeilFi audited?", "This is a hackathon prototype. Do not use with real funds. Contracts are unaudited."],
              ].map(([q, a]) => (
                <div key={q as string} className="flex flex-col gap-2">
                  <h3 className="font-semibold text-white">{q}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center px-6">
          <h2 className="text-4xl font-extrabold mb-4">Ready to earn invisibly?</h2>
          <p className="text-gray-400 mb-8">Connect your wallet and deposit USDC in under a minute.</p>
          <Link
            href="/app"
            className="inline-block px-10 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg transition shadow-lg shadow-violet-900/40"
          >
            Launch App →
          </Link>
        </section>
      </main>

      <footer className="border-t border-gray-800/60 py-6 text-center text-xs text-gray-700">
        VeilFi · Built for the iExec Vibe Coding Challenge · Powered by Nox TEE × ERC-7984 × Aave V3
      </footer>
    </div>
  );
}
