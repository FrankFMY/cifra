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
 * API Route для получения pre-signed URL для скачивания файла из S3
 * GET /api/files/[fileKey]
 *
 * Возвращает временную подписанную ссылку для скачивания файла
 */

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { BUCKET_NAME, s3Client } from '@/lib/s3';

export async function GET(_request: Request, { params }: { params: Promise<{ fileKey: string }> }) {
	try {
		const { fileKey } = await params;

		if (!fileKey) {
			return NextResponse.json({ error: 'File key is required' }, { status: 400 });
		}

		// Проверяем конфигурацию
		if (!process.env.YANDEX_ACCESS_KEY_ID || !process.env.YANDEX_SECRET_ACCESS_KEY) {
			return NextResponse.json({ error: 'S3 storage not configured' }, { status: 500 });
		}

		// Декодируем fileKey (может быть закодирован в URL)
		const decodedFileKey = decodeURIComponent(fileKey);

		// Создаем команду для получения файла
		const command = new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: decodedFileKey,
		});

		// Генерируем pre-signed URL (действителен 1 час)
		const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

		// Перенаправляем на подписанную ссылку
		return NextResponse.redirect(url);
	} catch (error) {
		console.error('S3 get file error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Ошибка получения файла' },
			{ status: 500 }
		);
	}
}
