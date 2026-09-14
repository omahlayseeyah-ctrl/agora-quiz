import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6 font-nunito bg-agora-lightblue dark:bg-agora-dark">
      <div className="card p-8 text-center max-w-sm">
        <h1 className="font-poppins font-extrabold text-3xl text-agora-blue mb-2">404</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-6">
          This page, or quiz link, could not be found. It may have been removed or the link may be incorrect.
        </p>
        <Link href="/" className="btn-primary inline-block">Back to AGORA QUIZ</Link>
      </div>
    </main>
  );
}
