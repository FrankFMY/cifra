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
 * Server-side PocketBase utilities
 * For SSR/SSG pages that need to fetch data from PocketBase
 */

const PB_URL =
	process.env.NEXT_PUBLIC_POCKETBASE_URL ||
	process.env.VITE_POCKETBASE_URL ||
	'http://127.0.0.1:8090';

export interface ServerProduct {
	id: string;
	title: string;
	description: string;
	priceRub: number;
	category: string;
	coverImage: string;
	sales: number;
	revenue: number;
	status: string;
	productFiles?: string[]; // Старые файлы PocketBase
	s3FileKeys?: string[]; // S3 ключи файлов
	s3CoverImageKey?: string; // S3 ключ обложки
	created: string;
	owner: string;
	collectionId?: string; // ID коллекции PocketBase (для обратной совместимости)
}

/**
 * Fetch a public product from PocketBase (server-side)
 * This works without authentication for published products
 */
export async function getPublicProduct(id: string): Promise<ServerProduct | null> {
	try {
		const response = await fetch(`${PB_URL}/api/collections/products/records/${id}`, {
			cache: 'no-store', // Always fetch fresh data
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();

		// Check if product is published
		if (data.status !== 'published') {
			return null;
		}

		// Build cover image URL if exists
		// Приоритет: S3, затем PocketBase
		let coverImage = '';
		if (data.s3CoverImageKey) {
			// S3 обложка - используем API route для pre-signed URL
			coverImage = `/api/files/${encodeURIComponent(data.s3CoverImageKey)}`;
		} else if (data.coverImage) {
			// Старая обложка из PocketBase
			coverImage = `${PB_URL}/api/files/${data.collectionId}/${data.id}/${data.coverImage}`;
		}

		return {
			...data,
			coverImage,
		};
	} catch (error) {
		console.error('Error fetching public product:', error);
		return null;
	}
}

/**
 * Fetch all public products from PocketBase (server-side)
 * Used for generating sitemap
 * Uses ISR with 1 hour revalidation to allow static generation
 */
export async function getPublicProducts(): Promise<ServerProduct[]> {
	try {
		const response = await fetch(
			`${PB_URL}/api/collections/products/records?filter=status%20%3D%20%27published%27&perPage=500`,
			{
				next: { revalidate: 3600 }, // Revalidate every hour (ISR)
			}
		);

		if (!response.ok) {
			return [];
		}

		const data = await response.json();

		return (data.items || []).map((item: ServerProduct) => {
			// Build cover image URL if exists
			// Приоритет: S3, затем PocketBase
			let coverImage = '';
			if (item.s3CoverImageKey) {
				// S3 обложка - используем API route для pre-signed URL
				coverImage = `/api/files/${encodeURIComponent(item.s3CoverImageKey)}`;
			} else if (item.coverImage) {
				// Старая обложка из PocketBase
				coverImage = `${PB_URL}/api/files/${item.collectionId}/${item.id}/${item.coverImage}`;
			}

			return {
				...item,
				coverImage,
			};
		});
	} catch (error) {
		console.error('Error fetching public products:', error);
		return [];
	}
}
