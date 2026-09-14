"use client";

import { useState } from "react";

export default function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  function inputDigit(d: string) {
    setDisplay((cur) => {
      if (fresh || cur === "0") {
        setFresh(false);
        return d;
      }
      if (cur.length >= 14) return cur;
      return cur + d;
    });
    setFresh(false);
  }

  function inputDot() {
    setDisplay((cur) => {
      if (fresh) {
        setFresh(false);
        return "0.";
      }
      return cur.includes(".") ? cur : cur + ".";
    });
  }

  function compute(a: number, b: number, operator: string) {
    switch (operator) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }

  function chooseOp(nextOp: string) {
    const current = parseFloat(display);
    if (prev !== null && op && !fresh) {
      const result = compute(prev, current, op);
      setDisplay(String(Number.isFinite(result) ? round(result) : "Error"));
      setPrev(Number.isFinite(result) ? result : null);
    } else {
      setPrev(current);
    }
    setOp(nextOp);
    setFresh(true);
  }

  function round(n: number) {
    return Math.round(n * 1e10) / 1e10;
  }

  function equals() {
    if (prev === null || !op) return;
    const current = parseFloat(display);
    const result = compute(prev, current, op);
    setDisplay(String(Number.isFinite(result) ? round(result) : "Error"));
    setPrev(null);
    setOp(null);
    setFresh(true);
  }

  function sqrt() {
    const current = parseFloat(display);
    const result = current < 0 ? NaN : Math.sqrt(current);
    setDisplay(String(Number.isFinite(result) ? round(result) : "Error"));
    setFresh(true);
  }

  function clearAll() {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setFresh(true);
  }

  const keys: { label: string; onClick: () => void; className?: string }[] = [
    { label: "C", onClick: clearAll, className: "text-agora-red" },
    { label: "√", onClick: sqrt, className: "text-agora-blue" },
    { label: "÷", onClick: () => chooseOp("÷"), className: "text-agora-blue" },
    { label: "×", onClick: () => chooseOp("×"), className: "text-agora-blue" },
    { label: "7", onClick: () => inputDigit("7") },
    { label: "8", onClick: () => inputDigit("8") },
    { label: "9", onClick: () => inputDigit("9") },
    { label: "-", onClick: () => chooseOp("-"), className: "text-agora-blue" },
    { label: "4", onClick: () => inputDigit("4") },
    { label: "5", onClick: () => inputDigit("5") },
    { label: "6", onClick: () => inputDigit("6") },
    { label: "+", onClick: () => chooseOp("+"), className: "text-agora-blue" },
    { label: "1", onClick: () => inputDigit("1") },
    { label: "2", onClick: () => inputDigit("2") },
    { label: "3", onClick: () => inputDigit("3") },
    { label: "=", onClick: equals, className: "bg-agora-green text-white row-span-2" },
    { label: "0", onClick: () => inputDigit("0"), className: "col-span-2" },
    { label: ".", onClick: inputDot },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="card w-full max-w-xs p-4 font-inter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-poppins font-semibold text-sm text-agora-blue">Calculator</span>
          <button onClick={onClose} className="text-gray-400 hover:text-agora-red text-lg leading-none">✕</button>
        </div>
        <div className="bg-agora-lightblue dark:bg-black/30 rounded-lg px-3 py-3 text-right text-2xl font-semibold mb-3 overflow-x-auto">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {keys.map((k, i) => (
            <button
              key={i}
              onClick={k.onClick}
              className={`h-11 rounded-lg bg-agora-lightblue dark:bg-white/10 font-semibold text-sm hover:opacity-80 active:scale-95 transition ${k.className || ""}`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
