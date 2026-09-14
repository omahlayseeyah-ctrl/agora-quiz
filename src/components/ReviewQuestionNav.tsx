"use client";

export default function ReviewQuestionNav({
  total,
  currentIndex,
  correctness,
  onJump,
}: {
  total: number;
  currentIndex: number;
  correctness: boolean[]; // true = correct, false = incorrect, for each question index
  onJump: (index: number) => void;
}) {
  return (
    <div className="card p-3">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 mb-2 font-nunito">Jump to question</p>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-40 overflow-y-auto pr-1">
        {Array.from({ length: total }).map((_, i) => {
          const isCurrent = i === currentIndex;
          const isCorrect = correctness[i];
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              className={`h-8 w-8 rounded-md text-xs font-bold flex items-center justify-center transition
                ${isCurrent ? "ring-2 ring-agora-blue ring-offset-1" : ""}
                ${isCorrect ? "bg-agora-green text-white" : "bg-agora-red text-white"}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-nunito">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-agora-green inline-block" /> Correct</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-agora-red inline-block" /> Incorrect</span>
      </div>
    </div>
  );
}
