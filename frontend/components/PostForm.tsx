"use client";

import { useState } from "react";
import { useWallet } from "@/lib/WalletProvider";
import { usePostMessage } from "@/lib/hooks/useWall";
import { MAX_MESSAGE_LENGTH, txExplorerUrl } from "@/lib/config";
import type { PostOutcome } from "@/lib/wallai";

type Phase = "idle" | "signing" | "reviewing";

export function PostForm() {
  const { address, isCorrectChain, isMetaMaskAvailable, connect, switchChain, error: walletError } = useWallet();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<PostOutcome | null>(null);

  const mutation = usePostMessage((hash) => {
    setTxHash(hash);
    setPhase("reviewing");
  });

  const trimmed = text.trim();
  const remaining = MAX_MESSAGE_LENGTH - trimmed.length;
  const busy = phase !== "idle";
  const canPost = !!address && isCorrectChain && trimmed.length > 0 && remaining >= 0 && !busy;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address || !canPost) return;
    setOutcome(null);
    setTxHash(null);
    setPhase("signing");
    try {
      const result = await mutation.mutateAsync({ author: address, text: trimmed });
      setOutcome(result);
      if (result.kind === "approved") setText("");
    } catch (err: any) {
      const msg = err?.code === 4001 || /rejected|denied/i.test(err?.message ?? "")
        ? "Transaction was rejected in your wallet"
        : err?.message || "Something went wrong";
      setOutcome({ kind: "error", reason: msg, txHash: txHash ?? undefined });
    } finally {
      setPhase("idle");
    }
  }

  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.025] p-4 sm:p-5">
      <h2 className="text-sm font-medium text-zinc-300">Post to the wall</h2>
      <p className="mt-1 text-xs text-zinc-500">
        An AI moderator reviews every message. Spam, scams, insults and hate speech are rejected.
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
              {phase === "signing" ? "Confirm in wallet…" : phase === "reviewing" ? "AI reviewing…" : "Post message"}
            </button>
          )}
        </div>
      </form>

      {walletError && <p className="mt-3 text-xs text-rose-300">{walletError}</p>}

      {phase === "reviewing" && (
        <div className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/5 p-3.5 text-sm">
          <p className="flex items-center gap-2 font-medium text-violet-200">
            <span className="flex gap-1">
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-violet-300" />
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-violet-300 [animation-delay:200ms]" />
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-violet-300 [animation-delay:400ms]" />
            </span>
            Pending: validators are moderating your message
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            A leader asks an LLM for a decision and the other validators re-check it independently. This usually takes
            10–60 seconds.
          </p>
          {txHash && <TxLink hash={txHash} />}
        </div>
      )}

      {outcome && phase === "idle" && <OutcomeBanner outcome={outcome} />}
    </section>
  );
}

function TxLink({ hash }: { hash: string }) {
  return (
    <a href={txExplorerUrl(hash)} target="_blank" rel="noreferrer" className="mt-2 inline-block font-mono text-xs text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline">
      View transaction {hash.slice(0, 10)}…{hash.slice(-6)} ↗
    </a>
  );
}

function OutcomeBanner({ outcome }: { outcome: PostOutcome }) {
  const styles = {
    approved: { box: "border-emerald-400/20 bg-emerald-500/5", title: "text-emerald-200", label: "Approved and published" },
    rejected: { box: "border-rose-400/20 bg-rose-500/5", title: "text-rose-200", label: "Rejected by the AI moderator" },
    error: { box: "border-amber-400/20 bg-amber-500/5", title: "text-amber-200", label: "Could not post" },
  }[outcome.kind];

  return (
    <div className={`mt-4 rounded-xl border p-3.5 text-sm ${styles.box}`}>
      <p className={`font-medium ${styles.title}`}>{styles.label}</p>
      {outcome.reason && <p className="mt-1 text-zinc-300">{outcome.kind === "error" ? outcome.reason : `Reason: ${outcome.reason}`}</p>}
      {outcome.txHash && <TxLink hash={outcome.txHash} />}
    </div>
  );
}
