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
import PublicStore from '@/components/PublicStore';
import type { Product, UserSettings } from '@/types';

export default function PublicStoreClient({
	product,
	sellerSettings,
}: {
	product: Product;
	sellerSettings: UserSettings;
}) {
	const router = useRouter();

	return (
		<PublicStore
			product={product}
			sellerSettings={sellerSettings}
			onClose={() => {
				router.push('/');
			}}
		/>
	);
}
