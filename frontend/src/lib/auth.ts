/**
 * Auth helpers — store JWT in an httpOnly-style cookie via a set-cookie approach.
 * For static export we use document.cookie (not httpOnly) and clear it on logout.
 * In prod, server-side middleware would set httpOnly cookies.
 */

const TOKEN_KEY = 'raag_token';
const EMAIL_KEY = 'raag_email';

export function saveAuth(token: string, email: string) {
  if (typeof window === 'undefined') return;
  // 24-hour expiry matches backend JWT expiry
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${TOKEN_KEY}=${token}; expires=${expires}; path=/; SameSite=Strict`;
  document.cookie = `${EMAIL_KEY}=${email}; expires=${expires}; path=/; SameSite=Strict`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return getCookieValue(TOKEN_KEY);
}

export function getEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return getCookieValue(EMAIL_KEY);
}

export function clearAuth() {
  if (typeof window === 'undefined') return;
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  document.cookie = `${EMAIL_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

function getCookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function apiRegister(email: string, password: string) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Register failed (${res.status})`);
  }
  return res.json() as Promise<{ token: string; email: string }>;
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Invalid email or password');
  return res.json() as Promise<{ token: string; email: string }>;
}
