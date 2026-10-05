"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/** A post the user just signed, shown optimistically on the wall while validators decide. */
export interface PendingPost {
  key: string;
  author: string;
  text: string;
  createdAt: number;
  phase: "signing" | "consensus" | "approved" | "rejected" | "error";
  status: string;
  txHash?: string;
  reason?: string;
  resultId?: number;
}

interface PendingState {
  pending: PendingPost[];
  add: (post: PendingPost) => void;
  update: (key: string, patch: Partial<PendingPost>) => void;
  remove: (key: string) => void;
}

const PendingContext = createContext<PendingState | null>(null);

export function PendingProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingPost[]>([]);
  const add = useCallback((post: PendingPost) => setPending((p) => [post, ...p]), []);
  const update = useCallback(
    (key: string, patch: Partial<PendingPost>) => setPending((p) => p.map((x) => (x.key === key ? { ...x, ...patch } : x))),
    [],
  );
  const remove = useCallback((key: string) => setPending((p) => p.filter((x) => x.key !== key)), []);
  const value = useMemo(() => ({ pending, add, update, remove }), [pending, add, update, remove]);
  return <PendingContext.Provider value={value}>{children}</PendingContext.Provider>;
}

export function usePending(): PendingState {
  const ctx = useContext(PendingContext);
  if (!ctx) throw new Error("usePending must be used inside <PendingProvider>");
  return ctx;
}
