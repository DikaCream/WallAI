"use client";

import { useWallet } from "@/lib/WalletProvider";
import { CHAIN_NAME } from "@/lib/config";
import { displayName } from "@/lib/format";
import { useAuthorStats } from "@/lib/hooks/useWall";

export function Header() {
  const { address, isMetaMaskAvailable, isConnecting, isCorrectChain, connect, switchChain, disconnect } = useWallet();
  const { data: me } = useAuthorStats(address);

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/15 ring-1 ring-violet-400/30">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-violet-300" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16v9a2 2 0 0 1-2 2h-7l-4 3v-3H6a2 2 0 0 1-2-2z" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">WallAI</p>
            <p className="text-xs text-zinc-500">AI-moderated social wall</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {CHAIN_NAME}
          </span>

          {!isMetaMaskAvailable ? (
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
            >
              Install MetaMask
            </a>
          ) : !address ? (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="rounded-lg bg-violet-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:opacity-60"
            >
              {isConnecting ? "Connecting…" : "Connect MetaMask"}
            </button>
          ) : !isCorrectChain ? (
            <button
              onClick={switchChain}
              className="rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
            >
              Switch to {CHAIN_NAME}
            </button>
          ) : (
            <button
              onClick={disconnect}
              title="Disconnect"
              className="group flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-mono text-sm text-zinc-200 hover:border-white/20"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="group-hover:hidden">{displayName(me?.handle, address)}</span>
              <span className="hidden font-sans group-hover:inline">Disconnect</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
