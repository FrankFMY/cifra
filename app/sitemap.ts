import type { MetadataRoute } from 'next';
import { getPublicProducts } from '@/lib/pocketbase-server';

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
    productPages = products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: new Date(product.created),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      images: product.coverImage ? [product.coverImage] : undefined,
    }));
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Continue with static pages only if products fetch fails
  }

  return [...staticPages, ...productPages];
}

