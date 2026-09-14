"use client";

export default function QuestionNav({
  total,
  currentIndex,
  answeredIndexes,
  onJump,
}: {
  total: number;
  currentIndex: number;
  answeredIndexes: Set<number>;
  onJump: (index: number) => void;
}) {
  return (
    <div className="card p-3">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 mb-2 font-nunito">Jump to question</p>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-40 overflow-y-auto pr-1">
        {Array.from({ length: total }).map((_, i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = answeredIndexes.has(i);
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              className={`h-8 w-8 rounded-md text-xs font-semibold flex items-center justify-center transition
                ${isCurrent ? "bg-agora-blue text-white ring-2 ring-agora-blue/40" : isAnswered ? "bg-agora-green/15 text-agora-green border border-agora-green/40" : "bg-agora-lightblue dark:bg-white/10 text-gray-500 dark:text-gray-300 border border-transparent"}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 font-nunito">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-agora-blue inline-block" /> Current</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-agora-green/40 inline-block" /> Answered</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-agora-lightblue dark:bg-white/10 border border-gray-300 inline-block" /> Unanswered</span>
      </div>
    </div>
  );
}
