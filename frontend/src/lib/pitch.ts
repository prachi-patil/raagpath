// ─── Pitch Engine ─────────────────────────────────────────────────────────────
// Wraps Web Audio API + Pitchy (McLeod Pitch Method).
// Only instantiate this in the browser (inside useEffect / event handlers).
//
// Signal smoothing strategy:
//   • Clarity threshold  — ignore frames with low confidence (< 0.92)
//   • Rolling average    — smooth over last WINDOW frames to kill jitter
//   • Out-of-range guard — reject Hz outside human singing range (60–1200 Hz)

import { PitchDetector } from 'pitchy';

const CLARITY_THRESHOLD = 0.92;
const SMOOTHING_WINDOW  = 5;   // frames to average (≈ 5 × 16ms ≈ 80ms lag)
const MIN_HZ            = 60;  // ~B1 — lowest realistic singing note
const MAX_HZ            = 1200; // ~D6 — highest realistic singing note

export interface PitchResult {
  hz:      number | null; // null = silence / unclear
  clarity: number;        // 0–1, confidence of detection
}

export type PitchCallback = (result: PitchResult) => void;

export class PitchEngine {
  private audioCtx:  AudioContext | null                  = null;
  private analyser:  AnalyserNode | null                  = null;
  private stream:    MediaStream  | null                  = null;
  private detector:  PitchDetector<Float32Array<ArrayBuffer>> | null  = null;
  private buffer:    Float32Array<ArrayBuffer> | null                 = null;
  private rafId:     number       | null                  = null;
  private hzWindow:  number[]                             = [];
  private callback:  PitchCallback;

  constructor(callback: PitchCallback) {
    this.callback = callback;
  }

  async start(): Promise<void> {
    // Request mic — throws if denied (caller shows error to user)
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: false,
    });

    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize                  = 2048;
    this.analyser.smoothingTimeConstant    = 0.0; // we do our own smoothing

    const source = this.audioCtx.createMediaStreamSource(this.stream);
    source.connect(this.analyser);

    this.detector = PitchDetector.forFloat32Array(this.analyser.fftSize);
    this.buffer   = new Float32Array(this.detector.inputLength) as Float32Array<ArrayBuffer>;

    this.tick();
  }

  private tick(): void {
    this.rafId = requestAnimationFrame(() => this.tick());
    if (!this.analyser || !this.detector || !this.buffer || !this.audioCtx) return;

    this.analyser.getFloatTimeDomainData(this.buffer);
    const [hz, clarity] = this.detector.findPitch(this.buffer, this.audioCtx.sampleRate);

    if (clarity >= CLARITY_THRESHOLD && hz >= MIN_HZ && hz <= MAX_HZ) {
      // Add to rolling window and compute smoothed average
      this.hzWindow.push(hz);
      if (this.hzWindow.length > SMOOTHING_WINDOW) this.hzWindow.shift();
      const smoothed = this.hzWindow.reduce((a, b) => a + b) / this.hzWindow.length;
      this.callback({ hz: smoothed, clarity });
    } else {
      // Clear window on silence so stale history doesn't bleed into next note
      this.hzWindow = [];
      this.callback({ hz: null, clarity });
    }
  }

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach(t => t.stop());
    this.audioCtx?.close();
    this.rafId    = null;
    this.stream   = null;
    this.audioCtx = null;
    this.analyser = null;
    this.detector = null;
    this.buffer   = null;
    this.hzWindow = [];
  }
}
