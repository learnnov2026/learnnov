import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PROTECTED_ROUTES = [
  '/admin', '/instructor', '/analytics', '/assignments', '/career',
  '/chat', '/discussions', '/exams', '/labs',
  '/notifications', '/payments', '/profile', '/workspace'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Function to apply security headers to response
  const applySecurityHeaders = (response: NextResponse) => {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    return response;
  };

  // Bypass public routes, API routes (handled by individual routes), and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/login' ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png' ||
    pathname.startsWith('/specializations') ||
    pathname.startsWith('/certificates') ||
    pathname.startsWith('/leaderboard') ||
    pathname.startsWith('/live') ||
    pathname.startsWith('/support')
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Check if trying to access protected UI routes
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/';
  
  if (isProtected) {
    const token = request.cookies.get('learnnov_session')?.value;

    if (!token) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
    }

    const payload = await verifyToken(token);
    
    if (!payload) {
      return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
    }

    // Role Based Access Control (RBAC)
    const role = payload.role;

    // Instructor area protection
    if (pathname.startsWith('/instructor') && role !== 'instructor' && role !== 'admin') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
    }

    // Admin area protection
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)));
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
