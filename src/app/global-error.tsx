"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="min-h-dvh flex items-center justify-center px-6 font-nunito bg-agora-lightblue">
        <div className="card p-8 text-center max-w-sm">
          <h1 className="font-poppins font-bold text-xl text-agora-red mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-500 mb-6">
            An unexpected error occurred. Please try again — if the problem continues, contact the administrator.
          </p>
          <button onClick={() => reset()} className="btn-primary">Try Again</button>
        </div>
      </body>
    </html>
  );
}
