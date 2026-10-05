import { txExplorerUrl } from "@/lib/config";
import { FAILED_STATUSES, TX_STEPS } from "@/lib/wallai";

const LABELS: Record<string, string> = {
  SIGNING: "Confirm in wallet",
  PENDING: "Pending",
  PROPOSING: "Proposing",
  COMMITTING: "Committing",
  REVEALING: "Revealing",
  ACCEPTED: "Accepted",
  FINALIZED: "Finalized",
};

/** Live consensus progress for one transaction, driven by its statusName. */
export function TxSteps({ status, hash, compact = false }: { status: string | null; hash?: string | null; compact?: boolean }) {
  if (!status) return null;
  const failed = FAILED_STATUSES.has(status);
  const index = TX_STEPS.indexOf(status as (typeof TX_STEPS)[number]);
  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      {status === "SIGNING" ? (
        <p className="text-xs text-violet-200">Waiting for your wallet signature…</p>
      ) : failed ? (
        <p className="text-xs text-rose-300">Consensus failed: {status}</p>
      ) : (
        <ol className="flex flex-wrap items-center gap-1.5" aria-label="Consensus status">
          {TX_STEPS.map((step, i) => {
            const done = index > i || (index === i && (step === "ACCEPTED" || step === "FINALIZED"));
            const active = index === i && !done;
            return (
              <li
                key={step}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                  done
                    ? "bg-emerald-500/15 text-emerald-200"
                    : active
                      ? "bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/40"
                      : "bg-white/[0.04] text-zinc-500"
                }`}
              >
                {active && <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-violet-300" />}
                {done && <span>✓</span>}
                {LABELS[step]}
              </li>
            );
          })}
        </ol>
      )}
      {hash && <TxLink hash={hash} />}
    </div>
  );
}

export function TxLink({ hash }: { hash: string }) {
  return (
    <a
      href={txExplorerUrl(hash)}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 inline-block font-mono text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
    >
      tx {hash.slice(0, 10)}…{hash.slice(-6)} ↗
    </a>
  );
}
