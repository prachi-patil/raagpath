// ─── Tanpura Drone Engine ─────────────────────────────────────────────────────
// Generates a continuous Sa–Pa–Sa–Ni tanpura drone using Tone.js.
// Tone.js is dynamically imported so it never loads during SSR / static build.
//
// Signal chain per pluck:
//   4 × Sawtooth synths (slightly detuned from each other)
//     → shared Lowpass Filter  (cuts harsh highs, keeps warm body)
//     → shared Reverb          (gives the instrument its resonant 'room' sound)
//     → Volume node            (user-controlled level)
//     → Destination
//
// Sawtooth is used instead of triangle because it contains ALL harmonics
// (1st, 2nd, 3rd…), not just odd ones. The lowpass filter then rolls off the
// harsh high partials, leaving a warm, tanpura-like tone.
//
// Each string is detuned by a few cents from the others. On a real tanpura
// the strings are never perfectly in tune — this slight detuning creates the
// characteristic shimmer (amplitude beating) that gives tanpura its hypnotic
// quality.

import { getTanpuraFrequencies, type ShrutiNote } from './swara';

const BEAT_MS  = 1100;  // ~55 BPM — slow, meditative pace
const NOTE_DUR = '2n';  // half-note duration per string pluck

// Per-string detune in cents — creates natural beating between strings
// Typical tanpura strings waver a few cents from nominal pitch
const STRING_DETUNE = [0, 5, -4, 2] as const;

// Volume conversion: 0–100 slider → dB
// 0% = -40 dB (silent), 50% = -20 dB (background), 100% = 0 dB (full)
export const VOL_DEFAULT = 50;
export function volToDb(pct: number): number {
  return -40 + (Math.max(0, Math.min(100, pct)) / 100) * 40;
}

export class TanpuraEngine {
  // Loaded lazily on first start() call
  private Tone:       typeof import('tone') | null  = null;
  // One synth per tanpura string (Sa, Pa, high-Sa, Ni)
  private synths:     import('tone').Synth[]        = [];
  // Shared effects chain — all strings pass through these
  private filter:     import('tone').Filter | null  = null;
  private reverb:     import('tone').Reverb | null  = null;
  private volumeNode: import('tone').Volume | null  = null;
  private timerId:    ReturnType<typeof setInterval> | null = null;
  private playing     = false;

  async start(shruti: ShrutiNote, volumePct: number = VOL_DEFAULT): Promise<void> {
    // Load Tone.js once — dynamic import avoids SSR breakage
    if (!this.Tone) {
      this.Tone = await import('tone');
    }
    const Tone = this.Tone;

    // Resume AudioContext (browsers require a user gesture before audio plays)
    await Tone.start();

    // Tear down any previous session cleanly before rebuilding
    this.stop();

    const freqs = getTanpuraFrequencies(shruti);

    // ── Build signal chain (back to front) ──────────────────────────────────
    // 1. Volume node → destination
    this.volumeNode = new Tone.Volume(volToDb(volumePct)).toDestination();

    // 2. Reverb — adds the resonant, spacious body of a large acoustic instrument
    //    decay: 3.5s gives a long, slowly fading resonance
    //    wet: 0.3 = 30% reverb signal mixed with 70% dry
    this.reverb = new Tone.Reverb({ decay: 3.5, wet: 0.3, preDelay: 0.01 });
    await this.reverb.generate(); // pre-computes the impulse response
    this.reverb.connect(this.volumeNode);

    // 3. Lowpass filter — softens the sawtooth wave
    //    frequency: 900 Hz rolls off the metallic upper harmonics
    //    keeping the warm 1st–5th harmonics intact
    this.filter = new Tone.Filter({ type: 'lowpass', frequency: 900, rolloff: -24 });
    this.filter.connect(this.reverb);

    // ── Create synths ────────────────────────────────────────────────────────
    this.synths = freqs.map((_, i) =>
      new Tone.Synth({
        oscillator: {
          type: 'sawtooth', // all harmonics — much richer than triangle
        },
        envelope: {
          attack:  0.03,  // fast initial pluck transient
          decay:   0.7,   // settle from the bright pluck hit
          sustain: 0.35,  // moderate held level
          release: 4.5,   // very long tail — strings ring out for seconds
        },
        // Each string is slightly out of tune for natural shimmer
        detune: STRING_DETUNE[i],
        // Lower each synth's base volume so the summed signal doesn't clip
        volume: -8,
      }).connect(this.filter!)
    );

    let idx = 0;

    const pluck = () => {
      if (!this.playing) return;
      this.synths[idx]?.triggerAttackRelease(freqs[idx], NOTE_DUR);
      idx = (idx + 1) % freqs.length;
    };

    this.playing = true;
    pluck();                              // first note immediately
    this.timerId = setInterval(pluck, BEAT_MS);
  }

  // Live volume adjustment — no need to stop/restart
  setVolume(pct: number): void {
    if (this.volumeNode) {
      this.volumeNode.volume.value = volToDb(pct);
    }
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.synths.forEach(s => {
      try { s.triggerRelease(); s.dispose(); } catch { /* already disposed */ }
    });
    this.synths = [];
    if (this.filter) {
      try { this.filter.dispose(); } catch { /* already disposed */ }
      this.filter = null;
    }
    if (this.reverb) {
      try { this.reverb.dispose(); } catch { /* already disposed */ }
      this.reverb = null;
    }
    if (this.volumeNode) {
      try { this.volumeNode.dispose(); } catch { /* already disposed */ }
      this.volumeNode = null;
    }
    this.playing = false;
  }

  get isPlaying(): boolean {
    return this.playing;
  }
}
