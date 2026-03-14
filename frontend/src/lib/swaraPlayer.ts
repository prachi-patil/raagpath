// ─── Swara Player Engine ──────────────────────────────────────────────────────
// Synthesises single swara tones for the Swara Recognition Game.
// Uses a triangle wave (strong fundamental, clean pitch) unlike the tanpura
// (sawtooth). The clean tone helps the ear recognise pitch without the timbre
// cues of a real instrument — ideal for ear-training.
//
// Signal chain:
//   Synth (triangle) → Reverb (light, 1.5s) → Destination
//
// IMPORTANT: ensureInitialised() MUST be called inside a user-gesture handler
// (e.g. button click). AudioContext cannot be created before a gesture.

import { SWARAS, type Swara, type ShrutiNote } from './swara';

// MIDI for each shruti at octave 3 (mirrors swara.ts SHRUTI_MIDI)
const SHRUTI_MIDI: Record<ShrutiNote, number> = {
  C: 48, 'C#': 49, D: 50, 'D#': 51, E: 52, F: 53,
  'F#': 54, G: 55, 'G#': 56, A: 57, 'A#': 58, B: 59,
};

// Semitone offset of each swara from Sa (0 = Sa, 1 = re, …, 11 = Ni)
const SWARA_SEMITONE: Record<Swara, number> = {
  Sa: 0, re: 1, Re: 2, ga: 3, Ga: 4, Ma: 5,
  ma: 6, Pa: 7, dha: 8, Dha: 9, ni: 10, Ni: 11,
};

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Hz for a swara in octave 4 (one octave above the tanpura base). */
function swaraToHz(swara: Swara, shruti: ShrutiNote): number {
  const base = SHRUTI_MIDI[shruti] + 12; // octave 4
  return midiToHz(base + SWARA_SEMITONE[swara]);
}

// Note duration in Tone.js time notation
const NOTE_DUR = '1n';     // 1 second per note (half-note at default 120 bpm)
const NOTE_GAP_MS = 800;   // gap between notes in a sequence

export class SwaraPlayerEngine {
  private Tone:   typeof import('tone') | null = null;
  private synth:  import('tone').Synth | null  = null;
  private reverb: import('tone').Reverb | null = null;
  private _playing = false;

  // ── Initialise (call inside a button click handler) ──────────────────────
  async ensureInitialised(): Promise<void> {
    if (!this.Tone) {
      this.Tone = await import('tone');
    }
    const Tone = this.Tone;
    await Tone.start();                         // resume AudioContext

    if (!this.reverb) {
      this.reverb = new Tone.Reverb({ decay: 1.5, wet: 0.15, preDelay: 0.01 });
      await this.reverb.generate();
      this.reverb.toDestination();
    }

    if (!this.synth) {
      this.synth = new Tone.Synth({
        oscillator: { type: 'triangle' },       // clean pitch, no harsh harmonics
        envelope: {
          attack:  0.01,   // crisp onset — piano-like pluck
          decay:   0.3,
          sustain: 0.7,
          release: 0.8,    // quick fade — question appears right after
        },
        volume: -6,
      }).connect(this.reverb);
    }
  }

  /** Returns true if a tone/sequence is currently playing. */
  get playing(): boolean { return this._playing; }

  /**
   * Play a single swara tone.
   * Resolves after the note finishes (NOTE_DUR + release tail).
   */
  async playSwara(swara: Swara, shruti: ShrutiNote): Promise<void> {
    if (this._playing || !this.synth || !this.Tone) return;
    this._playing = true;
    try {
      const hz = swaraToHz(swara, shruti);
      this.synth.triggerAttackRelease(hz, NOTE_DUR);
      // Wait for duration + release tail
      await delay(1200);
    } finally {
      this._playing = false;
    }
  }

  /**
   * Play a sequence of swaras with a gap between them.
   * Used for multi-swara levels (L5/L6) and the full octave playback.
   * Resolves after the last note's tail finishes.
   */
  async playSequence(swaras: readonly Swara[], shruti: ShrutiNote): Promise<void> {
    if (this._playing || !this.synth || !this.Tone) return;
    this._playing = true;
    try {
      for (const swara of swaras) {
        if (!this._playing) break;              // allow early stop
        const hz = swaraToHz(swara, shruti);
        this.synth.triggerAttackRelease(hz, NOTE_DUR);
        await delay(1200 + NOTE_GAP_MS);
      }
    } finally {
      this._playing = false;
    }
  }

  /**
   * Play all 12 swaras in ascending order — full reference octave.
   * Answer buttons should be disabled while this runs.
   */
  async playOctave(shruti: ShrutiNote): Promise<void> {
    return this.playSequence(SWARAS, shruti);
  }

  /** Stop any currently playing sequence immediately. */
  stopPlayback(): void {
    this._playing = false;
    this.synth?.triggerRelease();
  }

  /** Dispose all Tone.js resources. Call when leaving the game page. */
  dispose(): void {
    this.stopPlayback();
    try { this.synth?.dispose(); }  catch { /* already disposed */ }
    try { this.reverb?.dispose(); } catch { /* already disposed */ }
    this.synth  = null;
    this.reverb = null;
    this.Tone   = null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
