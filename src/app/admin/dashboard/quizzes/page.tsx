"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import AlertBanner from "@/components/AlertBanner";

export default function AdminQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  function load() {
    Promise.all([apiFetch("/api/quizzes"), apiFetch("/api/subjects")]).then(([q, s]) => {
      setQuizzes(q.quizzes);
      setSubjects(s.subjects);
    }).finally(() => setLoading(false));
  }
  useEffect(load, []);

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-poppins font-bold text-2xl">Quizzes</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">+ New Quiz</button>
      </div>

      <div className="card divide-y divide-gray-100 dark:divide-white/10">
        {loading && <p className="px-4 py-6 text-sm text-gray-400 text-center">Loading...</p>}
        {!loading && quizzes.map((q) => (
          <Link key={q.id} href={`/admin/dashboard/quizzes/${q.id}`} className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-agora-lightblue/50 dark:hover:bg-white/5">
            <div className="min-w-0">
              <p className="font-semibold truncate">{q.title}</p>
              <p className="text-xs text-gray-400">
                {(q.subjects || []).map((s: any) => s?.name).filter(Boolean).join(", ") || "No subjects"} · {q.question_count} questions
              </p>
            </div>
            <span className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ml-3 ${
              q.status === "published" ? "bg-agora-green/15 text-agora-green" :
              q.status === "archived" ? "bg-agora-red/15 text-agora-red" : "bg-gray-100 dark:bg-white/10 text-gray-500"
            }`}>
              {q.status}
            </span>
            {q.is_premium && (
              <span className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ml-2 bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                👑 Premium
              </span>
            )}
          </Link>
        ))}
        {!loading && quizzes.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">No quizzes yet. Create your first one.</p>
        )}
      </div>

      {showCreate && (
        <CreateQuizModal
          subjects={subjects}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => router.push(`/admin/dashboard/quizzes/${id}`)}
        />
      )}
    </AdminShell>
  );
}

function CreateQuizModal({
  subjects,
  onClose,
  onCreated,
}: {
  subjects: any[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [attemptLimit, setAttemptLimit] = useState<string>("1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleSubject(id: string) {
    setSubjectIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/quizzes", {
        method: "POST",
        body: JSON.stringify({
          title,
          subjectIds,
          durationMinutes,
          attemptLimit: attemptLimit === "unlimited" ? "unlimited" : Number(attemptLimit),
        }),
      });
      onCreated(res.quiz.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-md p-6 font-nunito max-h-[90vh] overflow-y-auto">
        <h2 className="font-poppins font-bold text-lg mb-4">Create Quiz</h2>
        {error && <div className="mb-4"><AlertBanner message={error} /></div>}

        <label className="label">Quiz Title</label>
        <input className="input mb-4" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label className="label">Subjects</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {subjects.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => toggleSubject(s.id)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                subjectIds.includes(s.id) ? "bg-agora-blue text-white border-agora-blue" : "border-gray-300 dark:border-white/20 text-gray-500"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="label">Duration (minutes)</label>
            <input type="number" min={1} className="input" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Attempt Limit</label>
            <select className="input" value={attemptLimit} onChange={(e) => setAttemptLimit(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>{n} attempt{n > 1 ? "s" : ""}</option>
              ))}
              <option value="unlimited">Unlimited</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? "Creating..." : "Create"}</button>
        </div>
      </form>
    </div>
  );
}
