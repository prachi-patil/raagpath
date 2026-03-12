'use client';

// ─── Sur Accuracy Meter ───────────────────────────────────────────────────────
// Displays a horizontal needle showing cents deviation from the nearest swara.
//
// Colour zones:
//   Green  (≤ ±20¢) — on pitch
//   Amber  (≤ ±50¢) — close
//   Red    (> ±50¢) — off pitch
//   Grey          — no pitch detected (silence)
//
// The ±20¢ tolerance band is permanently shaded green in the background so
// the user can see the "landing zone" even before they sing.

const RANGE = 60; // cents shown on each side of centre

interface SurMeterProps {
  cents: number | null; // null = silence / no detection
}

export function SurMeter({ cents }: SurMeterProps) {
  // Clamp to display range then convert to 0–100% position
  const clamped  = cents !== null ? Math.max(-RANGE, Math.min(RANGE, cents)) : 0;
  const leftPct  = ((clamped / RANGE + 1) / 2) * 100;

  const needleColor =
    cents === null          ? 'bg-white/30'
    : Math.abs(cents) <= 20 ? 'bg-green-400'
    : Math.abs(cents) <= 50 ? 'bg-amber-400'
    :                         'bg-red-500';

  const centsLabel =
    cents === null  ? '—'
    : cents > 0     ? `+${cents.toFixed(0)}¢`
    :                 `${cents.toFixed(0)}¢`;

  // ±20¢ green zone: width = 40¢ / 120¢ total = 33.3%, centred at 50%
  const greenZoneLeft  = (((-20) / RANGE + 1) / 2) * 100;
  const greenZoneWidth = (40 / (RANGE * 2)) * 100;

  return (
    <div className="w-full select-none">

      {/* Labels row */}
      <div className="flex justify-between items-center text-xs mb-2 px-0.5">
        <span className="text-white/40">♭ flat</span>
        <span className="font-mono text-white/80 text-sm tracking-wide">{centsLabel}</span>
        <span className="text-white/40">sharp ♯</span>
      </div>

      {/* Meter track */}
      <div className="relative h-10 bg-white/10 rounded-full overflow-hidden">

        {/* Green tolerance zone (±20¢) */}
        <div
          className="absolute inset-y-0 bg-green-400/15 rounded-full"
          style={{ left: `${greenZoneLeft}%`, width: `${greenZoneWidth}%` }}
        />

        {/* Centre line */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/30" />

        {/* Needle — only shown when pitch detected */}
        {cents !== null && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-7 rounded-sm shadow-lg
                        transition-all duration-75 ${needleColor}`}
            style={{ left: `calc(${leftPct}% - 6px)` }}
          />
        )}
      </div>

      {/* Scale marks */}
      <div className="flex justify-between text-white/20 text-xs mt-1 px-0.5">
        <span>−{RANGE}</span>
        <span>−30</span>
        <span>0</span>
        <span>+30</span>
        <span>+{RANGE}</span>
      </div>

    </div>
  );
}
