"use client";

import { useState } from "react";
import { useWallet } from "@/lib/WalletProvider";
import { useAuthorStats, useTx } from "@/lib/hooks/useWall";
import { TxSteps } from "./TxSteps";

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

function HandleForm({ current }: { current: string }) {
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(!current);
  const { run, busy, status, hash, error } = useTx();
  const normalized = value.trim().replace(/^@/, "").toLowerCase();
  const valid = HANDLE_RE.test(normalized);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const res = await run("set_handle", [normalized]);
    if (res) {
      setValue("");
      setEditing(false);
    }
  }

  if (!editing)
    return (
      <p className="mt-3 flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-200">@{current}</span>
        <button onClick={() => setEditing(true)} className="text-xs text-violet-300 hover:text-violet-200">
          Change handle
        </button>
      </p>
    );

  return (
    <form onSubmit={onSubmit} className="mt-3">
      <label className="text-xs text-zinc-500">{current ? "New handle" : "Pick a handle (shown instead of your address)"}</label>
      <div className="mt-1 flex gap-2">
        <div className="flex min-w-0 flex-1 items-center rounded-lg border border-white/10 bg-zinc-950/60 px-2.5 focus-within:border-violet-400/60">
          <span className="text-sm text-zinc-500">@</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={busy}
            placeholder="your_name"
            maxLength={21}
            className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-zinc-600"
          />
        </div>
        <button type="submit" disabled={!valid || busy} className="rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-400 disabled:opacity-50">
          {busy ? "Saving…" : "Save"}
        </button>
        {current && !busy && (
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
            Cancel
          </button>
        )}
      </div>
      {value && !valid && <p className="mt-1 text-[11px] text-amber-300">3–20 characters: a-z, 0-9 and _ only.</p>}
      {busy && <TxSteps status={status} hash={hash} compact />}
      {error && <p className="mt-1.5 text-xs text-rose-300">{error}</p>}
    </form>
  );
}

export function MyActivity() {
  const { address } = useWallet();
  const { data } = useAuthorStats(address);
  if (!address || !data) return null;

  const stats: [number, string, string][] = [
    [data.approved, "published", "text-emerald-300"],
    [data.rejected, "rejected", "text-rose-300"],
    [data.likes_received, "likes", "text-pink-300"],
    [data.replies, "replies", "text-sky-300"],
  ];

  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.025] p-4 sm:p-5">
      <h2 className="text-sm font-medium text-zinc-300">Your profile</h2>
      <HandleForm key={data.handle} current={data.handle} />
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        {stats.map(([value, label, tone]) => (
          <div key={label} className="rounded-lg bg-white/[0.03] py-2">
            <p className={`text-lg font-semibold tabular-nums ${tone}`}>{value}</p>
            <p className="text-[11px] text-zinc-500">{label}</p>
          </div>
        ))}
      </div>
      {data.last_rejection_reason && (
        <p className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
          Last rejection: <span className="text-zinc-300">{data.last_rejection_reason}</span>
        </p>
      )}
    </section>
  );
}
