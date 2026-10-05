"use client";

import { displayName, sameAddress, timeAgo } from "@/lib/format";
import { useRejected } from "@/lib/hooks/useWall";
import { useWallet } from "@/lib/WalletProvider";
import type { RejectedPost } from "@/lib/wallai";
import { AppealButton } from "./AppealButton";
import { Avatar } from "./Avatar";

const APPEAL_BADGE: Record<RejectedPost["appeal_status"], [string, string] | null> = {
  none: null,
  denied: ["APPEAL DENIED", "bg-white/[0.06] text-zinc-300"],
  overturned: ["OVERTURNED ON APPEAL", "bg-emerald-500/15 text-emerald-200"],
};

export function RejectedList() {
  const { address } = useWallet();
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useRejected(true);
  const items = data?.pages.flat() ?? [];

  return (
    <section className="space-y-3">
      <p className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-zinc-400">
        Posts the AI moderator rejected. For privacy the wall only shows who posted, when, and why: the text stays hidden
        unless an appeal overturns the decision. Authors can appeal each rejection once.
      </p>
      {isLoading ? (
        [0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />)
      ) : isError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
          Could not load rejected posts: {error?.message}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">
          Nothing has been rejected yet.
        </div>
      ) : (
        items.map((r) => {
          const mine = sameAddress(r.author, address);
          const badge = APPEAL_BADGE[r.appeal_status];
          return (
            <article key={r.id} className="rounded-2xl border border-rose-400/10 bg-rose-500/[0.03] p-4">
              <div className="flex items-center gap-3">
                <Avatar address={r.author} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                    <span className={r.handle ? "font-medium" : "font-mono"} title={r.author}>
                      {displayName(r.handle, r.author)}
                    </span>
                    {mine && <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">YOU</span>}
                    {badge && <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${badge[1]}`}>{badge[0]}</span>}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Rejection #{r.id} · {timeAgo(r.timestamp)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-rose-200/90">
                <span className="text-zinc-500">AI reason:</span> {r.reason}
              </p>
              {r.appeal_status === "overturned" && r.text && (
                <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-zinc-100">
                  {r.text}
                  <span className="mt-1 block text-[11px] text-emerald-300">Published as message #{r.message_id}</span>
                </p>
              )}
              {r.appeal_status !== "none" && r.appeal_reason && (
                <p className="mt-2 text-xs text-zinc-400">
                  <span className="text-zinc-500">Appeal reviewer:</span> {r.appeal_reason}
                </p>
              )}
              {mine && r.appeal_status === "none" && <AppealButton rejectedId={r.id} />}
            </article>
          );
        })
      )}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300 hover:border-white/20 disabled:opacity-60"
        >
          {isFetchingNextPage ? "Loading…" : "Load older rejections"}
        </button>
      )}
    </section>
  );
}
