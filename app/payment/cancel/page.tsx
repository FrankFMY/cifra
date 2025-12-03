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

import { ArrowLeft, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PaymentCancelPage() {
	const router = useRouter();

	return (
		<div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center animate-fade-in">
				<div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
					<XCircle className="w-8 h-8" />
				</div>
				<h1 className="text-2xl font-bold text-white mb-2">Оплата отменена</h1>
				<p className="text-zinc-400 mb-8">
					Вы отменили оплату. Если у вас возникли проблемы, пожалуйста, свяжитесь с
					поддержкой.
				</p>
				<div className="space-y-3">
					<button
						onClick={() => router.push('/')}
						className="w-full py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
					>
						<ArrowLeft className="w-4 h-4" />
						Вернуться в магазин
					</button>
				</div>
			</div>
		</div>
	);
}
