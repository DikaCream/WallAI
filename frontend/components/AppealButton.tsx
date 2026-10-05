"use client";

import { useState } from "react";
import { useTx } from "@/lib/hooks/useWall";
import { TxSteps } from "./TxSteps";

/** Lets the author of a rejected post ask the stricter appeal reviewer for a second opinion (once). */
export function AppealButton({ rejectedId }: { rejectedId: number }) {
  const { run, status, hash, error, busy } = useTx();
  const [result, setResult] = useState<{ overturned: boolean; reason: string } | null>(null);

  async function onAppeal() {
    const res = await run("appeal", [rejectedId]);
    if (res) setResult({ overturned: res.values.overturned === true, reason: String(res.values.reason ?? "") });
  }

  if (result) {
    return (
      <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${result.overturned ? "bg-emerald-500/10 text-emerald-200" : "bg-white/[0.04] text-zinc-300"}`}>
        <p className="font-medium">{result.overturned ? "Appeal overturned: your post is now on the wall" : "Appeal denied"}</p>
        {result.reason && <p className="mt-0.5 text-zinc-400">Reviewer: {result.reason}</p>}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        onClick={onAppeal}
        disabled={busy}
        className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/20 disabled:opacity-60"
      >
        {busy ? "Appeal under review…" : "Appeal this decision"}
      </button>
      {busy && <TxSteps status={status} hash={hash} compact />}
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </div>
  );
}
