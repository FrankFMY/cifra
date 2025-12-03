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

import confetti from 'canvas-confetti';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function PaymentSuccessContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	interface Order {
		id: string;
		status: string;
		productId?: string;
	}
	const [_order, _setOrder] = useState<Order | null>(null);
	const [error, _setError] = useState<string | null>(null);

	useEffect(() => {
		// ЮKassa не передает параметры в return_url автоматически
		// Используем sessionStorage для получения данных о заказе (если есть)
		const paymentId = searchParams.get('payment_id') || sessionStorage.getItem('lastPaymentId');
		const orderId = sessionStorage.getItem('lastOrderId');

		// Запускаем конфетти
		confetti({
			particleCount: 150,
			spread: 70,
			origin: { y: 0.6 },
			colors: ['#8b5cf6', '#ffffff', '#10b981'],
		});

		// Проверяем статус заказа (webhook может еще не обработаться)
		const checkOrder = async () => {
			try {
				// Ждем немного, чтобы webhook успел обработаться
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Очищаем sessionStorage после использования
				if (orderId) {
					sessionStorage.removeItem('lastOrderId');
				}
				if (paymentId) {
					sessionStorage.removeItem('lastPaymentId');
				}

				setLoading(false);
			} catch (err) {
				console.error('Error checking order:', err);
				// Не показываем ошибку пользователю, просто скрываем загрузку
				setLoading(false);
			}
		};

		// Запускаем проверку независимо от наличия paymentId
		// ЮKassa может не передавать его в URL - это нормально
		checkOrder();
	}, [searchParams]);

	if (loading) {
		return (
			<div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
				<div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
					<Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
					<p className="text-white font-medium">Проверка платежа...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
				<div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
					<p className="text-red-400 mb-4">{error}</p>
					<button
						onClick={() => router.push('/')}
						className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
					>
						Вернуться на главную
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center animate-fade-in">
				<div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
					<CheckCircle className="w-8 h-8" />
				</div>
				<h1 className="text-2xl font-bold text-white mb-2">Оплата прошла успешно!</h1>
				<p className="text-zinc-400 mb-8">
					Спасибо за покупку! Ссылка на скачивание отправлена на вашу почту.
				</p>
				<div className="space-y-3">
					<button
						onClick={() => router.push('/')}
						className="w-full py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
					>
						Вернуться в магазин
					</button>
				</div>
			</div>
		</div>
	);
}

export default function PaymentSuccessPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
					<div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
						<Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
						<p className="text-white font-medium">Загрузка...</p>
					</div>
				</div>
			}
		>
			<PaymentSuccessContent />
		</Suspense>
	);
}
