"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import LoadingScreen from "@/components/LoadingScreen";
import AlertBanner from "@/components/AlertBanner";
import ThemeToggle from "@/components/ThemeToggle";
import ReviewQuestionNav from "@/components/ReviewQuestionNav";

function ReviewContent() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const attemptId = search.get("attemptId");
  const auto = search.get("auto") === "1";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (!attemptId) {
      setError("Missing attempt reference.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await apiFetch(`/api/attempts/${attemptId}/review`);
        setData(res);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  if (loading) return <LoadingScreen message="Loading your results..." />;

  if (error) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="card p-6 max-w-sm text-center">
          <AlertBanner message={error} />
          <Link href="/" className="btn-secondary inline-block mt-5">Back Home</Link>
        </div>
      </main>
    );
  }

  if (data?.resultsHidden) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 font-nunito">
        <div className="card p-6 max-w-sm text-center">
          <h1 className="font-poppins font-bold text-lg mb-2">Quiz Submitted ✅</h1>
          {auto && <p className="text-xs text-agora-blue mb-2">Time ran out — your quiz was submitted automatically.</p>}
          <p className="text-sm text-gray-500 dark:text-gray-300">{data.message}</p>
          <Link href="/" className="btn-secondary inline-block mt-5">Back Home</Link>
        </div>
      </main>
    );
  }

  const review = data?.review || [];
  const q = review[index];

  return (
    <main className="min-h-dvh flex flex-col font-inter pb-6">
      <header className="flex justify-between items-center p-4">
        <span className="font-poppins font-extrabold text-agora-blue text-sm">AGORA QUIZ</span>
        <ThemeToggle />
      </header>

      <div className="max-w-2xl w-full mx-auto px-4">
        <div className="card p-5 mb-4 text-center">
          <h1 className="font-poppins font-bold text-lg mb-1">{data.quizTitle}</h1>
          {auto && <p className="text-xs text-agora-blue mb-2">Time ran out — your quiz was submitted automatically.</p>}
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div className="bg-agora-lightblue dark:bg-white/10 rounded-lg py-3">
              <p className="font-bold text-agora-blue">{data.attempt.score}/{data.attempt.totalQuestions}</p>
              <p className="text-gray-500 dark:text-gray-300">Score</p>
            </div>
            <div className="bg-agora-green/10 rounded-lg py-3">
              <p className="font-bold text-agora-green">{data.attempt.correctCount}</p>
              <p className="text-gray-500 dark:text-gray-300">Correct</p>
            </div>
            <div className="bg-agora-red/10 rounded-lg py-3">
              <p className="font-bold text-agora-red">{data.attempt.incorrectCount}</p>
              <p className="text-gray-500 dark:text-gray-300">Incorrect</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Overall: {data.attempt.percentage}%</p>
        </div>

        {review.length > 0 && (
          <div className="mb-4">
            <ReviewQuestionNav
              total={review.length}
              currentIndex={index}
              correctness={review.map((q: any) => q.isCorrect)}
              onJump={(i) => { setIndex(i); setShowExplanation(false); }}
            />
          </div>
        )}

        {q && (
          <div className="card p-5 font-nunito">
            <p className="text-xs text-gray-400 mb-2">Question {index + 1} of {review.length}</p>
            <p className="font-inter text-base mb-4">{q.questionText}</p>
            {q.imageUrl && <img src={q.imageUrl} alt="diagram" className="w-full rounded-lg mb-4 max-h-64 object-contain bg-white" />}

            <div className="space-y-2.5 mb-4">
              {(["A", "B", "C", "D"] as const).map((letter) => {
                const text = q[`option${letter}` as "optionA"];
                const isCorrect = letter === q.correctAnswer;
                const isSelected = letter === q.selectedAnswer;
                let style = "border-gray-200 dark:border-white/10";
                if (isCorrect) style = "border-agora-green bg-agora-green/10";
                if (isSelected && !isCorrect) style = "border-agora-red bg-agora-red/10";
                return (
                  <div key={letter} className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-3 ${style}`}>
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white/60 dark:bg-black/20">
                      {letter}
                    </span>
                    <span className="flex-1">{text}</span>
                    {isCorrect && <span className="text-agora-green text-xs font-bold">✓ Correct</span>}
                    {isSelected && !isCorrect && <span className="text-agora-red text-xs font-bold">✗ Your answer</span>}
                  </div>
                );
              })}
            </div>

            {q.explanation ? (
              <>
                {!showExplanation ? (
                  <button onClick={() => setShowExplanation(true)} className="btn-secondary w-full text-sm">
                    View Explanation
                  </button>
                ) : (
                  <div className="bg-agora-lightblue dark:bg-white/10 rounded-lg p-4 text-sm">
                    <p className="font-semibold text-agora-blue mb-1">Explanation</p>
                    <p className="text-gray-600 dark:text-gray-300">{q.explanation}</p>
                  </div>
                )}
              </>
            ) : (
              data.explanationsVisible === false && (
                <p className="text-xs text-gray-400 text-center">Explanations are not available for this quiz.</p>
              )
            )}

            <div className="flex items-center justify-between gap-3 mt-5">
              <button
                onClick={() => { setIndex((i) => Math.max(0, i - 1)); setShowExplanation(false); }}
                disabled={index === 0}
                className="btn-secondary !px-4 !py-2 text-xs disabled:opacity-40"
              >
                ← Previous
              </button>
              <button
                onClick={() => { setIndex((i) => Math.min(review.length - 1, i + 1)); setShowExplanation(false); }}
                disabled={index === review.length - 1}
                className="btn-primary !px-4 !py-2 text-xs disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <Link href={`/quiz/${params.slug}/leaderboard`} className="btn-secondary flex-1 text-center text-sm">
            🏆 Leaderboard
          </Link>
          <Link href="/" className="btn-secondary flex-1 text-center text-sm">
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ReviewContent />
    </Suspense>
  );
}
