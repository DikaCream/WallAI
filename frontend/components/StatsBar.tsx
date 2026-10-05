"use client";

import { useStats } from "@/lib/hooks/useWall";

function Stat({ label, value, tone, hint }: { label: string; value: string | number | undefined; tone: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value ?? "–"}</p>
      {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
    </div>
  );
}

export function StatsBar() {
  const { data } = useStats();
  const rate = data && data.total > 0 ? `${Math.round((data.approved / data.total) * 100)}%` : undefined;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Published" value={data?.approved} tone="text-emerald-300" hint={data ? `${data.users} posters` : undefined} />
      <Stat label="Rejected" value={data?.rejected} tone="text-rose-300" hint={rate ? `${rate} approval rate` : undefined} />
      <Stat
        label="Appeals"
        value={data?.appeals}
        tone="text-amber-200"
        hint={data ? `${data.overturned} overturned` : undefined}
      />
      <Stat label="Likes" value={data?.likes} tone="text-pink-300" hint={data ? `${data.replies} replies` : undefined} />
    </div>
  );
}
