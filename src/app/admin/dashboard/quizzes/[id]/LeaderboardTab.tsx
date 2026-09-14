"use client";

import { useEffect, useState } from "react";
import AlertBanner from "@/components/AlertBanner";
import { apiFetch } from "@/lib/api";
import { formatDuration } from "@/lib/format";

const rankIcon = (rank: number) => (rank === 2 ? "🥈" : rank === 3 ? "🥉" : null);

export default function LeaderboardTab({ quizId }: { quizId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/api/quizzes/${quizId}/leaderboard`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;
  if (error) return <AlertBanner message={error} />;

  const list = data.leaderboard || [];
  const first = list[0];
  const rest = list.slice(1);

  return (
    <div className="font-nunito">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-300">{list.length} student result(s)</p>
        <a href={`/api/quizzes/${quizId}/leaderboard/pdf`} className="btn-secondary text-xs !py-1.5 !px-3">
          Download PDF
        </a>
      </div>

      {list.length === 0 ? (
        <div className="card p-6 text-center text-sm text-gray-400">No submissions yet.</div>
      ) : (
        <>
          {first && (
            <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-white dark:from-amber-500/10 dark:to-white/5 p-5 text-center mb-5">
              <p className="text-xs font-bold tracking-widest text-amber-500 mb-1">🏆 #1 · TOP CANDIDATE</p>
              <h2 className="font-poppins font-extrabold text-xl mb-1">{first.studentName}</h2>
              <p className="text-xs text-gray-400 mb-2">🕐 {formatDuration(first.startedAt, first.submittedAt)}</p>
              <p className="font-poppins font-extrabold text-3xl text-agora-green">
                {Math.round(first.percentage)}<span className="text-lg text-gray-400 font-semibold"> / 100</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">{first.score}/{first.totalQuestions} correct</p>
            </div>
          )}

          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((r: any) => (
                <div key={r.rank} className="card flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-agora-lightblue dark:bg-white/10 flex items-center justify-center font-bold text-xs text-agora-blue">
                      {rankIcon(r.rank) || `#${r.rank}`}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{r.studentName}</p>
                      <p className="text-xs text-gray-400">🕐 {formatDuration(r.startedAt, r.submittedAt)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-poppins font-bold text-agora-blue text-sm">
                      {Math.round(r.percentage)} <span className="text-[10px] text-gray-400 font-normal">/ 100</span>
                    </p>
                    <p className="text-[10px] text-gray-400">{r.score}/{r.totalQuestions} correct</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
