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
import Dashboard from '@/components/Dashboard';
import type { Product } from '@/types';

export default function DashboardPage() {
	const router = useRouter();

	const handleCreateClick = () => {
		router.push('/products/new');
	};

	const handleProductClick = (product: Product) => {
		router.push(`/product/${product.id}`);
	};

	const handleEditClick = (product: Product) => {
		router.push(`/products/${product.id}/edit`);
	};

	return (
		<Dashboard
			onCreateClick={handleCreateClick}
			onProductClick={handleProductClick}
			onEditClick={handleEditClick}
		/>
	);
}
