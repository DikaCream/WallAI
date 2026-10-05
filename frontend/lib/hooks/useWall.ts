"use client";

import { useCallback, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { CONTRACT_ADDRESS, PAGE_SIZE } from "../config";
import {
  getAuthorStats,
  getLeaderboard,
  getLiked,
  getMessages,
  getRejected,
  getReplies,
  getStats,
  sendTx,
  TxError,
  type TxResult,
} from "../wallai";
import { getProvider } from "../wallet";
import { useWallet } from "../WalletProvider";

const enabled = !!CONTRACT_ADDRESS;
const nextOffset = <T,>(last: T[], pages: T[][]) =>
  last.length < PAGE_SIZE ? undefined : pages.reduce((n, p) => n + p.length, 0);

export function useStats() {
  return useQuery({ queryKey: ["wall", "stats"], queryFn: getStats, enabled, refetchInterval: 15_000 });
}

export function useAuthorStats(address: string | null) {
  return useQuery({
    queryKey: ["wall", "author", address],
    queryFn: () => getAuthorStats(address as string),
    enabled: enabled && !!address,
  });
}

export function useMessages() {
  return useInfiniteQuery({
    queryKey: ["wall", "messages"],
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getMessages(pageParam, PAGE_SIZE),
    getNextPageParam: nextOffset,
    refetchInterval: 15_000,
  });
}

export function useRejected(active: boolean) {
  return useInfiniteQuery({
    queryKey: ["wall", "rejected"],
    enabled: enabled && active,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getRejected(pageParam, PAGE_SIZE),
    getNextPageParam: nextOffset,
    refetchInterval: 20_000,
  });
}

export function useReplies(messageId: number, active: boolean) {
  return useQuery({
    queryKey: ["wall", "replies", messageId],
    queryFn: () => getReplies(messageId, 0, 100),
    enabled: enabled && active,
  });
}

export function useLeaderboard(active: boolean) {
  return useQuery({ queryKey: ["wall", "leaderboard"], queryFn: () => getLeaderboard(20), enabled: enabled && active });
}

export function useLiked(address: string | null, ids: number[]) {
  return useQuery({
    queryKey: ["wall", "liked", address, ids.join(",")],
    queryFn: () => getLiked(address as string, ids),
    enabled: enabled && !!address && ids.length > 0,
  });
}

/** Runs one contract write with live consensus status; refreshes all wall queries afterwards. */
export function useTx() {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (functionName: string, args: unknown[]): Promise<TxResult | null> => {
      const provider = getProvider();
      if (!address || !provider) {
        setError("Connect MetaMask first");
        return null;
      }
      setBusy(true);
      setError(null);
      setHash(null);
      setStatus("SIGNING");
      try {
        return await sendTx(address, provider, functionName, args, { onHash: setHash, onStatus: setStatus });
      } catch (e: any) {
        if (e instanceof TxError && e.hash) setHash(e.hash);
        setError(friendlyError(e));
        return null;
      } finally {
        setBusy(false);
        queryClient.invalidateQueries({ queryKey: ["wall"] });
      }
    },
    [address, queryClient],
  );

  const reset = useCallback(() => {
    setStatus(null);
    setHash(null);
    setError(null);
  }, []);

  return { run, status, hash, error, busy, reset };
}

export function friendlyError(e: any): string {
  if (e?.code === 4001 || /rejected|denied/i.test(e?.message ?? "")) {
    if (!(e instanceof TxError)) return "Transaction was rejected in your wallet";
  }
  return e?.shortMessage || e?.message || "Something went wrong";
}
