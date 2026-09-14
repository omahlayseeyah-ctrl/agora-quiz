"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import Timer from "@/components/Timer";
import Calculator from "@/components/Calculator";
import QuestionNav from "@/components/QuestionNav";
import ConfirmModal from "@/components/ConfirmModal";
import AlertBanner from "@/components/AlertBanner";

type Question = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  image_url: string | null;
};

export default function QuizRunner({
  slug,
  attemptData,
}: {
  slug: string;
  attemptData: { attempt: { id: string; endsAt: string }; questions: Question[]; savedAnswers: Record<string, string> };
}) {
  const router = useRouter();
  const { attempt, questions } = attemptData;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(attemptData.savedAnswers || {});
  const [showCalc, setShowCalc] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const current = questions[index];
  const answeredIndexes = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((q, i) => {
      if (answers[q.id]) set.add(i);
    });
    return set;
  }, [answers, questions]);

  const saveAnswer = useCallback(
    (questionId: string, letter: string) => {
      if (saveTimeouts.current[questionId]) clearTimeout(saveTimeouts.current[questionId]);
      saveTimeouts.current[questionId] = setTimeout(async () => {
        try {
          await apiFetch(`/api/attempts/${attempt.id}/answer`, {
            method: "POST",
            body: JSON.stringify({ questionId, selectedAnswer: letter }),
          });
        } catch (err: any) {
          if (err.message?.includes("Time is up")) {
            handleSubmit(true);
          }
        }
      }, 250);
    },
    [attempt.id]
  );

  function selectAnswer(letter: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: letter }));
    saveAnswer(current.id, letter);
  }

  async function handleSubmit(auto = false) {
    setSubmitting(true);
    setError("");
    try {
      await apiFetch(`/api/attempts/${attempt.id}/submit`, { method: "POST" });
      router.replace(`/quiz/${slug}/review?attemptId=${attempt.id}${auto ? "&auto=1" : ""}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const options: { letter: "A" | "B" | "C" | "D"; text: string }[] = current
    ? [
        { letter: "A", text: current.option_a },
        { letter: "B", text: current.option_b },
        { letter: "C", text: current.option_c },
        { letter: "D", text: current.option_d },
      ]
    : [];

  if (!current) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <AlertBanner message="This quiz has no questions." />
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col font-inter pb-6">
      <header className="sticky top-0 z-30 bg-agora-lightblue/90 dark:bg-agora-dark/90 backdrop-blur border-b border-agora-blue/10 dark:border-white/10">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <span className="font-poppins font-bold text-agora-blue text-sm">AGORA QUIZ</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCalc(true)}
              className="h-9 w-9 rounded-lg bg-white dark:bg-white/10 border border-agora-blue/20 flex items-center justify-center text-sm"
              aria-label="Open calculator"
            >
              🧮
            </button>
            <button onClick={() => setShowSubmitConfirm(true)} className="btn-danger !px-3 !py-1.5 text-xs">
              Submit
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 pb-3 max-w-3xl mx-auto">
          <Timer endsAt={attempt.endsAt} onExpire={() => handleSubmit(true)} />
          <span className="text-xs font-nunito text-gray-500 dark:text-gray-300">
            Question {index + 1} of {questions.length}
          </span>
        </div>
      </header>

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-5 space-y-4">
        {error && <AlertBanner message={error} />}

        <div className="card p-5">
          {current.image_url && (
            <img src={current.image_url} alt="Question diagram" className="w-full rounded-lg mb-4 max-h-72 object-contain bg-white" />
          )}
          <p className="font-inter text-base leading-relaxed mb-5">{current.question_text}</p>

          <div className="space-y-2.5">
            {options.map((opt) => {
              const selected = answers[current.id] === opt.letter;
              return (
                <button
                  key={opt.letter}
                  onClick={() => selectAnswer(opt.letter)}
                  className={`w-full text-left rounded-lg border px-4 py-3 text-sm flex items-start gap-3 transition
                    ${selected ? "border-agora-blue bg-agora-blue/10" : "border-gray-200 dark:border-white/10 hover:border-agora-blue/40"}`}
                >
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      selected ? "bg-agora-blue text-white" : "bg-agora-lightblue dark:bg-white/10 text-gray-500"
                    }`}
                  >
                    {opt.letter}
                  </span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="btn-secondary !px-4 !py-2 text-xs disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={index === questions.length - 1}
            className="btn-secondary !px-4 !py-2 text-xs disabled:opacity-40"
          >
            Next →
          </button>
        </div>

        <QuestionNav
          total={questions.length}
          currentIndex={index}
          answeredIndexes={answeredIndexes}
          onJump={(i) => setIndex(i)}
        />
      </div>

      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}

      {showSubmitConfirm && (
        <ConfirmModal
          title="Are you sure you want to submit your quiz?"
          message={`You have answered ${answeredIndexes.size} of ${questions.length} questions. This cannot be undone.`}
          onCancel={() => setShowSubmitConfirm(false)}
          onConfirm={() => {
            setShowSubmitConfirm(false);
            handleSubmit(false);
          }}
        />
      )}

      {submitting && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="card px-6 py-4 font-nunito text-sm">Submitting your quiz...</div>
        </div>
      )}
    </main>
  );
}
