"use client";
import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";

type Question = {
  id: string;
  body: string;
  author: string | null;
  votes: number;
};

export default function QuestionsList({
  initialQuestions,
  initialHasMore,
}: {
  initialQuestions: Question[];
  initialHasMore: boolean;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Debounced search: wait 300ms after typing stops; each keystroke cancels
  // the previous timer, so "deploying" fires one request, not nine.
  useEffect(() => {
    const id = setTimeout(async () => {
      const url = query
        ? `/api/questions?q=${encodeURIComponent(query)}`
        : `/api/questions`;
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data.questions);
      setHasMore(data.hasMore);
    }, 300);

    return () => clearTimeout(id); // cancel the pending timer on each keystroke
  }, [query]);

  async function submit() {
    if (!draft.trim()) return;

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    const created = await res.json();

    setQuestions((qs) => [{ ...created, votes: 0 }, ...qs]);
    setDraft("");
  }

  async function upvote(id: string) {
    // optimistic: assume success, update the UI now
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, votes: q.votes + 1 } : q))
    );

    const res = await fetch(`/api/questions/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId: getVoterId() }),
    });

    // server said no (already voted) — roll back
    if (!res.ok) {
      setQuestions((qs) =>
        qs.map((q) => (q.id === id ? { ...q, votes: q.votes - 1 } : q))
      );
    }
  }

  async function loadMore() {
    setLoading(true);
    const res = await fetch(`/api/questions?offset=${questions.length}`);
    const data = await res.json();
    setQuestions((qs) => [...qs, ...data.questions]);
    setHasMore(data.hasMore);
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      {/* Ask box */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand to-brand-soft rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative glass-panel p-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="What's on your mind?"
              className="flex-1 rounded-xl bg-background/50 px-5 py-3.5 text-base outline-none placeholder:text-muted focus:bg-background border border-transparent focus:border-brand/50 transition-all shadow-inner"
            />
            <button
              onClick={submit}
              className="rounded-xl bg-gradient-to-r from-brand-strong to-brand px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:-translate-y-0.5 hover:shadow-brand/40 active:translate-y-0"
            >
              Ask
            </button>
          </div>
        </div>
      </div>

      {/* Search + hydration status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            className="w-full rounded-xl border border-white/10 bg-surface/40 pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand/50 focus:bg-surface/80 transition-colors backdrop-blur-sm"
          />
        </div>
        <span className="shrink-0 text-xs font-medium px-3 py-1 rounded-full bg-surface/50 border border-white/5 text-muted flex items-center gap-1.5 backdrop-blur-sm">
          {hydrated ? (
            <><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Ready</>
          ) : (
            <><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span> Connecting</>
          )}
        </span>
      </div>

      {/* Questions */}
      <ul className="space-y-4">
        {questions.map((q) => (
          <li
            key={q.id}
            className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-surface/30 p-5 shadow-sm transition-all hover:bg-surface/60 hover:shadow-md hover:border-white/10 backdrop-blur-sm"
          >
            <button
              onClick={() => upvote(q.id)}
              className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-white/10 bg-background/50 px-3.5 py-2.5 text-brand transition-all hover:border-brand/50 hover:bg-brand/10 hover:shadow-[0_0_15px_rgba(91,84,232,0.15)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
              <span className="text-sm font-bold leading-none tabular-nums">
                {q.votes}
              </span>
            </button>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-foreground leading-relaxed text-[15px]">{q.body}</p>
              {q.author && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-muted">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center border border-brand/10">
                    <span className="text-[10px] font-semibold text-brand">{q.author.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="font-medium text-foreground/70">{q.author}</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {questions.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center bg-surface/20 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No questions yet</h3>
          <p className="text-sm text-muted">Be the first to spark the conversation.</p>
        </div>
      )}

      {hasMore && (
        <div className="pt-4 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="group relative rounded-xl border border-white/10 bg-surface/40 px-6 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-surface/80 hover:border-brand/30 disabled:opacity-50 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Loading…</>
              ) : "Load more"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
