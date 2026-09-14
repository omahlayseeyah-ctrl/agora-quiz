"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import AlertBanner from "@/components/AlertBanner";
import ThemeToggle from "@/components/ThemeToggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      router.push(res.admin.mustChangePassword ? "/admin/dashboard?forcePasswordChange=1" : "/admin/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex flex-col font-nunito bg-agora-dark text-white">
      <header className="flex justify-between items-center p-4">
        <Link href="/" className="font-poppins font-extrabold text-agora-skyblue">AGORA QUIZ</Link>
        <ThemeToggle />
      </header>
      <div className="flex-1 flex items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl2 w-full max-w-sm p-6">
          <h1 className="font-poppins font-bold text-xl mb-1">Administrator Login</h1>
          <p className="text-sm text-white/60 mb-5">Manage quizzes, subjects and platform settings.</p>

          {error && <div className="mb-4"><AlertBanner message={error} /></div>}

          <label className="label !text-white/60">Username</label>
          <input className="input mb-4 !bg-white/10 !border-white/20 !text-white" value={username} onChange={(e) => setUsername(e.target.value)} required />

          <label className="label !text-white/60">Password</label>
          <input className="input mb-6 !bg-white/10 !border-white/20 !text-white" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
