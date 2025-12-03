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

import type { ProductCategory } from '../types';

/**
 * Generates a marketing description for a digital product based on title and category.
 * Теперь использует backend API для безопасности.
 */
export const generateProductDescription = async (
	title: string,
	category: ProductCategory,
	features: string
): Promise<string> => {
	try {
		const response = await fetch('/api/gemini/generate-description', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ title, category, features }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Ошибка генерации описания');
		}

		const data = await response.json();
		return data.description || 'Не удалось сгенерировать описание.';
	} catch (error) {
		console.error('Error generating description:', error);
		return 'Ошибка при генерации описания. Проверьте API ключ.';
	}
};

/**
 * Suggests a price in RUB based on the product details.
 * Теперь использует backend API для безопасности.
 */
export const suggestPrice = async (title: string, category: ProductCategory): Promise<number> => {
	try {
		const response = await fetch('/api/gemini/suggest-price', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ title, category }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Ошибка генерации цены');
		}

		const data = await response.json();
		return data.price || 1000;
	} catch (error) {
		console.error('Error suggesting price:', error);
		return 990; // Fallback price
	}
};

/**
 * Generates a cover image for the product.
 * Теперь использует backend API для безопасности.
 */
export const generateCoverImage = async (
	title: string,
	category: ProductCategory
): Promise<string | null> => {
	try {
		const response = await fetch('/api/gemini/generate-cover', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ title, category }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Ошибка генерации обложки');
		}

		const data = await response.json();
		return data.imageBase64 || null;
	} catch (error) {
		console.error('Error generating image:', error);
		return null;
	}
};
