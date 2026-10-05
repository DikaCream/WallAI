const steps = [
  ["Sign", "You submit post_message from MetaMask. Studionet is gasless. Your post shows up instantly as pending."],
  ["Moderate", "The leader validator asks an LLM: approve or reject, and why?"],
  ["Verify", "Other validators re-run the moderation and must reach the same decision (Proposing → Committing → Revealing → Accepted)."],
  ["Publish", "Approved posts go on the wall. Rejections are listed publicly with the AI's reason, but without the text."],
  ["Appeal", "Think the AI got it wrong? Appeal once: a stricter senior reviewer weighs context and false positives."],
];

export function HowItWorks() {
  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.015] p-4 sm:p-5">
      <h2 className="text-sm font-medium text-zinc-300">How moderation works</h2>
      <ol className="mt-3 space-y-2.5">
        {steps.map(([title, body], i) => (
          <li key={title} className="flex gap-3 text-sm">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/5 text-[11px] text-zinc-400">{i + 1}</span>
            <p className="text-zinc-400">
              <span className="font-medium text-zinc-200">{title}.</span> {body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
