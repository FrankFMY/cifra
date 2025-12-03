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

export default function robots(): MetadataRoute.Robots {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cifra.example.com';

	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: [
					'/dashboard',
					'/products',
					'/marketing',
					'/customers',
					'/settings',
					'/auth',
					'/api',
				],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
