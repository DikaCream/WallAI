"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CONTRACT_ADDRESS, PAGE_SIZE } from "../config";
import { getAuthorStats, getMessages, getStats, postMessage, type PostOutcome, type WallMessage } from "../wallai";
import { getProvider } from "../wallet";

const enabled = !!CONTRACT_ADDRESS;

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: getStats, enabled, refetchInterval: 15_000 });
}

export function useAuthorStats(address: string | null) {
  return useQuery({
    queryKey: ["author-stats", address],
    queryFn: () => getAuthorStats(address as string),
    enabled: enabled && !!address,
  });
}

export function useMessages() {
  return useInfiniteQuery({
    queryKey: ["messages"],
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getMessages(pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage: WallMessage[], pages) =>
      lastPage.length < PAGE_SIZE ? undefined : pages.reduce((n, p) => n + p.length, 0),
    refetchInterval: 15_000,
  });
}

export function usePostMessage(onSubmitted?: (txHash: string) => void) {
  const queryClient = useQueryClient();
  return useMutation<PostOutcome, Error, { author: `0x${string}`; text: string }>({
    mutationFn: async ({ author, text }) => {
      const provider = getProvider();
      if (!provider) throw new Error("MetaMask is not installed");
      return postMessage(author, provider, text, onSubmitted);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["author-stats"] });
    },
  });
}
