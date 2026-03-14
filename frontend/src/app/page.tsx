'use client';

// ─── RaagPath Landing Page ─────────────────────────────────────────────────────
// Username-based entry: user types their name → POST /api/players/join
// On success: show two mode cards — Riyaaz (Practice) and Swara Pariksha (Game)
// Username and player profile are persisted to localStorage for return visits.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface PlayerProfile {
  id: number;
  username: string;
  currentLevel: number;
  levelBestScores: Record<string, number>;
}

const USERNAME_KEY = 'rp_username';
const PLAYER_KEY   = 'rp_player';

export default function Home() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [player,   setPlayer]   = useState<PlayerProfile | null>(null);

  // ── Restore from localStorage on first render ─────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(USERNAME_KEY);
    if (saved) setUsername(saved);

    const savedProfile = localStorage.getItem(PLAYER_KEY);
    if (savedProfile) {
      try { setPlayer(JSON.parse(savedProfile)); } catch { /* ignore */ }
    }
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (name: string): string => {
    if (!name.trim()) return 'Please enter a username';
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(name.trim()))
      return 'Username must be 3–20 characters: letters, numbers, underscore only';
    return '';
  };

  // ── Join / Create player ─────────────────────────────────────────────────
  const handleJoin = async () => {
    const trimmed = username.trim();
    const validationError = validate(trimmed);
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');
    try {
      const profile = await apiFetch<PlayerProfile>('/api/players/join', {
        method: 'POST',
        body: JSON.stringify({ username: trimmed }),
      });
      localStorage.setItem(USERNAME_KEY, profile.username);
      localStorage.setItem(PLAYER_KEY, JSON.stringify(profile));
      setPlayer(profile);
    } catch {
      setError('Could not connect to server — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeName = () => {
    setPlayer(null);
    setUsername('');
    localStorage.removeItem(PLAYER_KEY);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-raga flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full space-y-8">

        {/* ── Logo ── */}
        <div className="text-center">
          <div className="text-5xl mb-3">🎵</div>
          <h1 className="text-4xl font-bold text-saffron tracking-tight">RaagPath</h1>
          <p className="text-white/50 text-sm mt-2">Indian Classical Music Practice</p>
        </div>

        {!player ? (
          /* ── Username Entry ── */
          <div className="space-y-4">
            <p className="text-white/60 text-sm text-center">Enter your name to begin</p>

            <div className="space-y-3">
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && !loading && handleJoin()}
                placeholder="Your name  (e.g. Priya)"
                maxLength={20}
                autoFocus
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl
                           px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-saffron/60
                           transition"
              />

              {error && (
                <p className="text-red-400 text-xs text-center">{error}</p>
              )}

              <button
                onClick={handleJoin}
                disabled={loading || !username.trim()}
                className="w-full py-3 rounded-xl bg-saffron text-white font-semibold
                           text-sm hover:bg-saffron/90 disabled:opacity-50 transition
                           shadow-lg shadow-saffron/20"
              >
                {loading ? 'Joining…' : "Let's Go →"}
              </button>
            </div>
          </div>

        ) : (
          /* ── Mode Selection Cards ── */
          <div className="space-y-4">
            <p className="text-white/60 text-sm text-center">
              Welcome back,{' '}
              <span className="text-saffron font-semibold">{player.username}</span>!
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Riyaaz — Practice */}
              <button
                onClick={() => router.push('/practice')}
                className="bg-white/10 hover:bg-white/20 active:bg-white/25 transition
                           rounded-2xl p-5 text-left space-y-2 border border-white/10"
              >
                <div className="text-3xl">🎤</div>
                <div className="text-white font-semibold text-sm">Riyaaz</div>
                <div className="text-white/40 text-xs leading-relaxed">
                  Practice Swara with mic feedback
                </div>
              </button>

              {/* Swara Pariksha — Game */}
              <button
                onClick={() => router.push('/game')}
                className="bg-saffron/15 hover:bg-saffron/25 active:bg-saffron/30 transition
                           rounded-2xl p-5 text-left space-y-2 border border-saffron/30"
              >
                <div className="text-3xl">🎯</div>
                <div className="text-white font-semibold text-sm">Swara Pariksha</div>
                <div className="text-white/40 text-xs leading-relaxed">
                  Test your swara knowledge
                </div>
              </button>
            </div>

            {/* Change name link */}
            <button
              onClick={handleChangeName}
              className="w-full text-white/25 text-xs text-center hover:text-white/50
                         transition py-1"
            >
              Not {player.username}? Change name
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
