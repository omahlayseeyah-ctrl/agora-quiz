"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import LoadingScreen from "@/components/LoadingScreen";
import ThemeToggle from "@/components/ThemeToggle";
import AlertBanner from "@/components/AlertBanner";

const NAV = [
  { href: "/admin/dashboard", label: "Overview", icon: "📊" },
  { href: "/admin/dashboard/quizzes", label: "Quizzes", icon: "📝" },
  { href: "/admin/dashboard/subjects", label: "Subjects", icon: "📚" },
  { href: "/admin/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen message="Loading admin dashboard..." />}>
      <AdminShellInner>{children}</AdminShellInner>
    </Suspense>
  );
}

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);
  const [showForceChange, setShowForceChange] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/auth/admin/me");
        setAdmin(res.admin);
        if (res.admin.mustChangePassword || search.get("forcePasswordChange") === "1") {
          setShowForceChange(true);
        }
      } catch {
        router.replace("/admin/login");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await apiFetch("/api/auth/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
  }

  if (loading) return <LoadingScreen message="Loading admin dashboard..." />;
  if (!admin) return null;

  return (
    <div className="min-h-dvh flex font-nunito">
      <aside className="hidden sm:flex flex-col w-56 bg-agora-dark text-white p-4 gap-1">
        <div className="font-poppins font-extrabold text-agora-skyblue mb-6 px-2">AGORA QUIZ</div>
        {NAV.map((item) => {
          const active = item.href === "/admin/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition ${
                active ? "bg-agora-blue text-white" : "text-white/70 hover:bg-white/10"
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          );
        })}
        <button onClick={logout} className="mt-auto flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-agora-red/90 hover:bg-white/10">
          🚪 Log Out
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex sm:hidden items-center justify-between p-4 bg-agora-dark text-white">
          <span className="font-poppins font-extrabold text-agora-skyblue text-sm">AGORA QUIZ Admin</span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={logout} className="text-xs text-agora-red">Log Out</button>
          </div>
        </header>
        <div className="hidden sm:flex justify-end p-4"><ThemeToggle /></div>

        <nav className="flex sm:hidden gap-1 overflow-x-auto px-3 pb-3 bg-agora-dark text-white">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-white/10">
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>

      {showForceChange && <ForceChangePasswordModal onDone={() => setShowForceChange(false)} />}
    </div>
  );
}

function ForceChangePasswordModal({ onDone }: { onDone: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/admin/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      onDone();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
        <h2 className="font-poppins font-bold text-lg mb-1">Change Your Password</h2>
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
          For security, you must set a new password before continuing.
        </p>
        {error && <div className="mb-4"><AlertBanner message={error} /></div>}
        <label className="label">Current Password</label>
        <input className="input mb-3" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        <label className="label">New Password</label>
        <input className="input mb-3" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
        <label className="label">Confirm New Password</label>
        <input className="input mb-5" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Saving..." : "Save New Password"}
        </button>
      </form>
    </div>
  );
}
