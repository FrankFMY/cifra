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

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import type { ViewState } from '@/types';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.push('/auth');
		}
	}, [isAuthenticated, isLoading, router]);

	// Map pathname to ViewState for Navbar
	const getActiveView = ():
		| 'dashboard'
		| 'create-product'
		| 'marketing'
		| 'customers'
		| 'settings' => {
		if (pathname.startsWith('/products/new')) return 'create-product';
		if (pathname.startsWith('/products/') && pathname.includes('/edit'))
			return 'create-product';
		if (pathname.startsWith('/marketing')) return 'marketing';
		if (pathname.startsWith('/customers')) return 'customers';
		if (pathname.startsWith('/settings')) return 'settings';
		return 'dashboard';
	};

	const handleNavigate = (view: ViewState) => {
		switch (view) {
			case 'dashboard':
				router.push('/dashboard');
				break;
			case 'create-product':
				router.push('/products/new');
				break;
			case 'marketing':
				router.push('/marketing');
				break;
			case 'customers':
				router.push('/customers');
				break;
			case 'settings':
				router.push('/settings');
				break;
			case 'storefront':
				// Storefront is handled separately, not in protected routes
				break;
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-zinc-950 flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
					<div className="text-zinc-500 font-mono text-sm animate-pulse">Загрузка...</div>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-violet-500/30">
			<Navbar activeView={getActiveView()} onNavigate={handleNavigate} />
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
		</div>
	);
}
