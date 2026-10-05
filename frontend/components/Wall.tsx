"use client";

import { useMessages } from "@/lib/hooks/useWall";
import { useWallet } from "@/lib/WalletProvider";
import { MessageCard } from "./MessageCard";

export function Wall() {
  const { address } = useWallet();
  const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isFetching } =
    useMessages();
  const messages = data?.pages.flat() ?? [];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-300">The wall</h2>
        <button onClick={() => refetch()} className="text-xs text-zinc-500 hover:text-zinc-300">
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
          Could not load messages: {error?.message}
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">
          The wall is empty. Be the first to post something nice.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <MessageCard key={m.id} message={m} isMine={!!address && m.author.toLowerCase() === address.toLowerCase()} />
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
        </div>
      )}
    </section>
  );
}
