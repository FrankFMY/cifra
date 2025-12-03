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

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
	const router = useRouter();
	const { isAuthenticated, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading) {
			if (isAuthenticated) {
				router.push('/dashboard');
			} else {
				router.push('/auth');
			}
		}
	}, [isAuthenticated, isLoading, router]);

	return (
		<div className="min-h-screen bg-zinc-950 flex items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
				<div className="text-zinc-500 font-mono text-sm animate-pulse">
					Загрузка Cifra...
				</div>
			</div>
		</div>
	);
}
