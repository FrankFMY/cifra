/**
 * @fileoverview Cifra Platform — Initiative Development / Инициативная разработка
 * @author Artyom Pryanishnikov <Pryanishnikovartem@gmail.com>
 * @copyright 2025 Artyom Pryanishnikov
 * @license PolyForm-Shield-1.0.0
 * 
 * INITIATIVE DEVELOPMENT: Created independently, without TZ or direct order.
 * IP rights remain with the Author. Commercial use requires agreement.
 * Contact: Pryanishnikovartem@gmail.com
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/products', '/marketing', '/customers', '/settings'];

// Public routes that don't require authentication
const _publicRoutes = ['/auth', '/product'];

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if route is protected
	const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

	// Get auth token from cookies (PocketBase uses pb_auth cookie)
	const authCookie = request.cookies.get('pb_auth')?.value;
	const hasAuth = !!authCookie;

	// If accessing protected route without auth, redirect to login
	if (isProtectedRoute && !hasAuth) {
		const url = request.nextUrl.clone();
		url.pathname = '/auth';
		url.searchParams.set('redirect', pathname);
		return NextResponse.redirect(url);
	}

	// If accessing auth page while authenticated, redirect to dashboard
	if (pathname === '/auth' && hasAuth) {
		const url = request.nextUrl.clone();
		url.pathname = '/dashboard';
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public files (public folder)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};
