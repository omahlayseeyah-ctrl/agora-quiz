"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import AlertBanner from "@/components/AlertBanner";
import ThemeToggle from "@/components/ThemeToggle";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/student/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      router.push(next);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex flex-col font-nunito">
      <header className="flex justify-between items-center p-4">
        <Link href="/" className="font-poppins font-extrabold text-agora-blue">AGORA QUIZ</Link>
        <ThemeToggle />
      </header>
      <div className="flex-1 flex items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
          <h1 className="font-poppins font-bold text-xl mb-1">Student Login</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-5">Log in to take your quiz.</p>

          {error && <div className="mb-4"><AlertBanner message={error} /></div>}

          <label className="label">Username or Email</label>
          <input className="input mb-4" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />

          <label className="label">Password</label>
          <input className="input mb-6" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <button type="submit" disabled={loading} className="btn-primary w-full mb-3">
            {loading ? "Logging in..." : "Log In"}
          </button>
          <p className="text-center text-sm">
            No account?{" "}
            <Link href={`/student/register?next=${encodeURIComponent(next)}`} className="text-agora-blue font-semibold">
              Register
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
