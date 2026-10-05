"use client";

import { useEffect, useMemo } from "react";
import { useAuthorStats, useLiked, useMessages } from "@/lib/hooks/useWall";
import { usePending } from "@/lib/PendingProvider";
import { useWallet } from "@/lib/WalletProvider";
import { sameAddress } from "@/lib/format";
import { MessageCard } from "./MessageCard";
import { PendingCard } from "./PendingCard";

export function Wall() {
  const { address } = useWallet();
  const { pending, remove } = usePending();
  const { data: me } = useAuthorStats(address);
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages();
  const messages = useMemo(() => data?.pages.flat() ?? [], [data]);
  const ids = useMemo(() => messages.map((m) => m.id), [messages]);
  const { data: liked } = useLiked(address, ids);

  // Once an approved pending post shows up in the real feed, drop the optimistic card.
  useEffect(() => {
    for (const p of pending) {
      if (p.phase === "approved" && p.resultId !== undefined && ids.includes(p.resultId)) remove(p.key);
    }
  }, [pending, ids, remove]);

  return (
    <section className="space-y-3">
      {pending.map((p) => (
        <PendingCard key={p.key} post={p} handle={me?.handle} />
      ))}

      {isLoading ? (
        [0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />)
      ) : isError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
          Could not load messages: {error?.message}
        </div>
      ) : messages.length === 0 && pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">
          The wall is empty. Be the first to post something nice.
        </div>
      ) : (
        <>
          {messages.map((m, i) => (
            <MessageCard
              key={m.id}
              message={m}
              isMine={sameAddress(m.author, address)}
              liked={!!liked && liked.length === ids.length ? !!liked[i] : false}
            />
          ))}
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300 hover:border-white/20 disabled:opacity-60"
            >
              {isFetchingNextPage ? "Loading…" : "Load older messages"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
