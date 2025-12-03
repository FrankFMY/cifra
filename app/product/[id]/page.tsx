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

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicProduct, type ServerProduct } from '@/lib/pocketbase-server';
import { type Product, ProductCategory, type UserSettings } from '@/types';
import PublicStoreClient from './PublicStoreClient';

interface PageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { id } = await params;

	try {
		const serverProduct = await getPublicProduct(id);
		if (!serverProduct) {
			return {
				title: 'Товар не найден | Cifra',
			};
		}

		const description = serverProduct.description.substring(0, 160);
		const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cifra.example.com';

		return {
			title: `${serverProduct.title} | Купить на Cifra`,
			description,
			keywords: [serverProduct.title, serverProduct.category, 'цифровой товар', 'купить'],
			openGraph: {
				title: serverProduct.title,
				description,
				url: `${siteUrl}/product/${id}`,
				siteName: 'Cifra',
				images: serverProduct.coverImage
					? [
							{
								url: serverProduct.coverImage,
								width: 1200,
								height: 630,
								alt: serverProduct.title,
							},
						]
					: [],
				locale: 'ru_RU',
				type: 'website',
			},
			twitter: {
				card: 'summary_large_image',
				title: serverProduct.title,
				description,
				images: serverProduct.coverImage ? [serverProduct.coverImage] : [],
			},
			alternates: {
				canonical: `${siteUrl}/product/${id}`,
			},
		};
	} catch {
		return {
			title: 'Товар не найден | Cifra',
		};
	}
}

// Helper to convert server product to client Product type
function serverProductToProduct(serverProduct: ServerProduct): Product {
	// Определяем файлы: приоритет S3, затем PocketBase
	const fileKeys = serverProduct.s3FileKeys || serverProduct.productFiles || [];

	// Преобразуем category из string в ProductCategory
	let category: ProductCategory;
	try {
		category = serverProduct.category as ProductCategory;
		// Проверяем, что category валидна
		if (!Object.values(ProductCategory).includes(category)) {
			category = ProductCategory.Other;
		}
	} catch {
		category = ProductCategory.Other;
	}

	// Преобразуем status из string в 'published' | 'draft'
	const status: 'published' | 'draft' =
		serverProduct.status === 'published' || serverProduct.status === 'draft'
			? serverProduct.status
			: 'draft';

	return {
		id: serverProduct.id,
		title: serverProduct.title,
		description: serverProduct.description,
		priceRub: serverProduct.priceRub,
		category,
		coverImage: serverProduct.coverImage || '', // Уже обработан в getPublicProduct
		sales: serverProduct.sales || 0,
		revenue: serverProduct.revenue || 0,
		status,
		files: fileKeys, // S3 ключи или старые имена файлов
		createdAt: new Date(serverProduct.created).getTime(),
	};
}

export default async function ProductPage({ params }: PageProps) {
	const { id } = await params;

	let product: Product | null = null;
	let sellerSettings: UserSettings;

	try {
		// Try to get product from PocketBase (server-side)
		const serverProduct = await getPublicProduct(id);

		if (serverProduct) {
			product = serverProductToProduct(serverProduct);
			// Use default settings for public pages (StorageService uses localStorage, so we provide defaults)
			sellerSettings = {
				displayName: 'Продавец',
				bio: '',
				avatarUrl: '',
				accentColor: '#8b5cf6',
				emailNotifications: true,
			};
		} else {
			// Fallback to localStorage (client-side only, but we'll handle it in client component)
			// For SSR, we'll just return not found
			notFound();
		}
	} catch (error) {
		console.error('Error fetching product:', error);
		notFound();
	}

	if (!product) {
		notFound();
	}

	if (product.status === 'draft') {
		return (
			<div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
				<h1 className="text-2xl font-bold text-white mb-2">Товар не опубликован</h1>
				<p className="text-zinc-400 mb-8">Этот товар еще не опубликован автором.</p>
			</div>
		);
	}

	return <PublicStoreClient product={product} sellerSettings={sellerSettings} />;
}
