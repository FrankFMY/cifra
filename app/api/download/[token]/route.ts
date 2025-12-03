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

import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
	try {
		const { token } = await params;

		if (!token) {
			return NextResponse.json({ error: 'Token is required' }, { status: 400 });
		}

		// Авторизуемся как админ для доступа к токенам
		const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
		const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

		if (!adminEmail || !adminPassword) {
			return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
		}

		await pb.admins.authWithPassword(adminEmail, adminPassword);

		// Находим токен
		const downloadToken = await pb
			.collection('download_tokens')
			.getFirstListItem(`token="${token}"`);

		// Проверяем срок действия
		const expiresAt = new Date(downloadToken.expiresAt);
		if (expiresAt < new Date()) {
			return NextResponse.json({ error: 'Download link has expired' }, { status: 410 });
		}

		// Получаем продукт и файлы
		const product = await pb.collection('products').getOne(downloadToken.product);

		// Определяем источник файлов: приоритет S3, затем PocketBase (для обратной совместимости)
		const fileKeys = product.s3FileKeys || product.productFiles || [];

		if (fileKeys.length === 0) {
			return NextResponse.json(
				{ error: 'No files available for this product' },
				{ status: 404 }
			);
		}

		// Обновляем счетчик скачиваний
		await pb.collection('download_tokens').update(downloadToken.id, {
			downloadCount: (downloadToken.downloadCount || 0) + 1,
		});

		// Если файлы в S3, используем S3 API route
		if (product.s3FileKeys && product.s3FileKeys.length > 0) {
			const firstFileKey = product.s3FileKeys[0];
			// Перенаправляем на API route, который сгенерирует pre-signed URL
			return NextResponse.redirect(`/api/files/${encodeURIComponent(firstFileKey)}`);
		}

		// Обратная совместимость: если файлы в PocketBase
		if (product.productFiles && product.productFiles.length > 0) {
			const fileUrl = `${PB_URL}/api/files/${product.collectionId}/${product.id}/${product.productFiles[0]}`;
			return NextResponse.redirect(fileUrl);
		}

		return NextResponse.json({ error: 'No files available for this product' }, { status: 404 });
	} catch (error: unknown) {
		console.error('Download error:', error);

		// Проверяем, является ли ошибка объектом PocketBase с полем status
		const isPocketBaseError =
			typeof error === 'object' &&
			error !== null &&
			('status' in error || 'response' in error);

		const errorStatus =
			isPocketBaseError && 'status' in error ? (error as { status: number }).status : null;
		const errorResponse =
			isPocketBaseError && 'response' in error
				? (error as { response: { code?: number } }).response
				: null;

		if (errorStatus === 404 || errorResponse?.code === 404) {
			return NextResponse.json(
				{ error: 'Download link not found or invalid' },
				{ status: 404 }
			);
		}

		return NextResponse.json({ error: 'Failed to process download' }, { status: 500 });
	}
}
