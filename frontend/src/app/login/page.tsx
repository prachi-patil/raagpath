'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiLogin, saveAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      saveAuth(data.token, data.email);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-raga px-4">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-saffron text-center mb-2">RaagPath</h1>
        <p className="text-white/60 text-center mb-8 text-sm">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/40
                         border border-white/20 focus:outline-none focus:border-saffron"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/40
                         border border-white/20 focus:outline-none focus:border-saffron"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-saffron text-white font-semibold
                       hover:bg-saffron/90 disabled:opacity-50 transition"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-white/50 text-center text-sm mt-6">
          No account?{' '}
          <Link href="/register" className="text-saffron hover:underline">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
