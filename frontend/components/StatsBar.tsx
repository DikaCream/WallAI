"use client";

import { useStats } from "@/lib/hooks/useWall";

function Stat({ label, value, tone }: { label: string; value: number | undefined; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value ?? "–"}</p>
    </div>
  );
}

export function StatsBar() {
  const { data } = useStats();
  const rate = data && data.total > 0 ? Math.round((data.approved / data.total) * 100) : undefined;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Published" value={data?.approved} tone="text-emerald-300" />
      <Stat label="Rejected" value={data?.rejected} tone="text-rose-300" />
      <Stat label="Total posts" value={data?.total} tone="text-zinc-100" />
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
        <p className="text-xs uppercase tracking-wider text-zinc-500">Approval rate</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-violet-300">{rate === undefined ? "–" : `${rate}%`}</p>
      </div>
    </div>
  );
}
