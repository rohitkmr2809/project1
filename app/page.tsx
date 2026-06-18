import QuestionsList from "./questions-list";
import { getQuestionsPage } from "@/lib/questions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function Page() {
  let questions: any[] = [];
  let hasMore = false;
  let errorMsg = null;

  try {
    const data = await getQuestionsPage(0, PAGE_SIZE);
    questions = data.questions;
    hasMore = data.hasMore;
  } catch (err: any) {
    console.error("Error loading questions:", err);
    errorMsg = err.message || "An unexpected error occurred while loading questions.";
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-20 animate-fade-in relative z-10">
      <header className="mb-10 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-soft/20 blur-3xl rounded-full pointer-events-none -z-10" />
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand shadow-[0_0_15px_rgba(91,84,232,0.2)] backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
          </span>
          LIVE NOW
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-foreground via-foreground/80 to-brand bg-clip-text text-transparent">
          Live Q&A Sessions
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted max-w-xl mx-auto font-medium">
          Ask questions anonymously, upvote the best ones, and get answers in real-time.
        </p>
      </header>

      {errorMsg ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-red-500 font-bold text-xl">!</span>
            </div>
            <h2 className="text-xl font-semibold text-red-500">System Error</h2>
          </div>
          <p className="font-mono text-sm text-foreground/80 break-all bg-background/50 p-4 rounded-xl border border-border">
            {errorMsg}
          </p>
          <div className="mt-6 flex gap-3 text-sm text-muted">
            <p>Hint: Ensure your Supabase environment variables are set and the database schema is applied.</p>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 sm:p-8">
          <QuestionsList initialQuestions={questions} initialHasMore={hasMore} />
        </div>
      )}
    </main>
  );
}
