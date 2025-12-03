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

import { useRouter } from 'next/navigation';
import ProductEditor from '@/components/ProductEditor';
import type { Product } from '@/types';

export default function NewProductPage() {
	const router = useRouter();

	const handleBack = () => {
		router.push('/dashboard');
	};

	const handleSave = (_product: Product) => {
		router.push('/dashboard');
	};

	return <ProductEditor initialProduct={null} onBack={handleBack} onSave={handleSave} />;
}
