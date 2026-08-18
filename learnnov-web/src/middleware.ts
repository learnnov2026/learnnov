import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PROTECTED_UI_ROUTES = [
  '/admin', '/instructor', '/analytics', '/assignments', '/career',
  '/chat', '/discussions', '/exams', '/labs',
  '/notifications', '/payments', '/profile', '/workspace'
];

// Public API endpoints that do not require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-otp',
  '/api/auth/sso',
  '/api/auth/logout'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security Headers Helper
  const applySecurityHeaders = (response: NextResponse) => {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    return response;
  };

  // 1. Static and system assets
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png' ||
    pathname.startsWith('/images')
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 2. Extract Token
  const token = request.cookies.get('learnnov_session')?.value || 
    (request.headers.get('authorization')?.startsWith('Bearer ') 
      ? request.headers.get('authorization')?.substring(7).trim() 
      : undefined);

  let payload = null;
  if (token) {
    payload = await verifyToken(token);
  }

  // 3. API Gateway RBAC Protection
  if (pathname.startsWith('/api')) {
    const isPublicApi = PUBLIC_API_ROUTES.some(route => pathname.startsWith(route)) ||
      (pathname === '/api/courses' && request.method === 'GET') ||
      (pathname.startsWith('/api/programs/programs') && request.method === 'GET') ||
      (pathname.startsWith('/api/programs/specializations') && request.method === 'GET') ||
      (pathname.startsWith('/api/certificates/verify') && request.method === 'GET') ||
      (pathname.startsWith('/api/discussions') && request.method === 'GET') ||
      (pathname.startsWith('/api/exams') && request.method === 'GET') ||
      (pathname === '/api/leaderboard' && request.method === 'GET');

    if (!isPublicApi) {
      // Require valid token for protected API routes
      if (!payload || !payload.userId) {
        return applySecurityHeaders(
          NextResponse.json({ error: 'غير مصرح: يرجى تسجيل الدخول أولاً' }, { status: 401 })
        );
      }

      // Admin API routes gateway check
      if (pathname.startsWith('/api/admin') && payload.role !== 'admin') {
        return applySecurityHeaders(
          NextResponse.json({ error: 'ممنوع: الوصول محصور بمديري النظام فقط' }, { status: 403 })
        );
      }

      // Instructor API routes gateway check
      if (pathname.startsWith('/api/instructor') && payload.role !== 'instructor' && payload.role !== 'admin') {
        return applySecurityHeaders(
          NextResponse.json({ error: 'ممنوع: الوصول محصور بالمشرفين وهيئة التدريس' }, { status: 403 })
        );
      }
    }

    return applySecurityHeaders(NextResponse.next());
  }

  // 4. Protected UI Pages Protection
  const isProtectedUI = PROTECTED_UI_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedUI) {
    if (!payload || !payload.userId) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL('/login', request.url))
      );
    }

    // Protect /admin UI
    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      return applySecurityHeaders(
        NextResponse.redirect(new URL('/', request.url))
      );
    }

    // Protect /instructor UI
    if (pathname.startsWith('/instructor') && payload.role !== 'instructor' && payload.role !== 'admin') {
      return applySecurityHeaders(
        NextResponse.redirect(new URL('/', request.url))
      );
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
