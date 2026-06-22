// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// export function middleware(request: NextRequest) {
//   const token = request.cookies.get('auth_token')?.value;
//   const userInfoRaw = request.cookies.get('user_info')?.value;
//   const { pathname } = request.nextUrl;

//   // 1. Static resources lai bypass garne (Yesle 307 loop rokcha)
//   if (
//     pathname.startsWith('/_next') || 
//     pathname.includes('.') || 
//     pathname.startsWith('/api')
//   ) {
//     return NextResponse.next();
//   }

//   // 2. Token chaina bhane
//   if (!token) {
//     if (pathname !== '/login' && pathname !== '/register' && pathname !== '/forgot-password') {
//       return NextResponse.redirect(new URL('/login', request.url));
//     }
//     return NextResponse.next();
//   }

//   // 3. Token chha bhane Dashboard logic
//   if (pathname === '/login' || pathname === '/') {
//     try {
//       if (userInfoRaw) {
//         const user = JSON.parse(decodeURIComponent(userInfoRaw));
//         const role = user.role?.toLowerCase();
        
//         const rolePaths: Record<string, string> = {
//           "superadmin": "/dashboard",
//           "admin": "/dashboard",
//           "teacher": "/teacher-dashboard",
//           "student": "/student-dashboard",
//           "staff": "/staff-dashboard",
//           "parent": "/parent-dashboard",
//         };

//         const target = rolePaths[role] || "/login";
//         return NextResponse.redirect(new URL(target, request.url));
//       }
//     } catch (e) {
//       // Cookie corrupted bhaye clear garne
//       const response = NextResponse.redirect(new URL('/login', request.url));
//       response.cookies.delete('auth_token');
//       response.cookies.delete('user_info');
//       return response;
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   // Optimized matcher
//   matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
// };




import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that never require a token
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const userInfoRaw = request.cookies.get('user_info')?.value;
  const { pathname } = request.nextUrl;

  // 1. Bypass static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // 2. If logged in and visiting a public route → redirect to their dashboard
  if (token && userInfoRaw && PUBLIC_ROUTES.includes(pathname)) {
    try {
      const user = JSON.parse(decodeURIComponent(userInfoRaw));
      const role = user.role?.toLowerCase();

      const rolePaths: Record<string, string> = {
        "super admin": "/dashboard",
        "superadmin": "/dashboard",
        "admin": "/dashboard",
        "teacher": "/teacher-dashboard",
        "student": "/student-dashboard",
        "staff": "/staff-dashboard",
        "parent": "/parent-dashboard",
      };

      const target = rolePaths[role] ?? "/login";
      return NextResponse.redirect(new URL(target, request.url));
    } catch {
      // Corrupted cookie → clear and send to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      response.cookies.delete('user_info');
      return response;
    }
  }

  // 3. No token and visiting a protected route → send to landing page (/)
  if (!token && !PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. Everything else passes through
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};