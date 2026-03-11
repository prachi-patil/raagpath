'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getEmail, clearAuth, isLoggedIn } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
      return;
    }
    setEmail(getEmail() ?? '');
  }, [router]);

  function handleLogout() {
    clearAuth();
    router.replace('/login');
  }

  return (
    <main className="min-h-screen bg-raga px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-saffron">RaagPath</h1>
          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white text-sm transition"
          >
            Sign out
          </button>
        </div>

        {/* Welcome card */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
          <p className="text-white/60 text-sm mb-1">Welcome back</p>
          <p className="text-white font-semibold truncate">{email}</p>
        </div>

        {/* XP card (placeholder — wired in Day 4) */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
          <p className="text-white/60 text-sm mb-2">Total XP</p>
          <div className="text-4xl font-bold text-gold">0</div>
          <div className="mt-3 h-2 rounded-full bg-white/20">
            <div className="h-2 rounded-full bg-gold w-0" />
          </div>
        </div>

        {/* Start session CTA */}
        <button
          onClick={() => router.push('/practice')}
          className="w-full py-4 rounded-2xl bg-saffron text-white text-lg font-bold
                     hover:bg-saffron/90 transition shadow-lg"
        >
          Start Practice Session
        </button>
      </div>
    </main>
  );
}
