"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/lib/WalletProvider";
import { usePending } from "@/lib/PendingProvider";
import { friendlyError } from "@/lib/hooks/useWall";
import { getProvider } from "@/lib/wallet";
import { MAX_MESSAGE_LENGTH } from "@/lib/config";
import { postMessage, TxError } from "@/lib/wallai";

export function PostForm() {
  const { address, isCorrectChain, isMetaMaskAvailable, connect, switchChain, error: walletError } = useWallet();
  const { add, update } = usePending();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const trimmed = text.trim();
  const remaining = MAX_MESSAGE_LENGTH - trimmed.length;
  const canPost = !!address && isCorrectChain && trimmed.length > 0 && remaining >= 0 && !busy;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const provider = getProvider();
    if (!address || !provider || !canPost) return;
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    add({ key, author: address, text: trimmed, createdAt: Date.now(), phase: "signing", status: "SIGNING" });
    setBusy(true);
    setText("");
    try {
      const result = await postMessage(address, provider, trimmed, {
        onHash: (txHash) => update(key, { txHash, phase: "consensus", status: "PENDING" }),
        onStatus: (status) => update(key, { status }),
      });
      update(key, { phase: result.kind, reason: result.reason, resultId: result.id, txHash: result.txHash });
    } catch (err: any) {
      const reason = friendlyError(err);
      update(key, { phase: "error", reason, ...(err instanceof TxError && err.hash ? { txHash: err.hash } : {}) });
      if (!(err instanceof TxError)) setText(trimmed); // wallet rejection: give the text back
    } finally {
      setBusy(false);
      queryClient.invalidateQueries({ queryKey: ["wall"] });
    }
  }

  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.025] p-4 sm:p-5">
      <h2 className="text-sm font-medium text-zinc-300">Post to the wall</h2>
      <p className="mt-1 text-xs text-zinc-500">
        An AI moderator reviews every message. Spam, scams, insults and hate speech are rejected. Your post appears on the
        wall as <span className="text-violet-300">pending</span> while validators decide.
      </p>

      <form onSubmit={onSubmit} className="mt-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={address ? "Say something nice…" : "Connect MetaMask to post"}
          rows={4}
          disabled={!address || busy}
          className="w-full resize-none rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-3 text-[15px] text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className={`text-xs tabular-nums ${remaining < 0 ? "text-rose-400" : remaining < 30 ? "text-amber-300" : "text-zinc-500"}`}>
            {remaining} characters left
          </span>

          {!isMetaMaskAvailable ? (
            <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="text-sm text-violet-300 hover:text-violet-200">
              Install MetaMask →
            </a>
          ) : !address ? (
            <button type="button" onClick={connect} className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400">
              Connect MetaMask
            </button>
          ) : !isCorrectChain ? (
            <button type="button" onClick={switchChain} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400">
              Switch network
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canPost}
              className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Moderating…" : "Post message"}
            </button>
          )}
        </div>
      </form>

      {walletError && <p className="mt-3 text-xs text-rose-300">{walletError}</p>}
    </section>
  );
}
