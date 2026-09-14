"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import AdminShell from "@/components/AdminShell";
import AlertBanner from "@/components/AlertBanner";

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  function load() {
    apiFetch("/api/subjects").then((res) => setSubjects(res.subjects)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function addSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setError("");
    try {
      await apiFetch("/api/subjects", { method: "POST", body: JSON.stringify({ name }) });
      setName("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <AdminShell>
      <h1 className="font-poppins font-bold text-2xl mb-6">Subjects</h1>

      <form onSubmit={addSubject} className="card p-4 flex gap-3 mb-6 max-w-md font-nunito">
        <input className="input" placeholder="New subject name" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" disabled={adding} className="btn-primary whitespace-nowrap">Add Subject</button>
      </form>

      {error && <div className="mb-4 max-w-md"><AlertBanner message={error} /></div>}

      <div className="card divide-y divide-gray-100 dark:divide-white/10 max-w-md">
        {loading && <p className="px-4 py-4 text-sm text-gray-400">Loading...</p>}
        {!loading && subjects.map((s) => (
          <div key={s.id} className="px-4 py-3 text-sm font-nunito">{s.name}</div>
        ))}
        {!loading && subjects.length === 0 && <p className="px-4 py-4 text-sm text-gray-400">No subjects yet.</p>}
      </div>
    </AdminShell>
  );
}
