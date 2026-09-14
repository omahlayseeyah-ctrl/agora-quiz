"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import AlertBanner from "@/components/AlertBanner";

function VisibilityToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "public" | "private";
  onChange: (v: "public" | "private") => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex rounded-lg overflow-hidden border border-agora-blue/20">
        {(["private", "public"] as const).map((opt) => (
          <button
            type="button"
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 text-xs font-semibold capitalize ${
              value === opt ? "bg-agora-blue text-white" : "bg-white dark:bg-white/5 text-gray-500"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsTab({ quiz, subjects, onSaved }: { quiz: any; subjects: any[]; onSaved: () => void }) {
  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description || "");
  const [durationMinutes, setDurationMinutes] = useState(quiz.duration_minutes);
  const [attemptLimit, setAttemptLimit] = useState<string>(quiz.attempt_limit === null ? "unlimited" : String(quiz.attempt_limit));
  const [resultsVisibility, setResultsVisibility] = useState(quiz.results_visibility);
  const [explanationsVisibility, setExplanationsVisibility] = useState(quiz.explanations_visibility);
  const [leaderboardVisibility, setLeaderboardVisibility] = useState(quiz.leaderboard_visibility);
  const [shuffleQuestions, setShuffleQuestions] = useState(quiz.shuffle_questions);
  const [isPremium, setIsPremium] = useState(quiz.is_premium || false);
  const [subjectIds, setSubjectIds] = useState<string[]>(quiz.subjectIds || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function toggleSubject(id: string) {
    setSubjectIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiFetch(`/api/quizzes/${quiz.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description,
          durationMinutes,
          attemptLimit: attemptLimit === "unlimited" ? "unlimited" : Number(attemptLimit),
          resultsVisibility,
          explanationsVisibility,
          leaderboardVisibility,
          shuffleQuestions,
          isPremium,
          subjectIds,
        }),
      });
      setMessage("Quiz settings saved.");
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card p-6 max-w-xl font-nunito">
      {message && <div className="mb-4"><AlertBanner type="success" message={message} /></div>}
      {error && <div className="mb-4"><AlertBanner message={error} /></div>}

      <label className="label">Quiz Title</label>
      <input className="input mb-4" value={title} onChange={(e) => setTitle(e.target.value)} required />

      <label className="label">Description (optional)</label>
      <textarea className="input mb-4" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

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

      <div className="grid grid-cols-2 gap-3 mb-4">
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

      <label className="flex items-center gap-2 mb-2 text-sm">
        <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />
        Shuffle question order for each student
      </label>

      <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/40 p-3 mb-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
          <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
          👑 Premium quiz (paid access)
        </label>
        <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1.5 ml-6">
          When enabled, students cannot start this quiz directly. They'll see a message asking them to
          contact you on WhatsApp (your configured contact number) to pay and unlock access.
        </p>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-white/10 mt-4 mb-6">
        <VisibilityToggle label="Results Visibility" value={resultsVisibility} onChange={setResultsVisibility} />
        <VisibilityToggle label="Explanations Visibility" value={explanationsVisibility} onChange={setExplanationsVisibility} />
        <VisibilityToggle label="Leaderboard Visibility" value={leaderboardVisibility} onChange={setLeaderboardVisibility} />
      </div>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
