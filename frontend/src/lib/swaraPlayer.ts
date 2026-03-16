// ─── Swara Player Engine ──────────────────────────────────────────────────────
// Synthesises single swara tones for the Swara Recognition Game.
// Simulates a harmonium: 3 fatsawtooth oscillators (like 3 physical reeds per key,
// each slightly detuned) → warm lowpass filter → very dry reverb.
//
// Signal chain:
//   Synth (fatsawtooth × 3, 15¢ spread) → Lowpass Filter (1600 Hz) → Reverb (dry) → Destination
//
// IMPORTANT: ensureInitialised() MUST be called inside a user-gesture handler
// (e.g. button click). AudioContext cannot be created before a gesture.

import { SWARAS, SHUDDHA, type Swara, type ShrutiNote } from './swara';

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
  private Tone:    typeof import('tone') | null   = null;
  private synth:   import('tone').Synth | null    = null;
  private filter:  import('tone').Filter | null   = null;
  private reverb:  import('tone').Reverb | null   = null;
  private _playing = false;
  // Each call to play* gets a unique token; stopPlayback() bumps it so any
  // in-flight loop detects the mismatch and exits without firing more notes.
  private playId   = 0;

  // ── Initialise (call inside a button click handler) ──────────────────────
  async ensureInitialised(): Promise<void> {
    if (!this.Tone) {
      this.Tone = await import('tone');
    }
    const Tone = this.Tone;
    await Tone.start();                         // resume AudioContext

    if (!this.reverb) {
      // Very dry — harmoniums are close, direct instruments
      this.reverb = new Tone.Reverb({ decay: 0.8, wet: 0.07, preDelay: 0.01 });
      await this.reverb.generate();
      this.reverb.toDestination();
    }

    if (!this.filter) {
      // Lowpass rolls off harsh upper harmonics while keeping warmth
      this.filter = new Tone.Filter({ frequency: 1600, type: 'lowpass', rolloff: -12 });
      this.filter.connect(this.reverb);
    }

    if (!this.synth) {
      // fatsawtooth runs 3 actual oscillators, each detuned by 15¢ spread —
      // physically equivalent to a harmonium's 3 reeds per key.
      // This produces natural beating/chorus without any digital chorus effect.
      this.synth = new Tone.Synth({
        oscillator: {
          type:   'fatsawtooth' as const,
          count:  3,    // 3 reeds per key
          spread: 15,   // 15 cents total spread between reeds
        },
        envelope: {
          attack:  0.05,   // reed takes a moment to speak
          decay:   0.08,   // quick settle into steady tone
          sustain: 0.92,   // held steady while bellows push air
          release: 0.35,   // stops promptly when key released
        },
        volume: -10,
      }).connect(this.filter);
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
    const myId = ++this.playId;
    try {
      const hz = swaraToHz(swara, shruti);
      this.synth.triggerAttackRelease(hz, NOTE_DUR);
      // Wait for duration + release tail
      await delay(1200);
    } finally {
      // Only clear _playing if we are still the active playback
      if (this.playId === myId) this._playing = false;
    }
  }

  /**
   * Play a sequence of swaras with a gap between them.
   * Used for multi-swara levels and the full octave playback.
   * Resolves after the last note's tail finishes.
   */
  async playSequence(swaras: readonly Swara[], shruti: ShrutiNote): Promise<void> {
    if (this._playing || !this.synth || !this.Tone) return;
    this._playing = true;
    const myId = ++this.playId;
    try {
      for (const swara of swaras) {
        // Exit if stopPlayback() was called (playId bumped) OR _playing cleared
        if (!this._playing || this.playId !== myId) break;
        const hz = swaraToHz(swara, shruti);
        this.synth.triggerAttackRelease(hz, NOTE_DUR);
        await delay(1200 + NOTE_GAP_MS);
      }
    } finally {
      if (this.playId === myId) this._playing = false;
    }
  }

  /**
   * Play the 7 shuddha swaras in ascending order — reference octave.
   * Plays Sa Re Ga Ma Pa Dha Ni (natural notes only, no komal/tivra).
   * Answer buttons should be disabled while this runs.
   */
  async playOctave(shruti: ShrutiNote): Promise<void> {
    return this.playSequence(SHUDDHA, shruti);
  }

  /** Stop any currently playing sequence immediately. */
  stopPlayback(): void {
    this.playId++;       // invalidate any in-flight playSwara / playSequence loop
    this._playing = false;
    this.synth?.triggerRelease();
  }

  /** Dispose all Tone.js resources. Call when leaving the game page. */
  dispose(): void {
    this.stopPlayback();
    try { this.synth?.dispose(); }   catch { /* already disposed */ }
    try { this.filter?.dispose(); }  catch { /* already disposed */ }
    try { this.reverb?.dispose(); }  catch { /* already disposed */ }
    this.synth   = null;
    this.filter  = null;
    this.reverb  = null;
    this.Tone    = null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
