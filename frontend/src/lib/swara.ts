// ─── Swara definitions ────────────────────────────────────────────────────────
// 12 semitones mapped to Indian classical swara names.
// Lowercase = komal (flat), Uppercase = shuddha (natural), 'ma' = tivra (sharp Ma)

export const SWARAS = [
  'Sa', 're', 'Re', 'ga', 'Ga', 'Ma', 'ma', 'Pa', 'dha', 'Dha', 'ni', 'Ni',
] as const;
export type Swara = (typeof SWARAS)[number];

// Natural (shuddha) swaras only — Sa Re Ga Ma Pa Dha Ni (7 notes)
export const SHUDDHA: readonly Swara[] = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'];

// Shuddha + all komal swaras (re ga dha ni) — 11 notes, no tivra Ma
export const SHUDDHA_AND_KOMAL: readonly Swara[] = [
  'Sa', 're', 'Re', 'ga', 'Ga', 'Ma', 'Pa', 'dha', 'Dha', 'ni', 'Ni',
];

// Full chromatic scale — all 12 semitones including tivra Ma (ma)
export const ALL12: readonly Swara[] = [...SWARAS];

// ─── Shruti (tonic) definitions ───────────────────────────────────────────────
export const SHRUTI_NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;
export type ShrutiNote = (typeof SHRUTI_NOTES)[number];

// MIDI note for each shruti at octave 3 (C3 = 48, A3 = 57)
const SHRUTI_MIDI: Record<ShrutiNote, number> = {
  C: 48, 'C#': 49, D: 50, 'D#': 51, E: 52, F: 53,
  'F#': 54, G: 55, 'G#': 56, A: 57, 'A#': 58, B: 59,
};

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ─── Tanpura frequencies ──────────────────────────────────────────────────────
// Classic Sa–Pa–Sa–Ni pattern. Low Sa and Pa in octave 3, high Sa + Ni in octave 4.
export function getTanpuraFrequencies(shruti: ShrutiNote): number[] {
  const base = SHRUTI_MIDI[shruti];
  return [
    midiToHz(base),      // Sa  (octave 3)
    midiToHz(base + 7),  // Pa  (octave 3)
    midiToHz(base + 12), // Sa  (octave 4)
    midiToHz(base + 11), // Ni  (octave 4)
  ];
}

// ─── Pitch → Swara detection ──────────────────────────────────────────────────
export interface SwaraMatch {
  swara: Swara;
  cents: number; // deviation from nearest swara: positive = sharp, negative = flat
}

export function detectSwara(hz: number, shruti: ShrutiNote): SwaraMatch | null {
  if (hz < 60 || hz > 2000) return null; // outside realistic singing range

  const baseMidi = SHRUTI_MIDI[shruti];
  const baseHz   = midiToHz(baseMidi);

  // Semitone offset from shruti (can be fractional, can span octaves)
  const semitoneOffset = 12 * Math.log2(hz / baseHz);

  // Nearest semitone (integer)
  const nearest = Math.round(semitoneOffset);

  // Normalise to 0–11 for swara lookup
  const normalised = ((nearest % 12) + 12) % 12;

  // Cents deviation from that nearest semitone (±50¢ max before it snaps to next)
  const cents = (semitoneOffset - nearest) * 100;

  return { swara: SWARAS[normalised], cents };
}
