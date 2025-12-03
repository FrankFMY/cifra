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

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProductEditor from '@/components/ProductEditor';
import { pbService } from '@/services/pbService';
import type { Product } from '@/types';

export default function EditProductPage() {
	const router = useRouter();
	const params = useParams();
	const productId = params.id as string;
	const [product, setProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchProduct = async () => {
			try {
				const fetchedProduct = await pbService.products.getProduct(productId);
				setProduct(fetchedProduct);
			} catch (error) {
				console.error('Error fetching product:', error);
				router.push('/dashboard');
			} finally {
				setLoading(false);
			}
		};

		if (productId) {
			fetchProduct();
		}
	}, [productId, router]);

	const handleBack = () => {
		router.push('/dashboard');
	};

	const handleSave = (_savedProduct: Product) => {
		router.push('/dashboard');
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-zinc-950 flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
					<div className="text-zinc-500 font-mono text-sm animate-pulse">Загрузка...</div>
				</div>
			</div>
		);
	}

	if (!product) {
		return null;
	}

	return <ProductEditor initialProduct={product} onBack={handleBack} onSave={handleSave} />;
}
