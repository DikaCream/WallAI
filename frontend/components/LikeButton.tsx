"use client";

import { useTx } from "@/lib/hooks/useWall";
import { useWallet } from "@/lib/WalletProvider";

export function LikeButton({ messageId, likes, liked, isMine }: { messageId: number; likes: number; liked: boolean; isMine: boolean }) {
  const { address } = useWallet();
  const { run, busy, error, status } = useTx();
  const disabled = !address || isMine || busy;
  const title = !address ? "Connect a wallet to like" : isMine ? "You cannot like your own message" : liked ? "Unlike" : "Like";

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        onClick={() => run("like", [messageId])}
        disabled={disabled}
        title={title}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition ${
          liked ? "bg-rose-500/15 text-rose-200" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        } disabled:cursor-default disabled:hover:bg-transparent`}
      >
        <span aria-hidden>{liked ? "♥" : "♡"}</span>
        <span className="tabular-nums">{likes}</span>
      </button>
      {busy && <span className="text-[11px] text-violet-300">{status === "SIGNING" ? "sign…" : (status ?? "").toLowerCase()}</span>}
      {error && !busy && <span className="text-[11px] text-rose-300" title={error}>failed</span>}
    </span>
  );
}
