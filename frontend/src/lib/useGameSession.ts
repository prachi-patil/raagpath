// ─── useGameSession — Swara Recognition Game State ────────────────────────────
// Manages all game state: phases, rounds, scoring, streak, and session submission.
//
// Phase flow:
//   setup → playing_tone → awaiting_answer → round_result
//                                                ↓
//                            streak < 5 → playing_tone (next round)
//                            streak = 5 → level_complete → session_done
//
// Scoring: max(10, 100 - (attempts - 1) * 30)
// Progression: 5 consecutive firstAttemptCorrect answers required to pass

import { useCallback, useRef, useState } from 'react';
import { SHUDDHA as _SHUDDHA, type Swara, type ShrutiNote } from './swara';
import { SwaraPlayerEngine } from './swaraPlayer';
import { apiFetch } from './api';

// ── Level definitions ─────────────────────────────────────────────────────────

export interface LevelConfig {
  level:       number;
  swaraPool:   readonly Swara[];
  sequenceLen: number;
  description: string;
}

export const SHUDDHA: readonly Swara[] = _SHUDDHA;

export const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, swaraPool: SHUDDHA, sequenceLen: 1, description: 'Single shuddha swara' },
  { level: 2, swaraPool: SHUDDHA, sequenceLen: 2, description: '2-swara sequences' },
  { level: 3, swaraPool: SHUDDHA, sequenceLen: 3, description: '3-swara sequences' },
  { level: 4, swaraPool: SHUDDHA, sequenceLen: 4, description: '4-swara sequences' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export type GamePhase =
  | 'setup'
  | 'playing_tone'
  | 'awaiting_answer'
  | 'round_result'
  | 'level_complete'
  | 'session_done';

export interface RoundState {
  roundNumber:        number;
  targetSwaras:       Swara[];
  attempts:           number;
  firstAttemptWrong:  boolean;
  startedAt:          number;
  secondsTaken:       number | null;
  correct:            boolean | null;
}

export interface CompletedRound {
  roundNumber:         number;
  targetSwaras:        Swara[];
  firstAttemptCorrect: boolean;
  secondsTaken:        number;
  attempts:            number;
  score:               number;
}

export interface SessionResult {
  sessionId:  number | null;
  totalScore: number;
  passed:     boolean;
  isNewBest:  boolean;
}

export interface GameSessionState {
  phase:               GamePhase;
  selectedLevel:       number;
  shruti:              ShrutiNote;
  round:               RoundState | null;
  completedRounds:     CompletedRound[];
  firstAttemptStreak:  number;
  totalRoundsPlayed:   number;
  sessionScore:        number;
  octavePlaying:       boolean;
  submitting:          boolean;
  result:              SessionResult | null;
  selectLevel:         (level: number) => void;
  setShruti:           (s: ShrutiNote) => void;
  startGame:           () => Promise<void>;
  evaluateAnswer:      (chosen: Swara[], extraAttempts?: number) => void;
  replayTone:          () => Promise<void>;
  hearOctave:          () => Promise<void>;
  stopOctave:          () => void;
  submitSession:       (username: string) => Promise<void>;
  resetToSetup:        () => void;
}

const STREAK_TARGET = 5;

function computeRoundScore(attempts: number): number {
  return Math.max(10, 100 - (attempts - 1) * 30);
}

/** Fisher-Yates partial shuffle — picks `len` unique items from `pool`. */
function pickSequence<T>(pool: readonly T[], len: number): T[] {
  const arr = [...pool];
  const end = Math.min(len, arr.length);
  for (let i = 0; i < end; i++) {
    const j = i + Math.floor(Math.random() * (arr.length - i));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, end);
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGameSession(): GameSessionState {
  const engineRef = useRef<SwaraPlayerEngine | null>(null);

  const getEngine = (): SwaraPlayerEngine => {
    if (!engineRef.current) engineRef.current = new SwaraPlayerEngine();
    return engineRef.current;
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase,              setPhase]           = useState<GamePhase>('setup');
  const [selectedLevel,      setSelectedLevel]   = useState(1);
  const [shruti,             setShruti_]         = useState<ShrutiNote>('C');
  const [round,              setRound]           = useState<RoundState | null>(null);
  const [completedRounds,    setCompletedRounds] = useState<CompletedRound[]>([]);
  const [firstAttemptStreak, setStreak]          = useState(0);
  const [totalRoundsPlayed,  setTotalRounds]     = useState(0);
  const [sessionScore,       setSessionScore]    = useState(0);
  const [octavePlaying,      setOctavePlaying]   = useState(false);
  const [submitting,         setSubmitting]      = useState(false);
  const [result,             setResult]          = useState<SessionResult | null>(null);

  // ── Refs for latest mutable values (avoids stale closures) ────────────────
  const streakRef        = useRef(0);
  const completedRef     = useRef<CompletedRound[]>([]);
  const scoreRef         = useRef(0);
  const roundNumRef      = useRef(0);
  const roundRef         = useRef<RoundState | null>(null);  // mirrors round state
  const selectedLevelRef = useRef(1);
  const shrutiRef        = useRef<ShrutiNote>('C');

  // Helper: update both round state and ref atomically
  const setRoundSync = (r: RoundState | null) => {
    roundRef.current = r;
    setRound(r);
  };

  // ── Public setters ────────────────────────────────────────────────────────

  const selectLevel = useCallback((level: number) => {
    selectedLevelRef.current = level;
    setSelectedLevel(level);
  }, []);

  const setShruti = useCallback((s: ShrutiNote) => {
    shrutiRef.current = s;
    setShruti_(s);
  }, []);

  // ── Internal: play a new round ────────────────────────────────────────────

  const playNextRound = useCallback(async () => {
    const level   = selectedLevelRef.current;
    const sh      = shrutiRef.current;
    const config  = LEVEL_CONFIGS[level - 1];
    const targets = pickSequence(config.swaraPool, config.sequenceLen) as Swara[];

    roundNumRef.current += 1;

    const newRound: RoundState = {
      roundNumber:       roundNumRef.current,
      targetSwaras:      targets,
      attempts:          0,
      firstAttemptWrong: false,
      startedAt:         0,
      secondsTaken:      null,
      correct:           null,
    };

    setRoundSync(newRound);
    setPhase('playing_tone');
    setTotalRounds(prev => prev + 1);

    const engine = getEngine();
    if (config.sequenceLen === 1) {
      await engine.playSwara(targets[0], sh);
    } else {
      await engine.playSequence(targets, sh);
    }

    // Start timer when playback ends
    const withTimer: RoundState = { ...newRound, startedAt: Date.now() };
    setRoundSync(withTimer);
    setPhase('awaiting_answer');
  }, []); // stable — all values read from refs

  // ── Start game ───────────────────────────────────────────────────────────

  const startGame = useCallback(async () => {
    const engine = getEngine();
    await engine.ensureInitialised();   // MUST be called inside a click handler

    // Reset counters
    streakRef.current     = 0;
    completedRef.current  = [];
    scoreRef.current      = 0;
    roundNumRef.current   = 0;

    setStreak(0);
    setCompletedRounds([]);
    setSessionScore(0);
    setTotalRounds(0);
    setResult(null);

    await playNextRound();
  }, [playNextRound]);

  // ── Evaluate an answer ────────────────────────────────────────────────────

  const evaluateAnswer = useCallback((chosen: Swara[], extraAttempts = 0) => {
    const prev = roundRef.current;
    if (!prev) return;

    const currentAttempts = prev.attempts + 1 + extraAttempts;
    const correct         = arraysEqual(chosen, prev.targetSwaras);
    // First attempt = no prior attempts in this round and no wrong slot fills
    const isFirstAttempt  = prev.attempts === 0 && extraAttempts === 0;

    if (!correct) {
      // Wrong tap — increment attempts, note first-attempt failure
      setRoundSync({
        ...prev,
        attempts:          currentAttempts,
        firstAttemptWrong: isFirstAttempt ? true : prev.firstAttemptWrong,
      });
      return;
    }

    // ── Correct ──────────────────────────────────────────────────────────────
    const secondsTaken        = (Date.now() - prev.startedAt) / 1000;
    const firstAttemptCorrect = isFirstAttempt && !prev.firstAttemptWrong;
    const score               = computeRoundScore(currentAttempts);

    const completed: CompletedRound = {
      roundNumber:         prev.roundNumber,
      targetSwaras:        prev.targetSwaras,
      firstAttemptCorrect,
      secondsTaken,
      attempts:            currentAttempts,
      score,
    };

    const newStreak = firstAttemptCorrect ? streakRef.current + 1 : 0;
    streakRef.current    = newStreak;
    scoreRef.current    += score;
    completedRef.current = [...completedRef.current, completed];

    // Batch all state updates together (React 18 auto-batches these)
    setRoundSync({ ...prev, attempts: currentAttempts, secondsTaken, correct: true });
    setStreak(newStreak);
    setSessionScore(scoreRef.current);
    setCompletedRounds([...completedRef.current]);
    setPhase('round_result');

    // After showing round_result for 1.5s, advance
    setTimeout(() => {
      if (streakRef.current >= STREAK_TARGET) {
        setPhase('level_complete');
      } else {
        void playNextRound();
      }
    }, 1500);
  }, [playNextRound]);

  // ── Replay tone ──────────────────────────────────────────────────────────

  const replayTone = useCallback(async () => {
    const engine = getEngine();
    if (engine.playing) return;
    const prev = roundRef.current;
    if (!prev) return;

    // Brief silence so any reverb tail from a just-stopped octave fully clears
    // before the question tone starts. Also gives the synth release time to finish.
    await new Promise(r => setTimeout(r, 200));
    if (engine.playing) return;  // another playback started during the pause

    const config = LEVEL_CONFIGS[selectedLevelRef.current - 1];
    setPhase('playing_tone');

    if (config.sequenceLen === 1) {
      await engine.playSwara(prev.targetSwaras[0], shrutiRef.current);
    } else {
      await engine.playSequence(prev.targetSwaras, shrutiRef.current);
    }
    setPhase('awaiting_answer');
  }, []);

  // ── Reference octave ─────────────────────────────────────────────────────

  const hearOctave = useCallback(async () => {
    const engine = getEngine();
    if (engine.playing) return;
    setOctavePlaying(true);
    try {
      await engine.playOctave(shrutiRef.current);
    } finally {
      setOctavePlaying(false);
    }
  }, []);

  const stopOctave = useCallback(() => {
    getEngine().stopPlayback();
    setOctavePlaying(false);
  }, []);

  // ── Submit session ────────────────────────────────────────────────────────

  const submitSession = useCallback(async (username: string) => {
    if (!username) {
      setResult({ sessionId: null, totalScore: scoreRef.current, passed: true, isNewBest: false });
      setPhase('session_done');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        username,
        level:  selectedLevelRef.current,
        shruti: shrutiRef.current,
        rounds: completedRef.current.map(r => ({
          roundNumber:         r.roundNumber,
          targetSwaras:        r.targetSwaras,
          firstAttemptCorrect: r.firstAttemptCorrect,
          secondsTaken:        r.secondsTaken,
          attempts:            r.attempts,
        })),
      };

      const resp = await apiFetch<{
        sessionId: number; totalScore: number; passed: boolean; isNewBest: boolean;
      }>('/api/game/sessions', { method: 'POST', body: JSON.stringify(payload) });

      setResult({ ...resp, sessionId: resp.sessionId });

      // Refresh player profile in localStorage (non-critical)
      try {
        const profile = await apiFetch<Record<string, unknown>>('/api/players/join', {
          method: 'POST', body: JSON.stringify({ username }),
        });
        localStorage.setItem('rp_player', JSON.stringify(profile));
      } catch { /* ignore — non-critical */ }

    } catch {
      setResult({ sessionId: null, totalScore: scoreRef.current, passed: true, isNewBest: false });
    } finally {
      setSubmitting(false);
      setPhase('session_done');
    }
  }, []);

  // ── Reset to setup ────────────────────────────────────────────────────────

  const resetToSetup = useCallback(() => {
    getEngine().stopPlayback();
    roundRef.current     = null;
    streakRef.current    = 0;
    completedRef.current = [];
    scoreRef.current     = 0;
    roundNumRef.current  = 0;

    setPhase('setup');
    setRound(null);
    setCompletedRounds([]);
    setStreak(0);
    setTotalRounds(0);
    setSessionScore(0);
    setResult(null);
  }, []);

  return {
    phase, selectedLevel, shruti, round, completedRounds,
    firstAttemptStreak, totalRoundsPlayed, sessionScore,
    octavePlaying, submitting, result,
    selectLevel, setShruti, startGame, evaluateAnswer,
    replayTone, hearOctave, stopOctave, submitSession, resetToSetup,
  };
}
