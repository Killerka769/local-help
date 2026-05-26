import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// ========================
// ПУБЛИЧНЫЕ МАРШРУТЫ (доступны всем, даже без токена)
// ========================
const PUBLIC_ROUTES = [
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
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',   
  '/api/auth/reset-password',    
  '/api/user/verify-email', 
  '/api/cities',
  '/api/feed',
  '/api/user/check-blocked',
  '/api/auth/validate',
  '/api/users',
  '/api/reviews',
];

// ========================
// АДМИН-МАРШРУТЫ (только для ADMIN и SUPER_ADMIN)
// ========================
const ADMIN_ROUTES = [
  '/admin',
  '/api/admin',
];

// ========================
// ЗАЩИЩЁННЫЕ МАРШРУТЫ (только для авторизованных, НЕ забаненных)
// ========================
const PROTECTED_ROUTES = [
  '/profile',           // свой профиль (без ID)
  '/requests',          // мои заявки
  '/requests/new',      // создание заявки
  '/profile/offers',    // мои отклики
  '/profile/favorites', // избранное
  '/profile/reviews',   // мои отзывы
  '/settings',          // страница настроек
  '/api/requests',      // API создания заявок
  '/api/offers',        // API откликов
  '/api/favorites',     // API избранного
  '/api/my-requests',   // API моих заявок
  '/api/my-offers',     // API моих откликов
  '/api/my-reviews',    // API моих отзывов
  '/api/profile',       // API профиля (PUT)
];

// ========================
// ПУБЛИЧНЫЕ API ДЛЯ ЧТЕНИЯ (доступны всем)
// ========================
const PUBLIC_API_ROUTES = [
  '/api/feed',
  '/api/users',
  '/api/reviews',
  '/api/requests',
  '/api/offers',
  '/api/cities',
];

// ========================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================
function isPublicRoute(path: string): boolean {
  // Точно публичные страницы
  if (PUBLIC_ROUTES.includes(path)) return true;
  // Чужие профили /profile/:id
  if (path.startsWith('/profile/') && path !== '/profile') return true;
  // Публичные API для чтения
  if (PUBLIC_API_ROUTES.some(route => path.startsWith(route))) return true;
  // Просмотр конкретной заявки /requests/:id
  if (path.startsWith('/requests/') && path !== '/requests' && !path.includes('/new')) return true;
  // Просмотр конкретного отклика /offers/:id
  if (path.startsWith('/offers/') && path !== '/offers') return true;
  return false;
}

function isAdminRoute(path: string): boolean {
  return ADMIN_ROUTES.some(route => path.startsWith(route));
}

function isProtectedRoute(path: string): boolean {
  // Защищённые страницы
  if (PROTECTED_ROUTES.includes(path)) return true;
  if (path.startsWith('/profile/') && path !== '/profile') return false; // чужие профили не защищены
  if (path.startsWith('/api/profile')) return true;
  return false;
}

function isBlockedAllowedRoute(path: string): boolean {
  // Страница блокировки
  if (path === '/blocked') return true;
  // Главная и лента
  if (path === '/') return true;
  if (path === '/feed') return true;
  // Чужие профили
  if (path.startsWith('/profile/') && path !== '/profile') return true;
  // Просмотр заявок (только чтение)
  if (path.startsWith('/requests/') && path !== '/requests' && !path.includes('/new')) return true;
  // Просмотр откликов
  if (path.startsWith('/offers/') && path !== '/offers') return true;
  // Публичные страницы
  if (path === '/terms') return true;
  if (path === '/how-it-works') return true;
  // Публичные API для чтения
  if (PUBLIC_API_ROUTES.some(route => path.startsWith(route))) return true;
  // API проверки блокировки
  if (path.startsWith('/api/user/check-blocked')) return true;
  if (path.startsWith('/api/auth/validate')) return true;
  return false;
}

// ========================
// MIDDLEWARE
// ========================
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;

  if (token && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // 1. Публичные маршруты — пропускаем без проверок
  if (isPublicRoute(path)) {
    return NextResponse.next();
  }

  // 2. Нет токена — редирект на логин
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', path);
    
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 3. Верифицируем JWT
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const userRole = payload.role as string || 'USER';
    const tokenSessionVersion = payload.sessionVersion as number || 0;

    if (!userId) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }

    // 4. Проверяем админ-доступ
    if (isAdminRoute(path)) {
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/', request.url));
      }
      // Админские маршруты пропускаем дальше без проверки блокировки
      return NextResponse.next();
    }

    // 5. Для API запросов — пропускаем (блокировку проверяет сам API)
    if (path.startsWith('/api/')) {
      return NextResponse.next();
    }

    // 6. Проверяем валидность токена и блокировку через API
    const checkUrl = new URL('/api/auth/validate', request.url);
    const checkResponse = await fetch(checkUrl.toString(), {
      headers: { Cookie: request.headers.get('cookie') || '' },
    });
    
    if (!checkResponse.ok) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
    
    const { isValid, isBlocked } = await checkResponse.json();
    
    if (!isValid) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
    
    // 7. Если пользователь забанен
    if (isBlocked) {
      // Проверяем, может ли он зайти на этот маршрут
      if (!isBlockedAllowedRoute(path)) {
        return NextResponse.redirect(new URL('/blocked', request.url));
      }
      // Забаненный может только читать, не может создавать/редактировать
      if (path === '/requests/new' || path.includes('/edit') || path.includes('/create')) {
        return NextResponse.redirect(new URL('/blocked', request.url));
      }
      return NextResponse.next();
    }

    // 8. Проверяем защищённые маршруты (требуют авторизации, но не блокировки)
    if (isProtectedRoute(path)) {
      return NextResponse.next();
    }

    if (isAdminRoute(path)) {
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // 9. Всё остальное — пропускаем
    return NextResponse.next();
  } catch (error) {
    console.error('[MIDDLEWARE_JWT_ERROR]', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|images|uploads).*)',
  ],
};