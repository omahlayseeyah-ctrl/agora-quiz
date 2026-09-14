export default function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-agora-dark relative overflow-hidden px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-agora-blue/20 via-transparent to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[140%] h-64 bg-agora-skyblue/20 blur-3xl rounded-full" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="flex items-end gap-1 mb-2">
          <span className="font-poppins font-extrabold text-6xl sm:text-7xl text-white drop-shadow-[0_0_25px_rgba(91,180,240,0.5)]">
            AGORA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-agora-skyblue/70" />
          <span className="font-poppins font-bold text-2xl sm:text-3xl tracking-[0.3em] text-agora-skyblue">
            QUIZ
          </span>
          <span className="h-px w-10 bg-agora-skyblue/70" />
        </div>

        <div className="mt-10 flex gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-agora-skyblue animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-agora-skyblue animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-agora-skyblue animate-bounce" />
        </div>

        {message && <p className="mt-6 text-agora-lightblue/80 font-nunito text-sm">{message}</p>}
      </div>
    </div>
  );
}
