import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED = ['/dashboard', '/practice'];
// Routes only for guests (redirect to dashboard if already logged in)
const GUEST_ONLY = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('raag_token')?.value;

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isGuestOnly = GUEST_ONLY.some(p => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isGuestOnly && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/practice/:path*', '/login', '/register'],
};
