"use client";

import { useEffect, useState } from "react";
import { useStats } from "@/lib/hooks/useWall";
import { Leaderboard } from "./Leaderboard";
import { RejectedList } from "./RejectedList";
import { Wall } from "./Wall";

const TABS = [
  { id: "wall", label: "Wall" },
  { id: "rejected", label: "Rejected" },
  { id: "leaderboard", label: "Leaderboard" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function Feed() {
  const [tab, setTab] = useState<Tab>("wall");
  const { data: stats } = useStats();

  // Deep links: /#rejected, /#leaderboard
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if (TABS.some((t) => t.id === h)) setTab(h as Tab);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const select = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", t === "wall" ? window.location.pathname : `#${t}`);
  };
  const counts: Partial<Record<Tab, number | undefined>> = { wall: stats?.approved, rejected: stats?.rejected };

  return (
    <div>
      <div role="tablist" className="mb-4 flex gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => select(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
              tab === t.id ? "bg-white/10 font-medium text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
            {counts[t.id] !== undefined && <span className="ml-1.5 text-xs tabular-nums text-zinc-500">{counts[t.id]}</span>}
          </button>
        ))}
      </div>
      {tab === "wall" && <Wall />}
      {tab === "rejected" && <RejectedList />}
      {tab === "leaderboard" && <Leaderboard />}
    </div>
  );
}
