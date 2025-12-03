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
 * Yandex Object Storage (S3) Client Configuration
 * Yandex Cloud полностью совместим с AWS S3 протоколом
 */

import { S3Client } from '@aws-sdk/client-s3';

// Конфигурация S3 клиента для Yandex Cloud
export const s3Client = new S3Client({
	region: process.env.YANDEX_REGION || 'ru-central1',
	endpoint: 'https://storage.yandexcloud.net', // Обязательно для Yandex Cloud
	credentials: {
		accessKeyId: process.env.YANDEX_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.YANDEX_SECRET_ACCESS_KEY || '',
	},
	forcePathStyle: false, // Yandex использует virtual-hosted-style URLs
});

export const BUCKET_NAME = process.env.YANDEX_BUCKET_NAME || 'cifra-test';

// Проверка конфигурации
if (!process.env.YANDEX_ACCESS_KEY_ID || !process.env.YANDEX_SECRET_ACCESS_KEY) {
	console.warn('⚠️ Yandex S3 credentials not configured. File uploads will fail.');
}
