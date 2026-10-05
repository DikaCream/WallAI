import { addressHue, shortAddress, timeAgo } from "@/lib/format";
import type { WallMessage } from "@/lib/wallai";

export function MessageCard({ message, isMine }: { message: WallMessage; isMine: boolean }) {
  const hue = addressHue(message.author);
  return (
    <article className="rounded-2xl border border-white/5 bg-white/[0.025] p-4 transition hover:border-white/10">
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 shrink-0 rounded-full"
          style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 65%), hsl(${(hue + 60) % 360} 70% 45%))` }}
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-mono text-sm text-zinc-300">
            {shortAddress(message.author)}
            {isMine && <span className="rounded bg-violet-500/15 px-1.5 py-0.5 font-sans text-[10px] font-medium text-violet-300">YOU</span>}
          </p>
          <p className="text-xs text-zinc-500">
            #{message.id} · {timeAgo(message.timestamp)}
          </p>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-zinc-100">{message.text}</p>
      {message.reason && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-zinc-500">
          <span className="mt-px text-emerald-400">✓</span>
          <span>AI moderator: {message.reason}</span>
        </p>
      )}
    </article>
  );
}
