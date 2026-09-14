"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import AlertBanner from "@/components/AlertBanner";
import SettingsTab from "./SettingsTab";
import QuestionsTab from "./QuestionsTab";
import LeaderboardTab from "./LeaderboardTab";

const TABS = ["Questions", "Settings", "Leaderboard"] as const;

export default function QuizEditorPage() {
  const params = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Questions");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  function load() {
    Promise.all([apiFetch(`/api/quizzes/${params.id}`), apiFetch("/api/subjects")])
      .then(([q, s]) => {
        setQuiz(q.quiz);
        setSubjects(s.subjects);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [params.id]);

  const quizLink = quiz && typeof window !== "undefined" ? `${window.location.origin}/quiz/${quiz.slug}` : "";

  async function togglePublish() {
    setPublishing(true);
    setError("");
    try {
      const publish = quiz.status !== "published";
      const res = await apiFetch(`/api/quizzes/${params.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ publish }),
      });
      setQuiz((q: any) => ({ ...q, status: res.status }));
      setMessage(publish ? "Quiz published! Share the link with students." : "Quiz unpublished.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(quizLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  if (loading) {
    return (
      <AdminShell>
        <p className="text-sm text-gray-400">Loading quiz...</p>
      </AdminShell>
    );
  }

  if (!quiz) {
    return (
      <AdminShell>
        <AlertBanner message={error || "Quiz not found."} />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <h1 className="font-poppins font-bold text-2xl">{quiz.title}</h1>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
            quiz.status === "published" ? "bg-agora-green/15 text-agora-green" : "bg-gray-100 dark:bg-white/10 text-gray-500"
          }`}>
            {quiz.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={togglePublish} disabled={publishing} className={quiz.status === "published" ? "btn-secondary text-sm" : "btn-primary text-sm"}>
            {publishing ? "Saving..." : quiz.status === "published" ? "Unpublish" : "Publish Quiz"}
          </button>
        </div>
      </div>

      {quiz.status === "published" && (
        <div className="card p-3 flex items-center gap-3 mb-4 font-nunito text-sm">
          <span className="text-gray-400 flex-shrink-0">Quiz Link:</span>
          <code className="truncate flex-1 text-agora-blue">{quizLink}</code>
          <button onClick={copyLink} className="btn-secondary !py-1.5 !px-3 text-xs flex-shrink-0">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {message && <div className="mb-4"><AlertBanner type="success" message={message} /></div>}
      {error && <div className="mb-4"><AlertBanner message={error} /></div>}

      <div className="flex gap-2 mb-5 border-b border-gray-200 dark:border-white/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === t ? "border-agora-blue text-agora-blue" : "border-transparent text-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Questions" && <QuestionsTab quizId={params.id} subjects={subjects} />}
      {tab === "Settings" && <SettingsTab quiz={quiz} subjects={subjects} onSaved={load} />}
      {tab === "Leaderboard" && <LeaderboardTab quizId={params.id} />}
    </AdminShell>
  );
}
