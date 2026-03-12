// ─── Tanpura Drone Engine ─────────────────────────────────────────────────────
// Generates a continuous Sa–Pa–Sa–Ni tanpura drone using Tone.js.
// Tone.js is dynamically imported so it never loads during SSR / static build.
//
// Each string uses a triangle-wave synth with a long release to mimic the
// natural resonance decay of a real tanpura.

import { getTanpuraFrequencies, type ShrutiNote } from './swara';

const BEAT_MS  = 1100; // ~55 BPM half-notes — slow, meditative pace
const NOTE_DUR = '2n'; // half-note duration per string pluck

// Volume conversion: 0–100 slider → dB
// 0% = -40 dB (silent), 50% = -20 dB (background), 100% = 0 dB (full)
export const VOL_DEFAULT = 50; // matches original hardcoded -20 dB
export function volToDb(pct: number): number {
  return -40 + (Math.max(0, Math.min(100, pct)) / 100) * 40;
}

export class TanpuraEngine {
  // Loaded lazily on first start() call
  private Tone:       typeof import('tone') | null  = null;
  // One synth per tanpura string (Sa, Pa, high-Sa, Ni)
  private synths:     import('tone').Synth[]        = [];
  // Single volume node — all synths route through it for unified control
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

    // Single volume node that all strings pass through
    this.volumeNode = new Tone.Volume(volToDb(volumePct)).toDestination();

    // Create four individual synths — one per string, all routed through volumeNode
    this.synths = freqs.map(
      () =>
        new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope:   { attack: 0.4, decay: 0.1, sustain: 0.8, release: 2.8 },
        }).connect(this.volumeNode!)
    );

    let idx = 0;

    const pluck = () => {
      if (!this.playing) return;
      // triggerAttackRelease fires the synth and auto-releases after NOTE_DUR
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
