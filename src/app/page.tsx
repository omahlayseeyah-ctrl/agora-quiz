import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col">
      <header className="flex justify-end p-4">
        <ThemeToggle />
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="flex items-end gap-1 mb-1">
          <span className="font-poppins font-extrabold text-5xl sm:text-6xl text-agora-black dark:text-white">
            AGORA
          </span>
        </div>
        <div className="flex items-center gap-3 mb-8">
          <span className="h-px w-8 bg-agora-blue/50" />
          <span className="font-poppins font-bold text-xl tracking-[0.3em] text-agora-blue">QUIZ</span>
          <span className="h-px w-8 bg-agora-blue/50" />
        </div>
        <p className="font-nunito text-sm text-gray-500 dark:text-gray-300 max-w-xs mb-10">
          The online quiz platform. Students take quizzes shared by their teacher. Administrators create and manage them.
        </p>

        <div className="w-full max-w-xs flex flex-col gap-3">
          <Link href="/student/login" className="btn-primary text-center">
            Student Login
          </Link>
          <Link href="/student/register" className="btn-secondary text-center">
            Create Student Account
          </Link>
          <Link
            href="/admin/login"
            className="text-xs text-gray-400 hover:text-agora-blue mt-4 font-nunito"
          >
            Administrator sign in →
          </Link>
        </div>
      </div>
      <footer className="text-center text-[11px] text-agora-red/80 font-nunito py-4">
        © {new Date().getFullYear()} AGORA QUIZ. All rights reserved.
      </footer>
    </main>
  );
}
