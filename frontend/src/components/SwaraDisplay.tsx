'use client';

import type { Swara } from '@/lib/swara';

// ─── Swara Display ────────────────────────────────────────────────────────────
// Shows two circles:
//   • Target  — the swara the user should sing (large, pulses green when hit)
//   • Singing — the swara currently detected from mic (smaller, saffron)
//
// "On pitch" = correct swara AND within ±20¢ tolerance

interface SwaraDisplayProps {
  detected:  Swara | null; // what the mic hears right now
  target:    Swara;        // swara the user is supposed to sing
  isOnPitch: boolean;      // true when detected === target AND cents ≤ tolerance
}

export function SwaraDisplay({ detected, target, isOnPitch }: SwaraDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-8">

      {/* Target swara */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-white/40 text-xs uppercase tracking-widest">Target</p>
        <div
          className={`
            w-36 h-36 rounded-full flex items-center justify-center
            text-6xl font-bold transition-all duration-150
            ${isOnPitch
              ? 'bg-green-400/25 text-green-300 ring-4 ring-green-400 scale-110'
              : 'bg-white/10  text-white/70'}
          `}
        >
          {target}
        </div>
        {isOnPitch && (
          <p className="text-green-400 text-sm font-semibold animate-pulse">✓ Sur lagaa!</p>
        )}
      </div>

      {/* Detected swara */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-white/40 text-xs uppercase tracking-widest">Singing</p>
        <div
          className={`
            w-24 h-24 rounded-full flex items-center justify-center
            text-4xl font-semibold transition-all duration-75
            ${detected ? 'bg-saffron/20 text-saffron' : 'bg-white/5 text-white/20'}
          `}
        >
          {detected ?? '—'}
        </div>
      </div>

    </div>
  );
}
