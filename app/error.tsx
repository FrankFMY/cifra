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

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error('Error caught by error boundary:', error);
	}, [error]);

	return (
		<div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
			<AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
			<h1 className="text-2xl font-bold text-white mb-2">Что-то пошло не так</h1>
			<p className="text-zinc-400 mb-2">
				Произошла непредвиденная ошибка при загрузке страницы.
			</p>
			{error.digest && (
				<p className="text-zinc-500 text-sm mb-6">Код ошибки: {error.digest}</p>
			)}
			<div className="flex gap-4">
				<button
					onClick={reset}
					className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
				>
					<RefreshCw className="w-5 h-5" />
					Попробовать снова
				</button>
				<Link
					href="/dashboard"
					className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700"
				>
					<Home className="w-5 h-5" />
					На главную
				</Link>
			</div>
		</div>
	);
}
