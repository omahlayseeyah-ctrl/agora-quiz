"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import AlertBanner from "@/components/AlertBanner";
import ThemeToggle from "@/components/ThemeToggle";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/student/register", { method: "POST", body: JSON.stringify(form) });
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
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
          <h1 className="font-poppins font-bold text-xl mb-1">Create Student Account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-5">Register once to take any quiz link.</p>

          {error && <div className="mb-4"><AlertBanner message={error} /></div>}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="label">First name</label>
              <input className="input" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
            </div>
            <div>
              <label className="label">Last name</label>
              <input className="input" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
            </div>
          </div>

          <label className="label">Username</label>
          <input className="input mb-4" value={form.username} onChange={(e) => update("username", e.target.value)} required />

          <label className="label">Phone number</label>
          <input className="input mb-4" value={form.phoneNumber} onChange={(e) => update("phoneNumber", e.target.value)} required />

          <label className="label">Gmail / Email</label>
          <input className="input mb-4" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />

          <label className="label">Password</label>
          <input className="input mb-6" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={6} />

          <button type="submit" disabled={loading} className="btn-primary w-full mb-3">
            {loading ? "Creating account..." : "Register"}
          </button>
          <p className="text-center text-sm">
            Already registered?{" "}
            <Link href={`/student/login?next=${encodeURIComponent(next)}`} className="text-agora-blue font-semibold">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function StudentRegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
