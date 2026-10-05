import { Header } from "@/components/Header";
import { HowItWorks } from "@/components/HowItWorks";
import { MyActivity } from "@/components/MyActivity";
import { PostForm } from "@/components/PostForm";
import { StatsBar } from "@/components/StatsBar";
import { Feed } from "@/components/Feed";
import { CONTRACT_ADDRESS, EXPLORER_URL } from "@/lib/config";

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            A public wall, <span className="text-violet-300">moderated by AI consensus</span>.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Post up to 280 characters. An intelligent contract on GenLayer asks LLM validators whether your message is
            appropriate and you watch consensus happen live. Like, reply, claim a handle, climb the leaderboard, and
            appeal if you think the AI got it wrong.
          </p>
        </div>

        {!CONTRACT_ADDRESS ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 text-sm text-amber-100">
            <p className="font-medium">Contract address not configured.</p>
            <p className="mt-1 text-amber-200/80">
              Set <code className="font-mono">NEXT_PUBLIC_CONTRACT_ADDRESS</code> in <code className="font-mono">frontend/.env.local</code> and
              restart the dev server.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <PostForm />
              <MyActivity />
              <HowItWorks />
            </aside>
            <div className="space-y-6">
              <StatsBar />
              <Feed />
            </div>
          </div>
        )}

        <footer className="mt-16 border-t border-white/5 pt-6 text-xs text-zinc-600">
          <p>
            Built on GenLayer Studionet.
            {CONTRACT_ADDRESS && (
              <>
                {" "}Contract{" "}
                <a className="font-mono hover:text-zinc-400" href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">
                  {CONTRACT_ADDRESS}
                </a>
              </>
            )}
          </p>
        </footer>
      </main>
    </>
  );
}
