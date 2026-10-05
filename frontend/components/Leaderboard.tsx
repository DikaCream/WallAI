"use client";

import { displayName, sameAddress } from "@/lib/format";
import { useLeaderboard } from "@/lib/hooks/useWall";
import { useWallet } from "@/lib/WalletProvider";
import { Avatar } from "./Avatar";

export function Leaderboard() {
  const { address } = useWallet();
  const { data, isLoading, isError, error } = useLeaderboard(true);

  if (isLoading) return <div className="h-48 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />;
  if (isError)
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
        Could not load the leaderboard: {error?.message}
      </div>
    );
  if (!data || data.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">No posters yet.</div>
    );

  return (
    <section className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
          <tr className="border-b border-white/5">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-2 py-3 font-medium">Poster</th>
            <th className="px-2 py-3 text-right font-medium">Approved</th>
            <th className="px-2 py-3 text-right font-medium">Likes</th>
            <th className="hidden px-2 py-3 text-right font-medium sm:table-cell">Replies</th>
            <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Rejected</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.address} className={`border-b border-white/5 last:border-0 ${sameAddress(row.address, address) ? "bg-violet-500/[0.06]" : ""}`}>
              <td className="px-4 py-3 tabular-nums text-zinc-500">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</td>
              <td className="px-2 py-3">
                <span className="flex items-center gap-2">
                  <Avatar address={row.address} size={22} />
                  <span className={row.handle ? "font-medium text-zinc-200" : "font-mono text-zinc-300"} title={row.address}>
                    {displayName(row.handle, row.address)}
                  </span>
                </span>
              </td>
              <td className="px-2 py-3 text-right tabular-nums text-emerald-300">{row.approved}</td>
              <td className="px-2 py-3 text-right tabular-nums text-rose-200">{row.likes_received}</td>
              <td className="hidden px-2 py-3 text-right tabular-nums text-zinc-300 sm:table-cell">{row.replies}</td>
              <td className="hidden px-4 py-3 text-right tabular-nums text-zinc-500 sm:table-cell">{row.rejected}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-white/5 px-4 py-2 text-[11px] text-zinc-500">Ranked by approved posts, then likes received, then replies.</p>
    </section>
  );
}
