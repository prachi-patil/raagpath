import { NextRequest, NextResponse } from 'next/server';

// ─── Auth middleware — disabled for username-based flow ────────────────────────
// JWT auth routes are still available in the backend but the UI now uses a
// username-only identity model. No redirects needed.
//
// Original protected routes:
//   const PROTECTED = ['/dashboard', '/practice'];
//   const GUEST_ONLY = ['/login', '/register'];
//
// To re-enable JWT auth guards, uncomment the logic below and restore PROTECTED/
// GUEST_ONLY, then add the 'raag_token' cookie check.

export function middleware(_request: NextRequest) {
  // All routes are accessible — no JWT checks in username-based flow
  return NextResponse.next();
}

export const config = {
  // Keep matcher so middleware still runs on these paths (future use)
  matcher: ['/dashboard/:path*', '/practice/:path*', '/game/:path*', '/login', '/register'],
};
