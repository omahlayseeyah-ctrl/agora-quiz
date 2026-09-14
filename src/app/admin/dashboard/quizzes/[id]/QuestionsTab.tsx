"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import AlertBanner from "@/components/AlertBanner";

type Question = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
  image_url: string | null;
  subject_id: string | null;
};

export default function QuestionsTab({ quizId, subjects }: { quizId: string; subjects: any[] }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "add" | "import">("list");

  function load() {
    apiFetch(`/api/quizzes/${quizId}/questions`).then((res) => setQuestions(res.questions)).finally(() => setLoading(false));
  }
  useEffect(load, [quizId]);

  async function deleteQuestion(qid: string) {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    await apiFetch(`/api/quizzes/${quizId}/questions/${qid}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-300 font-nunito">{questions.length} question(s)</p>
        <div className="flex gap-2">
          <button onClick={() => setMode(mode === "add" ? "list" : "add")} className="btn-secondary text-xs !py-1.5 !px-3">
            {mode === "add" ? "Cancel" : "+ Add Question"}
          </button>
          <button onClick={() => setMode(mode === "import" ? "list" : "import")} className="btn-primary text-xs !py-1.5 !px-3">
            {mode === "import" ? "Cancel" : "Import CSV"}
          </button>
        </div>
      </div>

      {mode === "add" && (
        <AddQuestionForm
          quizId={quizId}
          subjects={subjects}
          onAdded={() => {
            setMode("list");
            load();
          }}
        />
      )}

      {mode === "import" && (
        <CsvImportForm
          quizId={quizId}
          subjects={subjects}
          onImported={() => {
            setMode("list");
            load();
          }}
        />
      )}

      {mode === "list" && (
        <div className="space-y-3">
          {loading && <p className="text-sm text-gray-400">Loading...</p>}
          {!loading && questions.length === 0 && (
            <div className="card p-6 text-center text-sm text-gray-400 font-nunito">
              No questions yet. Add one manually or import a CSV.
            </div>
          )}
          {questions.map((q, i) => (
            <div key={q.id} className="card p-4 font-nunito">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">
                  <span className="text-agora-blue mr-1">Q{i + 1}.</span>
                  {q.question_text}
                </p>
                <button onClick={() => deleteQuestion(q.id)} className="text-agora-red text-xs flex-shrink-0">Delete</button>
              </div>
              {q.image_url && <img src={q.image_url} alt="diagram" className="max-h-32 rounded-lg mt-2 mb-2 bg-white" />}
              <div className="grid grid-cols-2 gap-1.5 mt-2 text-xs">
                {(["A", "B", "C", "D"] as const).map((letter) => (
                  <div
                    key={letter}
                    className={`px-2 py-1.5 rounded-md ${
                      q.correct_answer === letter ? "bg-agora-green/15 text-agora-green font-semibold" : "bg-agora-lightblue dark:bg-white/10 text-gray-500"
                    }`}
                  >
                    {letter}. {q[`option_${letter.toLowerCase()}` as "option_a"]}
                  </div>
                ))}
              </div>
              {q.explanation && <p className="text-xs text-gray-400 mt-2">💡 {q.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddQuestionForm({ quizId, subjects, onAdded }: { quizId: string; subjects: any[]; onAdded: () => void }) {
  const [form, setForm] = useState({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    explanation: "",
    subjectId: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setError("");
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const res = await fetch("/api/upload/image", { method: "POST", body: fd, credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Image upload failed.");
        imageUrl = data.url;
      }
      await apiFetch(`/api/quizzes/${quizId}/questions`, {
        method: "POST",
        body: JSON.stringify({ ...form, imageUrl, subjectId: form.subjectId || undefined }),
      });
      onAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 mb-4 font-nunito">
      {error && <div className="mb-4"><AlertBanner message={error} /></div>}

      <label className="label">Question</label>
      <textarea className="input mb-3" rows={2} value={form.questionText} onChange={(e) => update("questionText", e.target.value)} required />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="label">Option A</label><input className="input" value={form.optionA} onChange={(e) => update("optionA", e.target.value)} required /></div>
        <div><label className="label">Option B</label><input className="input" value={form.optionB} onChange={(e) => update("optionB", e.target.value)} required /></div>
        <div><label className="label">Option C</label><input className="input" value={form.optionC} onChange={(e) => update("optionC", e.target.value)} required /></div>
        <div><label className="label">Option D</label><input className="input" value={form.optionD} onChange={(e) => update("optionD", e.target.value)} required /></div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="label">Correct Answer</label>
          <select className="input" value={form.correctAnswer} onChange={(e) => update("correctAnswer", e.target.value)}>
            {["A", "B", "C", "D"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Subject (optional)</label>
          <select className="input" value={form.subjectId} onChange={(e) => update("subjectId", e.target.value)}>
            <option value="">None</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <label className="label">Explanation (optional)</label>
      <textarea className="input mb-3" rows={2} value={form.explanation} onChange={(e) => update("explanation", e.target.value)} />

      <label className="label">Diagram / Image (optional)</label>
      <input type="file" accept="image/*" className="input mb-4" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />

      <button type="submit" disabled={uploading} className="btn-primary">
        {uploading ? "Saving..." : "Add Question"}
      </button>
    </form>
  );
}

function CsvImportForm({ quizId, subjects, onImported }: { quizId: string; subjects: any[]; onImported: () => void }) {
  const [csvText, setCsvText] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function runPreview() {
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch(`/api/quizzes/${quizId}/questions/import`, {
        method: "POST",
        body: JSON.stringify({ csvText, subjectId: subjectId || undefined, previewOnly: true }),
      });
      setPreview(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/quizzes/${quizId}/questions/import`, {
        method: "POST",
        body: JSON.stringify({ csvText, subjectId: subjectId || undefined, previewOnly: false }),
      });
      onImported();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5 mb-4 font-nunito">
      <p className="text-xs text-gray-400 mb-3">
        Columns in order: <strong>Question, Option A, Option B, Option C, Option D, Correct Answer, Explanation</strong>. A header row is optional.
      </p>

      {error && <div className="mb-4"><AlertBanner message={error} /></div>}

      <label className="label">Subject for imported questions (optional)</label>
      <select className="input mb-3" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
        <option value="">None</option>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <label className="label">Upload CSV file</label>
      <input
        type="file"
        accept=".csv,text/csv"
        className="input mb-3"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <label className="label">...or paste CSV content</label>
      <textarea className="input mb-4 font-mono text-xs" rows={6} value={csvText} onChange={(e) => setCsvText(e.target.value)} />

      {!preview ? (
        <button onClick={runPreview} disabled={busy || !csvText.trim()} className="btn-secondary">
          {busy ? "Checking..." : "Preview Import"}
        </button>
      ) : (
        <div>
          <div className="mb-3">
            <AlertBanner
              type={preview.errors?.length ? "info" : "success"}
              message={`${preview.totalValid} of ${preview.totalRows} rows are valid.${preview.errors?.length ? ` ${preview.errors.length} row(s) have errors and will be skipped.` : ""}`}
            />
          </div>
          {preview.errors?.length > 0 && (
            <ul className="text-xs text-agora-red mb-3 list-disc list-inside max-h-24 overflow-y-auto">
              {preview.errors.slice(0, 10).map((e: any, i: number) => (
                <li key={i}>Row {e.row}: {e.message}</li>
              ))}
            </ul>
          )}
          <div className="max-h-48 overflow-y-auto mb-4 space-y-2">
            {preview.preview.slice(0, 5).map((q: any, i: number) => (
              <div key={i} className="bg-agora-lightblue dark:bg-white/10 rounded-lg p-3 text-xs">
                <p className="font-semibold">{q.question_text}</p>
                <p className="text-gray-400">Correct: {q.correct_answer}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPreview(null)} className="btn-secondary flex-1">Back</button>
            <button onClick={confirmImport} disabled={busy || preview.totalValid === 0} className="btn-primary flex-1">
              {busy ? "Importing..." : `Import ${preview.totalValid} Questions`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
