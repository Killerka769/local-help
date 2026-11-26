import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecretBytes } from '@/lib/jwt';

const PUBLIC_PAGES = new Set([
  '/',
  '/login',
  '/register',
  '/feed',
  '/blocked',
  '/terms',
  '/how-it-works',
  '/privacy',
  '/faq',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/advertising',
]);

function isPublicPage(path: string): boolean {
  if (PUBLIC_PAGES.has(path)) return true;
  if (path.startsWith('/profile/') && path !== '/profile') return true;
  if (path.startsWith('/requests/') && path !== '/requests' && !path.includes('/new')) return true;
  if (path.startsWith('/offers/') && path !== '/offers') return true;
  return false;
}

function isPublicApi(path: string, method: string): boolean {
  if (method !== 'GET') {
    return (
      path === '/api/auth/login' ||
      path === '/api/auth/register' ||
      path === '/api/auth/forgot-password' ||
      path === '/api/auth/reset-password'
    );
  }

  if (path === '/api/feed') return true;
  if (path === '/api/cities') return true;
  if (path === '/api/auth/validate') return true;
  if (path === '/api/user/check-blocked') return true;
  if (path === '/api/user/verify-email') return true;
  if (path === '/api/cron/expire-requests') return true;
  if (path.startsWith('/api/users/')) return true;
  if (path.startsWith('/api/reviews/user/')) return true;
  if (/^\/api\/requests\/[^/]+$/.test(path)) return true;
  if (/^\/api\/offers\/[^/]+$/.test(path)) return true;
  if (path === '/api/requests') return true;
  return false;
}

function isAdminRoute(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/') || path.startsWith('/api/admin');
}

function isBlockedAllowedRoute(path: string): boolean {
  if (path === '/blocked' || path === '/' || path === '/feed') return true;
  if (path === '/terms' || path === '/how-it-works' || path === '/privacy' || path === '/faq') return true;
  if (path.startsWith('/profile/') && path !== '/profile') return true;
  if (path.startsWith('/requests/') && path !== '/requests' && !path.includes('/new')) return true;
  if (path.startsWith('/offers/') && path !== '/offers') return true;
  if (path.startsWith('/api/feed')) return true;
  if (path.startsWith('/api/cities')) return true;
  if (path.startsWith('/api/users/')) return true;
  if (path.startsWith('/api/reviews/user/')) return true;
  if (/^\/api\/requests\/[^/]+$/.test(path)) return true;
  if (/^\/api\/offers\/[^/]+$/.test(path)) return true;
  if (path.startsWith('/api/user/check-blocked')) return true;
  if (path.startsWith('/api/auth/validate')) return true;
  if (path.startsWith('/api/auth/logout')) return true;
  return false;
}

function clearAuth(url: string, asJson: boolean) {
  const response = asJson
    ? NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    : NextResponse.redirect(new URL('/login', url));
  response.cookies.delete('token');
  return response;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;
  const token = request.cookies.get('token')?.value;
  const isApi = path.startsWith('/api/');

  if (token && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isPublicPage(path) || isPublicApi(path, method)) {
    return NextResponse.next();
  }

  if (!token) {
    if (isApi) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', path);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    const userId = payload.userId as string;
    if (!userId) {
      return clearAuth(request.url, isApi);
    }

    const checkUrl = new URL('/api/auth/validate', request.url);
    const checkResponse = await fetch(checkUrl.toString(), {
      headers: { Cookie: request.headers.get('cookie') || '' },
    });

    if (!checkResponse.ok) {
      return clearAuth(request.url, isApi);
    }

    const { isValid, isBlocked, role } = await checkResponse.json();

    if (!isValid) {
      return clearAuth(request.url, isApi);
    }

    if (isAdminRoute(path)) {
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        if (isApi) {
          return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (isBlocked) {
        if (isApi) {
          return NextResponse.json({ error: 'Ваш аккаунт заблокирован' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/blocked', request.url));
      }
      return NextResponse.next();
    }

    if (isBlocked) {
      if (!isBlockedAllowedRoute(path) || path === '/requests/new' || path.includes('/edit')) {
        if (isApi) {
          return NextResponse.json({ error: 'Ваш аккаунт заблокирован' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/blocked', request.url));
      }
    }

    return NextResponse.next();
  } catch {
    return clearAuth(request.url, isApi);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|images).*)',
  ],
};
