// Typed wrapper around the WallAI intelligent contract using genlayer-js.
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { TransactionHash } from "genlayer-js/types";
import { CONTRACT_ADDRESS, RPC_URL } from "./config";
import type { EthereumProvider } from "./wallet";

export interface WallMessage {
  id: number;
  author: string;
  text: string;
  timestamp: number;
  reason: string;
}

export interface WallStats {
  approved: number;
  rejected: number;
  total: number;
}

export interface AuthorStats {
  approved: number;
  rejected: number;
  last_rejection_reason: string;
}

export type PostOutcome =
  | { kind: "approved"; reason: string; txHash: string }
  | { kind: "rejected"; reason: string; txHash: string }
  | { kind: "error"; reason: string; txHash?: string };

// genlayer-js decodes contract dicts as Map and ints as bigint; normalize to plain JSON values.
export function toPlain(value: unknown): any {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) obj[String(k)] = toPlain(v);
    return obj;
  }
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && (value as object).constructor === Object) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) obj[k] = toPlain(v);
    return obj;
  }
  return value;
}

function requireAddress(): `0x${string}` {
  if (!CONTRACT_ADDRESS) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured");
  return CONTRACT_ADDRESS;
}

const readClient = createClient({ chain: studionet, endpoint: RPC_URL });

async function read<T>(functionName: string, args: any[] = []): Promise<T> {
  const result = await readClient.readContract({ address: requireAddress(), functionName, args });
  return toPlain(result) as T;
}

export const getMessages = (offset: number, limit: number) => read<WallMessage[]>("get_messages", [offset, limit]);
export const getMessageCount = () => read<number>("get_message_count");
export const getStats = () => read<WallStats>("get_stats");
export const getAuthorStats = (author: string) => read<AuthorStats>("get_author_stats", [author]);

/** Parses the contract return value ({approved, reason}) from Studio's "readable" payload. */
function parseReadableDecision(readable: unknown): { approved: boolean; reason: string } | null {
  if (typeof readable !== "string") return null;
  const approved = readable.match(/"approved"\s*:\s*(true|false)/);
  if (!approved) return null;
  const reason = readable.match(/"reason"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  let reasonText = "";
  if (reason) {
    try {
      reasonText = JSON.parse(`"${reason[1]}"`);
    } catch {
      reasonText = reason[1];
    }
  }
  return { approved: approved[1] === "true", reason: reasonText };
}

/**
 * Submits post_message through MetaMask, waits for consensus (ACCEPTED) and returns the
 * AI moderation outcome. The decision is read from the leader receipt, with a fallback
 * to comparing the author's on-chain stats before/after the transaction.
 */
export async function postMessage(
  author: `0x${string}`,
  provider: EthereumProvider,
  text: string,
  onSubmitted?: (txHash: string) => void,
): Promise<PostOutcome> {
  const address = requireAddress();
  const before = await getAuthorStats(author).catch(() => null);

  const writeClient = createClient({ chain: studionet, endpoint: RPC_URL, account: author, provider: provider as any });
  const txHash: string = await writeClient.writeContract({
    address,
    functionName: "post_message",
    args: [text],
    value: BigInt(0),
  });
  onSubmitted?.(txHash);

  await readClient.waitForTransactionReceipt({
    hash: txHash as TransactionHash,
    status: "ACCEPTED" as any,
    interval: 3000,
    retries: 100,
  });

  const tx: any = await readClient.getTransaction({ hash: txHash as TransactionHash });
  const receipts = tx?.consensus_data?.leader_receipt;
  const leader = Array.isArray(receipts) ? receipts[0] : receipts;
  const statusName: string | undefined = tx?.statusName;

  if (statusName && !["ACCEPTED", "FINALIZED"].includes(statusName)) {
    return { kind: "error", reason: `Validators could not agree (status: ${statusName})`, txHash };
  }
  if (leader?.execution_result && leader.execution_result !== "SUCCESS") {
    const message =
      leader?.result?.payload?.readable || leader?.genvm_result?.stderr || "The contract rejected the transaction";
    return { kind: "error", reason: String(message).slice(0, 300), txHash };
  }

  const decision = parseReadableDecision(leader?.result?.payload?.readable);
  if (decision) {
    return { kind: decision.approved ? "approved" : "rejected", reason: decision.reason, txHash };
  }

  // Fallback: infer the outcome from state changes.
  const after = await getAuthorStats(author);
  if (before && after.rejected > before.rejected) {
    return { kind: "rejected", reason: after.last_rejection_reason, txHash };
  }
  return { kind: "approved", reason: "Approved by the AI moderator", txHash };
}
