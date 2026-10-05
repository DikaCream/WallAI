"use client";

import { useWallet } from "@/lib/WalletProvider";
import { useAuthorStats } from "@/lib/hooks/useWall";

export function MyActivity() {
  const { address } = useWallet();
  const { data } = useAuthorStats(address);
  if (!address || !data) return null;

  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.025] p-4 sm:p-5">
      <h2 className="text-sm font-medium text-zinc-300">Your activity</h2>
      <div className="mt-3 flex gap-6 text-sm">
        <p>
          <span className="text-lg font-semibold tabular-nums text-emerald-300">{data.approved}</span>
          <span className="ml-1.5 text-zinc-500">published</span>
        </p>
        <p>
          <span className="text-lg font-semibold tabular-nums text-rose-300">{data.rejected}</span>
          <span className="ml-1.5 text-zinc-500">rejected</span>
        </p>
      </div>
      {data.last_rejection_reason && (
        <p className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
          Last rejection: <span className="text-zinc-300">{data.last_rejection_reason}</span>
        </p>
      )}
    </section>
  );
}
