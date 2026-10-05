"use client";

import { useState } from "react";
import { MAX_REPLY_LENGTH } from "@/lib/config";
import { displayName, sameAddress, timeAgo } from "@/lib/format";
import { useReplies, useTx } from "@/lib/hooks/useWall";
import { useWallet } from "@/lib/WalletProvider";
import { Avatar } from "./Avatar";
import { TxSteps } from "./TxSteps";

export function Replies({ messageId }: { messageId: number }) {
  const { address, isCorrectChain } = useWallet();
  const { data, isLoading } = useReplies(messageId, true);
  const { run, busy, status, hash, error } = useTx();
  const [text, setText] = useState("");
  const [rejection, setRejection] = useState<string | null>(null);
  const trimmed = text.trim();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed || trimmed.length > MAX_REPLY_LENGTH) return;
    setRejection(null);
    const res = await run("reply", [messageId, trimmed]);
    if (!res) return;
    if (res.values.approved === false) setRejection(String(res.values.reason ?? "Rejected by the AI moderator"));
    else setText("");
  }

  return (
    <div className="mt-3 space-y-2 border-l border-white/10 pl-3">
      {isLoading && <p className="text-xs text-zinc-500">Loading replies…</p>}
      {data?.map((r) => (
        <div key={r.id} className="flex gap-2">
          <Avatar address={r.author} size={20} />
          <div className="min-w-0">
            <p className="text-xs text-zinc-500">
              <span className="font-medium text-zinc-300">{displayName(r.handle, r.author)}</span>
              {sameAddress(r.author, address) && <span className="ml-1 text-violet-300">(you)</span>} · {timeAgo(r.timestamp)}
            </p>
            <p className="whitespace-pre-wrap break-words text-sm text-zinc-200">{r.text}</p>
          </div>
        </div>
      ))}
      {data && data.length === 0 && <p className="text-xs text-zinc-500">No replies yet.</p>}

      {address && isCorrectChain ? (
        <form onSubmit={onSubmit} className="pt-1">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_REPLY_LENGTH + 20}
              disabled={busy}
              placeholder="Write a reply (AI-moderated)…"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-sm placeholder:text-zinc-600 focus:border-violet-400/60 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || !trimmed || trimmed.length > MAX_REPLY_LENGTH}
              className="rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-400 disabled:opacity-50"
            >
              {busy ? "Reviewing…" : "Reply"}
            </button>
          </div>
          {trimmed.length > MAX_REPLY_LENGTH && <p className="mt-1 text-[11px] text-rose-300">Max {MAX_REPLY_LENGTH} characters.</p>}
          {busy && <TxSteps status={status} hash={hash} compact />}
          {rejection && <p className="mt-1.5 text-xs text-rose-300">Reply rejected: {rejection}</p>}
          {error && <p className="mt-1.5 text-xs text-rose-300">{error}</p>}
        </form>
      ) : (
        <p className="text-xs text-zinc-500">Connect MetaMask on Studionet to reply.</p>
      )}
    </div>
  );
}
