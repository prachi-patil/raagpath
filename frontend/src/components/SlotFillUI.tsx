// ─── SlotFillUI ──────────────────────────────────────────────────────────────
// Slot-filling answer UI for Levels 5 & 6 (multi-swara sequences).
// Shows N empty slots at the top; user taps swaras from the grid to fill them.
// Auto-evaluates when all slots are filled.
// Undo button clears the last slot.
// Disabled while octave is playing or during tone playback.

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Swara } from '@/lib/swara';

interface Props {
  swaraPool:    readonly Swara[];
  sequenceLen:  number;         // 2 (L5) or 3 (L6)
  disabled:     boolean;
  onComplete:   (answer: Swara[]) => void;  // called when all slots filled
  targetSwaras: Swara[] | null; // revealed after answer (round_result phase)
  isCorrect:    boolean | null; // null = not yet answered
}

export function SlotFillUI({
  swaraPool, sequenceLen, disabled, onComplete, targetSwaras, isCorrect,
}: Props) {
  const [slots, setSlots] = useState<(Swara | null)[]>(() => Array(sequenceLen).fill(null));

  // Reset slots when a new round starts (targetSwaras changes back to null)
  useEffect(() => {
    if (targetSwaras === null) {
      setSlots(Array(sequenceLen).fill(null));
    }
  }, [targetSwaras, sequenceLen]);

  const handleTap = useCallback((swara: Swara) => {
    if (disabled) return;
    setSlots(prev => {
      const idx = prev.findIndex(s => s === null);
      if (idx === -1) return prev;               // all slots full — ignore
      const next = [...prev];
      next[idx] = swara;
      // Auto-evaluate when all slots are filled
      if (idx === sequenceLen - 1) {
        setTimeout(() => onComplete(next as Swara[]), 0);
      }
      return next;
    });
  }, [disabled, onComplete, sequenceLen]);

  const handleUndo = useCallback(() => {
    setSlots(prev => {
      const lastFilled = [...prev].reverse().findIndex(s => s !== null);
      if (lastFilled === -1) return prev;
      const idx = prev.length - 1 - lastFilled;
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  }, []);

  // ── Slot display ──────────────────────────────────────────────────────────
  const revealed = targetSwaras !== null; // after answer

  return (
    <div className="space-y-4">
      {/* Slots row */}
      <div className="flex gap-2 justify-center">
        {slots.map((swara, i) => {
          // After answer: show correct/wrong colouring
          let slotStyle = 'bg-white/10 border-white/20';
          if (revealed && targetSwaras) {
            slotStyle = swara === targetSwaras[i]
              ? 'bg-emerald-500/80 border-emerald-500'
              : 'bg-red-500/80 border-red-500';
          } else if (swara) {
            slotStyle = 'bg-saffron/30 border-saffron/60';
          }

          return (
            <div
              key={i}
              className={`
                flex-1 max-w-[80px] h-14 rounded-xl border-2 flex items-center
                justify-center font-bold text-lg text-white transition-all
                ${slotStyle}
              `}
            >
              {/* Show answer target on reveal, else what user filled */}
              {revealed ? (targetSwaras?.[i] ?? '?') : (swara ?? '')}
            </div>
          );
        })}
      </div>

      {/* Undo button — only while answering */}
      {!revealed && (
        <div className="flex justify-end">
          <button
            onClick={handleUndo}
            disabled={disabled || slots.every(s => s === null)}
            className="text-white/40 text-xs hover:text-white/70 disabled:opacity-30 transition"
          >
            ← Undo
          </button>
        </div>
      )}

      {/* Swara button grid */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(swaraPool.length, 4)}, 1fr)` }}
      >
        {swaraPool.map(swara => (
          <button
            key={swara}
            onClick={() => handleTap(swara)}
            disabled={disabled || slots.every(s => s !== null) || revealed}
            className="
              py-3 rounded-xl font-bold text-base text-white
              bg-white/10 hover:bg-white/20 transition
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            {swara}
          </button>
        ))}
      </div>
    </div>
  );
}
