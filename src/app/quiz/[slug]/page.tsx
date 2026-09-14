"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import LoadingScreen from "@/components/LoadingScreen";
import AlertBanner from "@/components/AlertBanner";
import ThemeToggle from "@/components/ThemeToggle";
import QuizRunner from "./QuizRunner";

type Stage = "loading" | "premium" | "instructions" | "ready" | "taking" | "error";

export default function QuizEntryPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [stage, setStage] = useState<Stage>("loading");
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<{ whatsapp_channel_link?: string; contact_phone_number?: string }>({});
  const [joinedChannel, setJoinedChannel] = useState(false);
  const [quizInfo, setQuizInfo] = useState<any>(null);
  const [attemptData, setAttemptData] = useState<any>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiFetch("/api/auth/student/me").catch(() => null);
        if (!me) {
          router.replace(`/student/login?next=${encodeURIComponent(`/quiz/${slug}`)}`);
          return;
        }

        const [settingsRes, quizRes] = await Promise.all([
          apiFetch("/api/settings"),
          apiFetch(`/api/quizzes/slug/${slug}`).catch((e: Error) => ({ error: e.message })),
        ]);
        setSettings(settingsRes.settings || {});

        if (quizRes.error) {
          setError(quizRes.error);
          setStage("error");
          return;
        }
        setQuizInfo(quizRes);

        if (quizRes.quiz.isPremium) {
          setStage("premium");
          return;
        }

        if (!me.student.hasSeenWhatsappInstructions) {
          setStage("instructions");
        } else {
          setStage("ready");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
        setStage("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleStartAfterInstructions() {
    await apiFetch("/api/auth/student/seen-instructions", { method: "POST" }).catch(() => {});
    setStage("ready");
  }

  async function beginQuiz() {
    setStarting(true);
    setError("");
    try {
      const res = await apiFetch("/api/attempts/start", {
        method: "POST",
        body: JSON.stringify({ quizId: quizInfo.quiz.id }),
      });
      setAttemptData(res);
      setStage("taking");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  }

  if (stage === "loading") return <LoadingScreen message="Preparing your quiz..." />;

  if (stage === "premium") {
    return (
      <main className="min-h-dvh flex flex-col font-nunito">
        <header className="flex justify-between items-center p-4">
          <span className="font-poppins font-extrabold text-agora-blue">AGORA QUIZ</span>
          <ThemeToggle />
        </header>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="card w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-3">👑</div>
            <h1 className="font-poppins font-bold text-lg mb-1">Premium Quiz</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-5">
              {quizInfo?.quiz?.title ? `"${quizInfo.quiz.title}" is` : "This quiz is"} a premium quiz. Contact us
              on WhatsApp to arrange payment and get access.
            </p>
            {settings.contact_phone_number ? (
              <a
                href={`https://wa.me/${settings.contact_phone_number.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full inline-block text-center mb-3"
              >
                💬 Contact Us on WhatsApp
              </a>
            ) : (
              <AlertBanner type="info" message="The administrator hasn't set up a contact number yet." />
            )}
            <Link href="/" className="btn-secondary w-full inline-block text-center">
              Back Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (stage === "error") {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="card p-6 max-w-sm w-full text-center">
          <h1 className="font-poppins font-bold text-lg mb-2 text-agora-red">Quiz Unavailable</h1>
          <AlertBanner message={error} />
          <Link href="/" className="btn-secondary inline-block mt-5">Back Home</Link>
        </div>
      </main>
    );
  }

  if (stage === "instructions") {
    return (
      <main className="min-h-dvh flex flex-col font-nunito">
        <header className="flex justify-between items-center p-4">
          <span className="font-poppins font-extrabold text-agora-blue">AGORA QUIZ</span>
          <ThemeToggle />
        </header>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="card w-full max-w-md p-6">
            <h1 className="font-poppins font-bold text-lg mb-4 text-center">Follow the instruction below.</h1>
            <ol className="list-decimal list-inside space-y-2 text-sm mb-6 text-gray-600 dark:text-gray-300">
              <li>Click Join WhatsApp Channel.</li>
              <li>Join or follow the channel on WhatsApp.</li>
              <li>Return to the website.</li>
              <li>The Start button will appear.</li>
              <li>Click the Start button to begin.</li>
            </ol>

            {settings.whatsapp_channel_link ? (
              <a
                href={settings.whatsapp_channel_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setJoinedChannel(true)}
                className="btn-primary w-full text-center block mb-4"
              >
                Join WhatsApp Channel
              </a>
            ) : (
              <div className="mb-4">
                <AlertBanner type="info" message="The administrator has not configured a WhatsApp channel link yet." />
              </div>
            )}

            {joinedChannel || !settings.whatsapp_channel_link ? (
              <button onClick={handleStartAfterInstructions} className="btn-secondary w-full">
                Start
              </button>
            ) : (
              <p className="text-center text-xs text-gray-400">Click Join WhatsApp Channel above, then the Start button will appear here.</p>
            )}

            {settings.contact_phone_number && (
              <p className="text-center text-xs text-gray-400 mt-5">
                Any complaints?{" "}
                <a href={`tel:${settings.contact_phone_number}`} className="text-agora-blue font-semibold">
                  Contact us
                </a>
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (stage === "ready") {
    const q = quizInfo.quiz;
    return (
      <main className="min-h-dvh flex flex-col font-nunito">
        <header className="flex justify-between items-center p-4">
          <span className="font-poppins font-extrabold text-agora-blue">AGORA QUIZ</span>
          <ThemeToggle />
        </header>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="card w-full max-w-md p-6 text-center">
            <h1 className="font-poppins font-bold text-xl mb-1">{q.title}</h1>
            {q.subjects?.length > 0 && (
              <p className="text-xs text-agora-blue font-semibold mb-3">
                {q.subjects.map((s: any) => s.name).join(" + ")}
              </p>
            )}
            {q.description && <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">{q.description}</p>}

            <div className="grid grid-cols-3 gap-2 mb-5 text-xs">
              <div className="bg-agora-lightblue dark:bg-white/10 rounded-lg py-3">
                <p className="font-bold text-agora-blue">{q.questionCount}</p>
                <p className="text-gray-500 dark:text-gray-300">Questions</p>
              </div>
              <div className="bg-agora-lightblue dark:bg-white/10 rounded-lg py-3">
                <p className="font-bold text-agora-blue">{q.durationMinutes} min</p>
                <p className="text-gray-500 dark:text-gray-300">Duration</p>
              </div>
              <div className="bg-agora-lightblue dark:bg-white/10 rounded-lg py-3">
                <p className="font-bold text-agora-blue">
                  {quizInfo.attemptsRemaining === null ? "∞" : quizInfo.attemptsRemaining}
                </p>
                <p className="text-gray-500 dark:text-gray-300">Attempts Left</p>
              </div>
            </div>

            {error && <div className="mb-4"><AlertBanner message={error} /></div>}

            {quizInfo.canStart ? (
              <button onClick={beginQuiz} disabled={starting} className="btn-primary w-full">
                {starting ? "Starting..." : quizInfo.inProgressAttemptId ? "Resume Quiz" : "Start Quiz"}
              </button>
            ) : (
              <AlertBanner message="You have used all of your attempts for this quiz." />
            )}

            {settings.contact_phone_number && (
              <p className="text-center text-xs text-gray-400 mt-5">
                Any complaints?{" "}
                <a href={`tel:${settings.contact_phone_number}`} className="text-agora-blue font-semibold">
                  Contact us
                </a>
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (stage === "taking" && attemptData) {
    return <QuizRunner slug={slug} attemptData={attemptData} />;
  }

  return null;
}
