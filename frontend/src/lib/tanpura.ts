// ─── Tanpura Drone Engine ─────────────────────────────────────────────────────
// Generates a continuous Sa–Pa–Sa–Ni tanpura drone using Tone.js.
// Tone.js is dynamically imported so it never loads during SSR / static build.
//
// Each string uses a triangle-wave synth with a long release to mimic the
// natural resonance decay of a real tanpura.

import { getTanpuraFrequencies, type ShrutiNote } from './swara';

const BEAT_MS    = 1100; // ~55 BPM half-notes — slow, meditative pace
const NOTE_DUR   = '2n'; // half-note duration per string pluck
const VOLUME_DB  = -20;  // gentle background level

export class TanpuraEngine {
  // Loaded lazily on first start() call
  private Tone:    typeof import('tone') | null = null;
  // One synth per tanpura string (Sa, Pa, high-Sa, Ni)
  private synths:  import('tone').Synth[]       = [];
  private timerId: ReturnType<typeof setInterval> | null = null;
  private playing  = false;

  async start(shruti: ShrutiNote): Promise<void> {
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

    // Create four individual synths — one per string
    this.synths = freqs.map(
      () =>
        new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope:   { attack: 0.4, decay: 0.1, sustain: 0.8, release: 2.8 },
          volume:     VOLUME_DB,
        }).toDestination()
    );

    let idx = 0;

    const pluck = () => {
      if (!this.playing) return;
      // triggerAttackRelease fires the synth and auto-releases after NOTE_DUR
      this.synths[idx]?.triggerAttackRelease(freqs[idx], NOTE_DUR);
      idx = (idx + 1) % freqs.length;
    };

    this.playing  = true;
    pluck();                              // first note immediately
    this.timerId  = setInterval(pluck, BEAT_MS);
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.synths.forEach(s => {
      try { s.triggerRelease(); s.dispose(); } catch { /* already disposed */ }
    });
    this.synths  = [];
    this.playing = false;
  }

  get isPlaying(): boolean {
    return this.playing;
  }
}
