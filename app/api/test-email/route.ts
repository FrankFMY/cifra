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

/**
 * Тестовый endpoint для проверки отправки email через UniSender
 * Используйте этот endpoint для тестирования без реальной оплаты
 *
 * POST /api/test-email
 * Body: { email: "test@example.com", type: "purchase" | "sale" }
 */

import { NextResponse } from 'next/server';
import { sendPurchaseConfirmationEmail, sendSaleNotificationEmail } from '@/services/resendService';

export async function POST(request: Request) {
	try {
		const { email, type = 'purchase' } = await request.json();

		if (!email) {
			return NextResponse.json({ error: 'Email is required' }, { status: 400 });
		}

		if (type === 'purchase') {
			// Тестовая отправка email покупателю
			const result = await sendPurchaseConfirmationEmail({
				email,
				productTitle: 'Тестовый продукт',
				downloadToken: 'test_token_1234567890abcdef',
				downloadUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/download/test_token_1234567890abcdef`,
				amount: 1000,
				orderId: 'test_order_123',
			});

			if (result.success) {
				return NextResponse.json({
					success: true,
					message: 'Test purchase email sent successfully',
					result,
				});
			} else {
				return NextResponse.json(
					{
						success: false,
						error: result.error,
					},
					{ status: 500 }
				);
			}
		} else if (type === 'sale') {
			// Тестовая отправка email продавцу
			const result = await sendSaleNotificationEmail({
				sellerEmail: email,
				productTitle: 'Тестовый продукт',
				customerEmail: 'customer@example.com',
				amount: 1000,
				netAmount: 920,
				orderId: 'test_order_123',
			});

			if (result.success) {
				return NextResponse.json({
					success: true,
					message: 'Test sale notification email sent successfully',
					result,
				});
			} else {
				return NextResponse.json(
					{
						success: false,
						error: result.error,
					},
					{ status: 500 }
				);
			}
		} else {
			return NextResponse.json(
				{ error: 'Invalid type. Use "purchase" or "sale"' },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error('Test email error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}
