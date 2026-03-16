'use client';

// ─── Swara Recognition Game — Game Page ───────────────────────────────────────
// Phases: setup → playing_tone → awaiting_answer → round_result
//                                                        ↓
//                               streak < 5 → playing_tone (next round)
//                               streak ≥ 5 → level_complete → session_done
//
// All game logic lives in useGameSession hook (lib/useGameSession.ts).
// Audio is handled by SwaraPlayerEngine (lib/swaraPlayer.ts).

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useGameSession, LEVEL_CONFIGS } from '@/lib/useGameSession';
import { SHRUTI_NOTES, type Swara, type ShrutiNote } from '@/lib/swara';
import { SwaraButtonGrid } from '@/components/SwaraButtonGrid';
import { SlotFillUI } from '@/components/SlotFillUI';

const STREAK_TARGET = 5;

// XP level labels
const XP_LABELS = [
  { min: 0,    max: 99,   label: 'Newcomer' },
  { min: 100,  max: 499,  label: 'Shishya' },
  { min: 500,  max: 1499, label: 'Abhyasi' },
  { min: 1500, max: 3499, label: 'Sadhak' },
  { min: 3500, max: 7499, label: 'Praveen' },
  { min: 7500, max: Infinity, label: 'Ustad' },
];

function xpLabel(xp: number): string {
  return XP_LABELS.find(l => xp >= l.min && xp <= l.max)?.label ?? 'Ustad';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GamePage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [playerProfile, setPlayerProfile] = useState<{
    currentLevel: number;
    levelBestScores: Record<string, number>;
  } | null>(null);

  // ── Load username + profile from localStorage ────────────────────────────
  useEffect(() => {
    const savedUser    = localStorage.getItem('rp_username') ?? '';
    const savedProfile = localStorage.getItem('rp_player');
    setUsername(savedUser);
    if (savedProfile) {
      try {
        const p = JSON.parse(savedProfile);
        setPlayerProfile(p);
        // Default level = highest passed (currentLevel)
        if (p.currentLevel) game.selectLevel(p.currentLevel);
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const game = useGameSession();

  // ── Wrong-guess flash state (local to page) ───────────────────────────────
  const [wrongGuess,   setWrongGuess]   = useState<Swara | null>(null);
  const [lastCorrect,  setLastCorrect]  = useState<Swara | null>(null);

  // Timer display
  const [elapsed, setElapsed]           = useState(0);
  const timerRef                        = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start/stop timer based on phase ──────────────────────────────────────
  useEffect(() => {
    if (game.phase === 'awaiting_answer') {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [game.phase]);

  // ── Show correct highlight in round_result ────────────────────────────────
  useEffect(() => {
    if (game.phase === 'round_result' && game.round?.targetSwaras) {
      setLastCorrect(game.round.targetSwaras[0] ?? null);
    } else if (game.phase === 'playing_tone') {
      setLastCorrect(null);
      setWrongGuess(null);
    }
  }, [game.phase, game.round]);

  // ── Answer handler (wraps hook's evaluateAnswer) ─────────────────────────
  const handleAnswer = useCallback((chosen: Swara[]) => {
    if (!game.round) return;
    const correct = chosen.length === game.round.targetSwaras.length
      && chosen.every((v, i) => v === game.round!.targetSwaras[i]);

    if (!correct && chosen.length === 1) {
      setWrongGuess(chosen[0]);
      setTimeout(() => setWrongGuess(null), 350);
    }

    game.evaluateAnswer(chosen);
  }, [game]);

  const levelConfig = LEVEL_CONFIGS[game.selectedLevel - 1];
  const isMultiSwara = levelConfig.sequenceLen > 1;

  // ── Buttons disabled during playback ─────────────────────────────────────
  const buttonsDisabled = game.phase !== 'awaiting_answer' || game.octavePlaying;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER helpers
  // ─────────────────────────────────────────────────────────────────────────

  const renderSetup = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/')}
          className="text-white/50 hover:text-white text-sm transition">← Back</button>
        <h1 className="text-xl font-bold text-saffron">Swara Pariksha</h1>
        <div className="w-16" />
      </div>

      {/* Shruti selector */}
      <div className="bg-white/5 rounded-2xl p-4">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Shruti — Tonic</p>
        <div className="grid grid-cols-6 gap-1.5">
          {SHRUTI_NOTES.map(note => (
            <button key={note} onClick={() => game.setShruti(note as ShrutiNote)}
              className={`py-2 rounded-lg text-sm font-semibold transition
                ${game.shruti === note ? 'bg-saffron text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
              {note}
            </button>
          ))}
        </div>
      </div>

      {/* Level selector */}
      <div className="bg-white/5 rounded-2xl p-4">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Select Level</p>
        <div className="space-y-2">
          {LEVEL_CONFIGS.map(cfg => {
            const best    = playerProfile?.levelBestScores?.[String(cfg.level)] ?? 0;
            const isSelected = cfg.level === game.selectedLevel;
            return (
              <button key={cfg.level} onClick={() => game.selectLevel(cfg.level)}
                className={`w-full rounded-xl p-3 text-left flex items-center justify-between transition
                  ${isSelected ? 'bg-saffron/20 border border-saffron/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
                <div>
                  <span className={`font-semibold text-sm ${isSelected ? 'text-saffron' : 'text-white'}`}>
                    Level {cfg.level}
                  </span>
                  <span className="text-white/40 text-xs ml-2">{cfg.description}</span>
                </div>
                {best > 0 && (
                  <span className="text-white/50 text-xs font-mono ml-2 shrink-0">Best: {best}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Start button */}
      <button onClick={game.startGame}
        className="w-full py-4 rounded-2xl bg-saffron text-white font-bold text-lg
                   hover:bg-saffron/90 transition shadow-lg shadow-saffron/20">
        Start Level {game.selectedLevel}
      </button>
    </div>
  );

  const renderPlayingTone = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="w-24 h-24 rounded-full bg-saffron/20 animate-ping" />
      <div className="w-16 h-16 rounded-full bg-saffron/60 absolute animate-pulse" />
      <p className="text-white/70 text-lg font-medium">🎵 Listen…</p>
      <p className="text-white/30 text-sm">
        {levelConfig.sequenceLen > 1
          ? `Sequence of ${levelConfig.sequenceLen} swaras`
          : 'Identify the swara'}
      </p>
    </div>
  );

  const renderAwaitingAnswer = () => (
    <div className="space-y-5">
      {/* Streak + timer row */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/60">
          🎯{' '}
          <span className="text-saffron font-bold">{game.firstAttemptStreak}</span>
          <span className="text-white/40"> / {STREAK_TARGET} in a row</span>
        </div>
        <div className="font-mono text-white/40 text-sm">{elapsed}s</div>
      </div>

      {/* Question prompt */}
      <div className="bg-white/5 rounded-2xl p-5 text-center">
        <p className="text-white/50 text-sm mb-1">
          {levelConfig.sequenceLen > 1 ? `Identify these ${levelConfig.sequenceLen} swaras in order` : 'Which swara was that?'}
        </p>
        {levelConfig.sequenceLen === 1 && (
          <p className="text-white/20 text-xs">Tap the correct swara below</p>
        )}
      </div>

      {/* Answer UI */}
      {isMultiSwara ? (
        <SlotFillUI
          targetSwaras={game.round?.targetSwaras ?? []}
          swaraPool={levelConfig.swaraPool}
          sequenceLen={levelConfig.sequenceLen}
          disabled={buttonsDisabled}
          roundKey={game.round?.roundNumber ?? 0}
          onComplete={(wrongAttempts) => {
            if (game.round) game.evaluateAnswer(game.round.targetSwaras, wrongAttempts);
          }}
        />
      ) : (
        <SwaraButtonGrid
          swaraPool={levelConfig.swaraPool}
          disabled={buttonsDisabled}
          onAnswer={swara => handleAnswer([swara])}
          lastCorrect={lastCorrect}
          wrongGuess={wrongGuess}
        />
      )}

      {/* Control buttons */}
      <div className="flex gap-2">
        <button onClick={game.replayTone} disabled={game.phase !== 'awaiting_answer' || game.octavePlaying}
          className="flex-1 py-2 rounded-xl bg-white/10 text-white/70 text-sm font-semibold
                     hover:bg-white/20 disabled:opacity-40 transition">
          🔁 Replay
        </button>
        <button
          onClick={game.octavePlaying ? game.stopOctave : game.hearOctave}
          disabled={game.phase !== 'awaiting_answer' && !game.octavePlaying}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition
            ${game.octavePlaying
              ? 'bg-indigo-500/60 text-white hover:bg-indigo-500/70'
              : 'bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-40'}`}>
          {game.octavePlaying ? '⏹ Stop' : '🎵 Hear Octave'}
        </button>
      </div>

      {game.octavePlaying && (
        <p className="text-white/30 text-xs text-center">Playing reference octave…</p>
      )}
    </div>
  );

  const renderRoundResult = () => {
    const lastRound = game.completedRounds[game.completedRounds.length - 1];
    const correct = !!lastRound;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className={`text-6xl ${correct ? 'text-emerald-400' : 'text-red-400'}`}>
          {correct ? '✓' : '✗'}
        </div>
        {lastRound && (
          <>
            <p className="text-white/70 text-sm">
              {lastRound.targetSwaras.join(' → ')}
            </p>
            <p className="text-saffron font-bold text-2xl">+{lastRound.score} pts</p>
            {lastRound.firstAttemptCorrect
              ? <p className="text-emerald-400/80 text-sm">First attempt! 🎯</p>
              : <p className="text-white/40 text-sm">{lastRound.attempts} attempts</p>
            }
          </>
        )}
        <p className="text-white/30 text-xs">Next round starting…</p>
      </div>
    );
  };

  const renderLevelComplete = () => {
    const passed = game.firstAttemptStreak >= STREAK_TARGET;
    return (
      <div className="space-y-5">
        <div className="text-center space-y-2">
          <div className="text-4xl">{passed ? '🏆' : '💪'}</div>
          <h2 className="text-xl font-bold text-white">
            Level {game.selectedLevel} — {passed ? 'Passed!' : 'Keep Practising'}
          </h2>
          <p className="text-saffron font-bold text-3xl">{game.sessionScore} pts</p>
          <p className="text-white/40 text-sm">{game.totalRoundsPlayed} rounds played</p>
        </div>

        {/* Round summary table */}
        <div className="bg-white/5 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 gap-0 text-xs text-white/40 uppercase tracking-wider px-4 py-2">
            <span>#</span><span>Target</span><span className="text-center">Score</span><span className="text-right">Time</span>
          </div>
          <div className="divide-y divide-white/5">
            {game.completedRounds.map(r => (
              <div key={r.roundNumber} className="grid grid-cols-4 gap-0 px-4 py-2 text-sm">
                <span className="text-white/30">{r.roundNumber}</span>
                <span className={`font-mono ${r.firstAttemptCorrect ? 'text-emerald-400' : 'text-white/70'}`}>
                  {r.targetSwaras.join('→')}
                </span>
                <span className="text-saffron text-center font-semibold">{r.score}</span>
                <span className="text-white/30 text-right">{r.secondsTaken.toFixed(1)}s</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button onClick={() => game.submitSession(username)}
            disabled={game.submitting}
            className="w-full py-3 rounded-xl bg-saffron text-white font-semibold text-sm
                       hover:bg-saffron/90 disabled:opacity-50 transition">
            {game.submitting ? 'Saving…' : '💾 Save Score & Continue'}
          </button>
          <button onClick={game.resetToSetup}
            className="w-full py-3 rounded-xl bg-white/10 text-white/70 font-semibold text-sm
                       hover:bg-white/20 transition">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  };

  const renderSessionDone = () => {
    const r = game.result;
    const score = r?.totalScore ?? game.sessionScore;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-5">
        <div className="text-center space-y-3">
          {r?.isNewBest && (
            <div className="bg-saffron/20 text-saffron text-sm font-bold px-4 py-2 rounded-full
                            border border-saffron/40 inline-block">
              🏆 New Best!
            </div>
          )}
          <div className="text-5xl">🎵</div>
          <h2 className="text-xl font-bold text-white">Session Complete</h2>
          <p className="text-saffron font-bold text-4xl">{score} pts</p>
          <p className="text-white/40 text-sm">
            Level {game.selectedLevel} · {game.totalRoundsPlayed} rounds · {xpLabel(score)}
          </p>
          {r?.sessionId && (
            <p className="text-white/20 text-xs font-mono">Session #{r.sessionId}</p>
          )}
        </div>

        <div className="space-y-2 w-full">
          <button onClick={game.startGame}
            className="w-full py-3 rounded-xl bg-saffron text-white font-semibold text-sm
                       hover:bg-saffron/90 transition">
            Play Again
          </button>
          <button onClick={game.resetToSetup}
            className="w-full py-3 rounded-xl bg-white/10 text-white/70 font-semibold text-sm
                       hover:bg-white/20 transition">
            Change Level
          </button>
          <button onClick={() => router.push('/')}
            className="w-full py-2 text-white/30 text-sm hover:text-white/60 transition">
            ← Home
          </button>
        </div>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-raga px-4 py-6">
      <div className="max-w-md mx-auto">

        {/* Back button + title (shown during active play phases) */}
        {game.phase !== 'setup' && game.phase !== 'session_done' && (
          <div className="flex items-center justify-between mb-5">
            <button onClick={game.resetToSetup}
              className="text-white/50 hover:text-white text-sm transition">← Setup</button>
            <h1 className="text-lg font-bold text-saffron">
              Level {game.selectedLevel}
            </h1>
            <div className="text-white/40 text-sm font-semibold">
              {game.sessionScore} pts
            </div>
          </div>
        )}

        {/* Phase content */}
        {game.phase === 'setup'           && renderSetup()}
        {game.phase === 'playing_tone'    && renderPlayingTone()}
        {game.phase === 'awaiting_answer' && renderAwaitingAnswer()}
        {game.phase === 'round_result'    && renderRoundResult()}
        {game.phase === 'level_complete'  && renderLevelComplete()}
        {game.phase === 'session_done'    && renderSessionDone()}

      </div>
    </main>
  );
}
