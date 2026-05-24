'use client';

import { useState } from 'react';

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  const input = (digit: string) => {
    if (fresh) {
      setDisplay(digit === '.' ? '0.' : digit);
      setFresh(false);
    } else {
      setDisplay(display === '0' && digit !== '.' ? digit : display + digit);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const compute = (a: number, b: number, operator: string): number => {
    switch (operator) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  };

  const setOperator = (operator: string) => {
    const val = parseFloat(display);
    if (prev !== null && op && !fresh) {
      const result = compute(prev, val, op);
      setDisplay(String(result));
      setPrev(result);
    } else {
      setPrev(val);
    }
    setOp(operator);
    setFresh(true);
  };

  const equals = () => {
    if (prev === null || !op) return;
    const val = parseFloat(display);
    const result = compute(prev, val, op);
    setDisplay(String(result));
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  const handleBtn = (label: string) => {
    if (label === 'C') clear();
    else if (label === '=') equals();
    else if (['+', '-', '×', '÷'].includes(label)) setOperator(label);
    else if (label === '±') setDisplay(String(-parseFloat(display)));
    else if (label === '%') setDisplay(String(parseFloat(display) / 100));
    else input(label);
  };

  return (
    <div className="flex h-full flex-col bg-slate-900 p-3">
      <div className="mb-3 rounded-lg bg-black/40 px-4 py-6 text-right text-3xl font-light tabular-nums text-white">
        {display}
      </div>
      <div className="grid flex-1 grid-cols-4 gap-2">
        {buttons.flat().map((label, i) => (
          <button
            key={`${label}-${i}`}
            type="button"
            onClick={() => handleBtn(label)}
            className={`rounded-xl text-lg font-medium transition hover:bg-white/20 ${
              label === '0' ? 'col-span-2' : ''
            } ${
              ['+', '-', '×', '÷', '='].includes(label)
                ? 'bg-[var(--accent)] text-white'
                : 'bg-white/10 text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
