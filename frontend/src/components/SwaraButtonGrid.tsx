// ─── SwaraButtonGrid ─────────────────────────────────────────────────────────
// Tap-to-answer grid for Levels 1–4 (single swara per round).
// Buttons flash green (correct) or red (wrong) on tap, then return to neutral.
// Disabled while octave is playing or during tone playback.

'use client';

import { useState, useCallback } from 'react';
import type { Swara } from '@/lib/swara';

interface Props {
  swaraPool:   readonly Swara[];
  disabled:    boolean;
  onAnswer:    (swara: Swara) => void;
  lastCorrect: Swara | null;   // set for 1.5s on correct — highlight green
  wrongGuess:  Swara | null;   // last wrong tap — flash red momentarily
}

export function SwaraButtonGrid({ swaraPool, disabled, onAnswer, lastCorrect, wrongGuess }: Props) {
  const [justTapped, setJustTapped] = useState<Swara | null>(null);

  const handleTap = useCallback((swara: Swara) => {
    if (disabled) return;
    setJustTapped(swara);
    setTimeout(() => setJustTapped(null), 350);
    onAnswer(swara);
  }, [disabled, onAnswer]);

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${Math.min(swaraPool.length, 4)}, 1fr)` }}
    >
      {swaraPool.map(swara => {
        const isCorrect = swara === lastCorrect;
        const isWrong   = swara === wrongGuess;
        const isTapped  = swara === justTapped;

        let bg = 'bg-white/10 hover:bg-white/20 text-white';
        if (isCorrect)     bg = 'bg-emerald-500/80 text-white shadow-lg shadow-emerald-500/30';
        else if (isWrong)  bg = 'bg-red-500/80 text-white';
        else if (isTapped) bg = 'bg-white/30 text-white';

        return (
          <button
            key={swara}
            onClick={() => handleTap(swara)}
            disabled={disabled}
            className={`
              py-3 rounded-xl font-bold text-base transition-all duration-150
              disabled:opacity-40 disabled:cursor-not-allowed
              ${bg}
            `}
          >
            {swara}
          </button>
        );
      })}
    </div>
  );
}
