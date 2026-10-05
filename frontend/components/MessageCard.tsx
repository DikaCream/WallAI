"use client";

import { useState } from "react";
import { displayName, timeAgo } from "@/lib/format";
import type { WallMessage } from "@/lib/wallai";
import { Avatar } from "./Avatar";
import { LikeButton } from "./LikeButton";
import { Replies } from "./Replies";

export function MessageCard({ message, isMine, liked }: { message: WallMessage; isMine: boolean; liked: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-2xl border border-white/5 bg-white/[0.025] p-4 transition hover:border-white/10">
      <div className="flex items-center gap-3">
        <Avatar address={message.author} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
            <span className={message.handle ? "font-medium" : "font-mono"} title={message.author}>
              {displayName(message.handle, message.author)}
            </span>
            {isMine && <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">YOU</span>}
            {message.via_appeal && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">APPROVED ON APPEAL</span>
            )}
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
          <span>
            {message.via_appeal ? "Appeal reviewer" : "AI moderator"}: {message.reason}
          </span>
        </p>
      )}
      <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-2">
        <LikeButton messageId={message.id} likes={message.likes} liked={liked} isMine={isMine} />
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        >
          💬 <span className="tabular-nums">{message.replies}</span> {open ? "Hide replies" : message.replies === 1 ? "reply" : "replies"}
        </button>
      </div>
      {open && <Replies messageId={message.id} />}
    </article>
  );
}
