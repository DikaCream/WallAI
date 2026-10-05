"use client";

import type { PendingPost } from "@/lib/PendingProvider";
import { usePending } from "@/lib/PendingProvider";
import { displayName } from "@/lib/format";
import { AppealButton } from "./AppealButton";
import { Avatar } from "./Avatar";
import { TxLink, TxSteps } from "./TxSteps";

const BADGE: Record<PendingPost["phase"], [string, string]> = {
  signing: ["AWAITING SIGNATURE", "bg-violet-500/15 text-violet-200"],
  consensus: ["PENDING · AI MODERATION", "bg-violet-500/15 text-violet-200"],
  approved: ["APPROVED", "bg-emerald-500/15 text-emerald-200"],
  rejected: ["REJECTED", "bg-rose-500/15 text-rose-200"],
  error: ["NOT POSTED", "bg-amber-500/15 text-amber-200"],
};

/** Optimistic card for a post the user just signed; turns into approved/rejected in place. */
export function PendingCard({ post, handle }: { post: PendingPost; handle?: string }) {
  const { remove } = usePending();
  const [label, tone] = BADGE[post.phase];
  const live = post.phase === "signing" || post.phase === "consensus";
  const border =
    post.phase === "approved"
      ? "border-emerald-400/30"
      : post.phase === "rejected"
        ? "border-rose-400/30"
        : post.phase === "error"
          ? "border-amber-400/30"
          : "border-violet-400/30 border-dashed";

  return (
    <article className={`rounded-2xl border bg-white/[0.025] p-4 ${border}`} data-testid="pending-card">
      <div className="flex items-center gap-3">
        <Avatar address={post.author} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
            <span className="font-medium">{displayName(handle, post.author)}</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${tone}`}>{label}</span>
          </p>
          <p className="text-xs text-zinc-500">{post.resultId !== undefined && post.resultId >= 0 && post.phase === "approved" ? `#${post.resultId} · ` : ""}just now</p>
        </div>
        {!live && (
          <button onClick={() => remove(post.key)} className="text-xs text-zinc-500 hover:text-zinc-300" title="Dismiss">
            ✕
          </button>
        )}
      </div>
      <p className={`mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed ${post.phase === "rejected" ? "text-zinc-400 line-through decoration-rose-400/40" : "text-zinc-100"}`}>
        {post.text}
      </p>
      {live && <TxSteps status={post.status} hash={post.txHash} />}
      {post.phase === "approved" && (
        <p className="mt-3 text-xs text-emerald-300">✓ Published. AI moderator: {post.reason}</p>
      )}
      {post.phase === "rejected" && (
        <>
          <p className="mt-3 text-xs text-rose-300">✕ Rejected. Reason: {post.reason}</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            The text is not shown publicly; the rejection (with this reason) is listed in the Rejected tab.
          </p>
          {post.resultId !== undefined && post.resultId >= 0 && <AppealButton rejectedId={post.resultId} />}
        </>
      )}
      {post.phase === "error" && <p className="mt-3 text-xs text-amber-200">{post.reason}</p>}
      {!live && post.txHash && <TxLink hash={post.txHash} />}
    </article>
  );
}
