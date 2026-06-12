import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const userInfoRaw = request.cookies.get('user_info')?.value;
  const { pathname } = request.nextUrl;

  // 1. Static resources lai bypass garne (Yesle 307 loop rokcha)
  if (
    pathname.startsWith('/_next') || 
    pathname.includes('.') || 
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // 2. Token chaina bhane
  if (!token) {
    if (pathname !== '/login' && pathname !== '/register' && pathname !== '/forgot-password') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 3. Token chha bhane Dashboard logic
  if (pathname === '/login' || pathname === '/') {
    try {
      if (userInfoRaw) {
        const user = JSON.parse(decodeURIComponent(userInfoRaw));
        const role = user.role?.toLowerCase();
        
        const rolePaths: Record<string, string> = {
          "superadmin": "/dashboard",
          "admin": "/dashboard",
          "teacher": "/teacher-dashboard",
          "student": "/student-dashboard",
          "staff": "/staff-dashboard",
          "parent": "/parent-dashboard",
        };

        const target = rolePaths[role] || "/login";
        return NextResponse.redirect(new URL(target, request.url));
      }
    } catch (e) {
      // Cookie corrupted bhaye clear garne
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      response.cookies.delete('user_info');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  // Optimized matcher
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};