import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;


  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/staff') || 
    pathname.startsWith('/user-management') ||
    pathname === '/'; 

  const isAuthRoute = pathname === '/login' || pathname === '/register';

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
    '/organization/:path*',      // SMS bhitra ko folder
    '/user-management/:path*',   // SMS bhitra ko folder
  ],
};