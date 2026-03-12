'use client';

// ─── Swara Trainer — Practice Page ───────────────────────────────────────────
// Day 3 implementation:
//   3.1  Mic input + Pitchy  — PitchEngine (see lib/pitch.ts)
//   3.2  Signal smoothing    — rolling average + clarity threshold in PitchEngine
//   3.3  Hz → Swara mapping  — detectSwara() (see lib/swara.ts)
//   3.4  Tanpura drone       — TanpuraEngine via Tone.js (see lib/tanpura.ts)
//   3.5  Sur Accuracy Meter  — <SurMeter> component
//   3.6  Target Swara Display— <SwaraDisplay> component
//
// Architecture note: all audio work happens client-side only.
// This component uses useRef for engine instances (not useState) so that
// engine start/stop never triggers a React re-render.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { isLoggedIn }                           from '@/lib/auth';
import { PitchEngine }                          from '@/lib/pitch';
import { TanpuraEngine }                        from '@/lib/tanpura';
import { detectSwara, SHRUTI_NOTES }            from '@/lib/swara';
import type { Swara, ShrutiNote }               from '@/lib/swara';
import { SurMeter }                             from '@/components/SurMeter';
import { SwaraDisplay }                         from '@/components/SwaraDisplay';

// The swara the user is practising in Day 3 — expanded to a sequence in Day 4
const TARGET: Swara   = 'Sa';
const PITCH_TOLERANCE = 20; // ±20 cents = on pitch

export default function PracticePage() {
  const router = useRouter();

  // ── auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn()) router.replace('/login');
  }, [router]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [shruti,     setShruti]     = useState<ShrutiNote>('C');
  const [listening,  setListening]  = useState(false);
  const [tanpuraOn,  setTanpuraOn]  = useState(false);
  const [detectedHz, setDetectedHz] = useState<number | null>(null);
  const [micError,   setMicError]   = useState('');

  // ── engine refs (not state — changes must NOT trigger re-render) ─────────────
  const pitchRef   = useRef<PitchEngine   | null>(null);
  const tanpuraRef = useRef<TanpuraEngine | null>(null);

  // ── cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      pitchRef.current?.stop();
      tanpuraRef.current?.stop();
    };
  }, []);

  // ── derived values ───────────────────────────────────────────────────────────
  const match      = detectedHz !== null ? detectSwara(detectedHz, shruti) : null;
  const isOnPitch  = match !== null
    && match.swara === TARGET
    && Math.abs(match.cents) <= PITCH_TOLERANCE;

  // ── mic toggle ───────────────────────────────────────────────────────────────
  const toggleListening = useCallback(async () => {
    if (listening) {
      pitchRef.current?.stop();
      pitchRef.current = null;
      setListening(false);
      setDetectedHz(null);
      return;
    }
    try {
      setMicError('');
      const engine = new PitchEngine(({ hz }) => setDetectedHz(hz));
      await engine.start();
      pitchRef.current = engine;
      setListening(true);
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setMicError('Microphone permission denied — click the 🔒 icon in the address bar and allow microphone access.');
      } else if (name === 'SecurityError' || !window.isSecureContext) {
        setMicError('Microphone requires HTTPS. Please access this page via https:// — not http://');
      } else if (name === 'NotFoundError') {
        setMicError('No microphone detected — please connect a mic and try again.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setMicError('Microphone is in use by another app — close it and try again.');
      } else {
        setMicError(`Microphone error: ${name || String(err)}`);
      }
    }
  }, [listening]);

  // ── tanpura toggle ───────────────────────────────────────────────────────────
  const toggleTanpura = useCallback(async () => {
    if (!tanpuraRef.current) tanpuraRef.current = new TanpuraEngine();
    if (tanpuraOn) {
      tanpuraRef.current.stop();
      setTanpuraOn(false);
    } else {
      await tanpuraRef.current.start(shruti);
      setTanpuraOn(true);
    }
  }, [tanpuraOn, shruti]);

  // ── shruti change: restart tanpura if it was playing ─────────────────────────
  const handleShrutiChange = useCallback(async (note: ShrutiNote) => {
    setShruti(note);
    if (tanpuraOn && tanpuraRef.current) {
      tanpuraRef.current.stop();
      await tanpuraRef.current.start(note);
    }
  }, [tanpuraOn]);

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-raga px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white/50 hover:text-white text-sm transition"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-saffron">Swara Trainer</h1>
          <div className="w-16" />
        </div>

        {/* ── Shruti selector ── */}
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
            Shruti — Tonic Note
          </p>
          <div className="grid grid-cols-6 gap-1.5">
            {SHRUTI_NOTES.map(note => (
              <button
                key={note}
                onClick={() => handleShrutiChange(note)}
                className={`
                  py-2 rounded-lg text-sm font-semibold transition
                  ${shruti === note
                    ? 'bg-saffron text-white shadow'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'}
                `}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tanpura ── */}
        <button
          onClick={toggleTanpura}
          className={`
            w-full py-3 rounded-xl font-semibold transition text-sm
            ${tanpuraOn
              ? 'bg-indigo-500/80 text-white hover:bg-indigo-500/90'
              : 'bg-white/10 text-white/70 hover:bg-white/20'}
          `}
        >
          {tanpuraOn ? '🎵 Tanpura Playing — Tap to Stop' : '🎵 Start Tanpura Drone'}
        </button>

        {/* ── Swara display ── */}
        <div className="bg-white/5 rounded-2xl p-6">
          <SwaraDisplay
            detected={match?.swara ?? null}
            target={TARGET}
            isOnPitch={isOnPitch}
          />
        </div>

        {/* ── Sur meter ── */}
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
            Sur Meter — Pitch Accuracy
          </p>
          <SurMeter cents={match?.cents ?? null} />
          {detectedHz !== null && (
            <p className="text-white/25 text-xs text-center mt-2 font-mono">
              {detectedHz.toFixed(1)} Hz
            </p>
          )}
        </div>

        {/* ── Mic button ── */}
        {micError && (
          <p className="text-red-400 text-sm text-center">{micError}</p>
        )}
        <button
          onClick={toggleListening}
          className={`
            w-full py-4 rounded-2xl font-bold text-lg transition shadow-lg
            ${listening
              ? 'bg-red-500/80 text-white hover:bg-red-500/90'
              : 'bg-saffron text-white hover:bg-saffron/90'}
          `}
        >
          {listening ? '🎤 Listening… Tap to Stop' : '🎤 Start Listening'}
        </button>

        <p className="text-white/25 text-xs text-center pb-4">
          Sing <span className="text-saffron font-semibold">Sa</span> in shruti{' '}
          <span className="text-saffron font-semibold">{shruti}</span> — hold
          steady and watch the meter
        </p>

      </div>
    </main>
  );
}
