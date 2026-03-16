// ─── SlotFillUI ──────────────────────────────────────────────────────────────
// Slot-filling answer UI for multi-swara sequence levels (L3 / L4).
// Shows N empty slots; user taps swaras from the grid to fill them one by one.
// Each slot is checked immediately:
//   Correct → turns green and locks (cannot be changed)
//   Wrong   → red flash for 350 ms, slot stays empty, user tries again
// When all slots are locked, calls onComplete(wrongAttempts).
// No Undo button — wrong attempts are simply retried.

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Swara } from '@/lib/swara';

interface Props {
  targetSwaras: readonly Swara[];   // always provided; used for per-slot checking
  swaraPool:    readonly Swara[];
  sequenceLen:  number;
  disabled:     boolean;
  roundKey:     number;             // increment each new round to reset state
  onComplete:   (wrongAttempts: number) => void;
}

export function SlotFillUI({
  targetSwaras, swaraPool, sequenceLen, disabled, roundKey, onComplete,
}: Props) {
  const [lockedSlots, setLockedSlots] = useState<(Swara | null)[]>(
    () => Array(sequenceLen).fill(null)
  );
  const [errorSlot, setErrorSlot] = useState<number | null>(null);

  // Refs — stay current inside event handlers without stale closures
  const lockedRef  = useRef<(Swara | null)[]>(Array(sequenceLen).fill(null));
  const wrongRef   = useRef(0);
  const doneRef    = useRef(false);

  // Reset when a new round starts
  useEffect(() => {
    const empty = Array(sequenceLen).fill(null);
    lockedRef.current = empty;
    setLockedSlots(empty);
    setErrorSlot(null);
    wrongRef.current = 0;
    doneRef.current  = false;
  }, [roundKey, sequenceLen]);

  const handleTap = useCallback((swara: Swara) => {
    if (disabled || doneRef.current) return;

    const idx = lockedRef.current.findIndex(s => s === null);
    if (idx === -1) return; // all locked

    if (swara === targetSwaras[idx]) {
      // ── Correct slot ──────────────────────────────────────────────────────
      const next = [...lockedRef.current];
      next[idx] = swara;
      lockedRef.current = next;
      setLockedSlots([...next]);

      if (next.every(s => s !== null)) {
        doneRef.current = true;
        setTimeout(() => onComplete(wrongRef.current), 0);
      }
    } else {
      // ── Wrong slot ────────────────────────────────────────────────────────
      wrongRef.current += 1;
      setErrorSlot(idx);
      setTimeout(() => setErrorSlot(null), 350);
    }
  }, [disabled, targetSwaras, onComplete]);

  const nextEmptyIdx = lockedSlots.findIndex(s => s === null);
  const allLocked    = nextEmptyIdx === -1;

  return (
    <div className="space-y-4">
      {/* Slots row */}
      <div className="flex gap-2 justify-center">
        {lockedSlots.map((swara, i) => {
          let slotStyle = 'bg-white/10 border-white/20';
          if (swara !== null) {
            slotStyle = 'bg-emerald-500/80 border-emerald-500';   // locked correct
          } else if (errorSlot === i) {
            slotStyle = 'bg-red-500/80 border-red-500';           // wrong flash
          } else if (i === nextEmptyIdx) {
            slotStyle = 'bg-white/15 border-white/40';            // active next slot
          }

          return (
            <div
              key={i}
              className={`
                flex-1 max-w-[80px] h-14 rounded-xl border-2 flex items-center
                justify-center font-bold text-lg text-white transition-all duration-150
                ${slotStyle}
              `}
            >
              {swara ?? (errorSlot === i ? '✗' : '')}
            </div>
          );
        })}
      </div>

      {/* Swara button grid */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(swaraPool.length, 4)}, 1fr)` }}
      >
        {swaraPool.map(swara => (
          <button
            key={swara}
            onClick={() => handleTap(swara)}
            disabled={disabled || allLocked}
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
