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
 * API Route для загрузки файлов в Yandex Object Storage
 * POST /api/upload
 * Body: FormData с полем 'file'
 */

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { BUCKET_NAME, s3Client } from '@/lib/s3';

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const folder = (formData.get('folder') as string) || 'products'; // products, covers, etc.

		if (!file) {
			return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
		}

		// Проверяем конфигурацию
		if (!process.env.YANDEX_ACCESS_KEY_ID || !process.env.YANDEX_SECRET_ACCESS_KEY) {
			return NextResponse.json({ error: 'S3 storage not configured' }, { status: 500 });
		}

		// Читаем файл в буфер
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Генерируем уникальное имя файла
		const timestamp = Date.now();
		const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
		const fileKey = `${folder}/${timestamp}-${sanitizedName}`;

		// Создаем команду загрузки
		const command = new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: fileKey,
			Body: buffer,
			ContentType: file.type || 'application/octet-stream',
			// ACL: 'private', // Файлы приватные, доступ через pre-signed URLs
		});

		// Загружаем файл
		await s3Client.send(command);

		// Возвращаем ключ файла (не полный URL, так как бакет приватный)
		return NextResponse.json({
			success: true,
			fileKey,
			fileName: file.name,
			size: file.size,
			contentType: file.type,
		});
	} catch (error) {
		console.error('S3 upload error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Ошибка загрузки файла' },
			{ status: 500 }
		);
	}
}
