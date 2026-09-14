"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import AdminShell from "@/components/AdminShell";

export default function AdminOverviewPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/quizzes")
      .then((res) => setQuizzes(res.quizzes))
      .finally(() => setLoading(false));
  }, []);

  const published = quizzes.filter((q) => q.status === "published").length;
  const drafts = quizzes.filter((q) => q.status === "draft").length;
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.question_count || 0), 0);

  return (
    <AdminShell>
      <h1 className="font-poppins font-bold text-2xl mb-6">Welcome back 👋</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Quizzes", value: quizzes.length },
          { label: "Published", value: published },
          { label: "Drafts", value: drafts },
          { label: "Total Questions", value: totalQuestions },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-2xl font-poppins font-bold text-agora-blue">{loading ? "…" : s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-300 font-nunito mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-poppins font-semibold text-lg">Recent Quizzes</h2>
        <Link href="/admin/dashboard/quizzes" className="text-sm text-agora-blue font-semibold">View all →</Link>
      </div>

      <div className="card divide-y divide-gray-100 dark:divide-white/10">
        {quizzes.slice(0, 5).map((q) => (
          <Link key={q.id} href={`/admin/dashboard/quizzes/${q.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-agora-lightblue/50 dark:hover:bg-white/5">
            <div>
              <p className="font-semibold">{q.title}</p>
              <p className="text-xs text-gray-400">{q.question_count} questions</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              q.status === "published" ? "bg-agora-green/15 text-agora-green" : "bg-gray-100 dark:bg-white/10 text-gray-500"
            }`}>
              {q.status}
            </span>
          </Link>
        ))}
        {!loading && quizzes.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">No quizzes created yet.</p>
        )}
      </div>
    </AdminShell>
  );
}
