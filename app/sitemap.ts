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

import type { MetadataRoute } from 'next';
import { getPublicProducts } from '@/lib/pocketbase-server';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cifra.example.com';

	// Static pages
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 1,
		},
	];

	// Dynamic product pages
	let productPages: MetadataRoute.Sitemap = [];

	try {
		const products = await getPublicProducts();
		productPages = products
			.filter((product) => product.id) // Filter out products without ID
			.map((product) => {
				// Validate and parse date safely
				let lastModified: Date;
				if (product.created) {
					const parsedDate = new Date(product.created);
					// Check if date is valid
					if (Number.isNaN(parsedDate.getTime())) {
						// Use current date as fallback for invalid dates
						lastModified = new Date();
					} else {
						lastModified = parsedDate;
					}
				} else {
					// Use current date if created is missing
					lastModified = new Date();
				}

				return {
					url: `${baseUrl}/product/${product.id}`,
					lastModified,
					changeFrequency: 'weekly' as const,
					priority: 0.8,
					images: product.coverImage ? [product.coverImage] : undefined,
				};
			});
	} catch (error) {
		console.error('Error generating sitemap:', error);
		// Continue with static pages only if products fetch fails
	}

	return [...staticPages, ...productPages];
}
