import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// middleware.ts
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- allowlist: публичные API для отзывов ---
  if (
    pathname.startsWith('/api/reviewty/public-card') ||
    pathname.startsWith('/api/reviewty/reviews')
  ) {
    return NextResponse.next();
  }

  // ... остальная ваша логика проверки сессии/токена/ролей ...
  // например:
  // if (pathname.startsWith('/api')) {
  //   const token = req.headers.get('authorization');
  //   if (!token) return NextResponse.json({ ok:false, message:'Unauthorized' }, { status: 401 });
  // }

  return NextResponse.next();
}

// если у вас есть config.matcher — оставьте как есть
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
