"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatDuration, formatDate } from "@/lib/format";
import LoadingScreen from "@/components/LoadingScreen";
import AlertBanner from "@/components/AlertBanner";
import ThemeToggle from "@/components/ThemeToggle";

const rankIcon = (rank: number) => (rank === 2 ? "🥈" : rank === 3 ? "🥉" : null);

export default function LeaderboardPage() {
  const params = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const quizRes = await apiFetch(`/api/quizzes/slug/${params.slug}`);
        const lbRes = await apiFetch(`/api/quizzes/${quizRes.quiz.id}/leaderboard`);
        setData(lbRes);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.slug]);

  if (loading) return <LoadingScreen message="Loading leaderboard..." />;

  if (error) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 font-nunito">
        <div className="card p-6 max-w-sm text-center">
          <AlertBanner message={error} />
          <Link href="/" className="btn-secondary inline-block mt-5">Back Home</Link>
        </div>
      </main>
    );
  }

  const list = data.leaderboard || [];
  const first = list[0];
  const rest = list.slice(1);

  return (
    <main className="min-h-dvh flex flex-col font-nunito pb-10 bg-gradient-to-b from-agora-lightblue to-white dark:from-agora-dark dark:to-agora-dark">
      <header className="flex justify-between items-center p-4">
        <span className="font-poppins font-extrabold text-agora-blue text-sm">AGORA QUIZ</span>
        <ThemeToggle />
      </header>

      <div className="max-w-2xl w-full mx-auto px-4">
        <div className="text-center mb-6">
          <p className="text-xs font-bold tracking-widest text-amber-500 mb-1">🏆 OFFICIAL RESULTS</p>
          <h1 className="font-poppins font-extrabold text-2xl">{data.quizTitle}</h1>
          {data.subjectNames && <p className="text-xs text-agora-blue font-semibold mt-1">{data.subjectNames}</p>}
          <p className="text-xs text-gray-400 mt-2">
            {data.durationMinutes} Minutes · Generated {formatDate(new Date().toISOString())} · {data.candidateCount} Candidate
            {data.candidateCount === 1 ? "" : "s"}
          </p>
        </div>

        {list.length === 0 && <AlertBanner type="info" message="No results yet. Be the first to complete this quiz!" />}

        {first && (
          <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-white dark:from-amber-500/10 dark:to-white/5 p-6 text-center mb-6 shadow-lg shadow-amber-500/10">
            <p className="text-xs font-bold tracking-widest text-amber-500 mb-2">🏆 #1 · TOP CANDIDATE</p>
            <h2 className="font-poppins font-extrabold text-2xl mb-1">{first.studentName}</h2>
            <p className="text-xs text-gray-400 mb-4">🕐 {formatDuration(first.startedAt, first.submittedAt)}</p>
            <p className="font-poppins font-extrabold text-4xl text-agora-green">
              {Math.round(first.percentage)}<span className="text-xl text-gray-400 font-semibold"> / 100</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{first.score}/{first.totalQuestions} correct</p>
          </div>
        )}

        {rest.length > 0 && (
          <>
            <p className="text-center text-xs font-bold tracking-widest text-gray-400 mb-3">FULL RANKING</p>
            <div className="space-y-2.5">
              {rest.map((r: any) => (
                <div
                  key={r.rank}
                  className="card flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-9 h-9 rounded-full bg-agora-lightblue dark:bg-white/10 flex items-center justify-center font-bold text-sm text-agora-blue">
                      {rankIcon(r.rank) || `#${r.rank}`}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{r.studentName}</p>
                      <p className="text-xs text-gray-400">🕐 {formatDuration(r.startedAt, r.submittedAt)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-poppins font-bold text-agora-blue">
                      {Math.round(r.percentage)} <span className="text-xs text-gray-400 font-normal">/ 100</span>
                    </p>
                    <p className="text-[11px] text-gray-400">{r.score}/{r.totalQuestions} correct</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Link href="/" className="btn-secondary block text-center mt-8">Back Home</Link>
      </div>
    </main>
  );
}
