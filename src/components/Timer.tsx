"use client";

import { useEffect, useRef, useState } from "react";

export default function Timer({
  endsAt,
  onExpire,
}: {
  endsAt: string;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));
  const firedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = Math.max(0, new Date(endsAt).getTime() - Date.now());
      setRemaining(ms);
      if (ms <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(interval);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onExpire]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const low = totalSeconds <= 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-poppins font-semibold text-sm tabular-nums ${
        low ? "bg-agora-red/15 text-agora-red animate-pulse" : "bg-agora-blue/10 text-agora-blue"
      }`}
      aria-live="polite"
    >
      <span>⏱</span>
      <span>
        {hours > 0 ? `${pad(hours)}:` : ""}
        {pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
}
