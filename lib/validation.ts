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
 * Утилиты для валидации форм
 */

/**
 * Валидация email адреса
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
	if (!email || email.trim() === '') {
		return { valid: false, error: 'Email обязателен для заполнения' };
	}

	// Более строгая валидация email
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email.trim())) {
		return { valid: false, error: 'Введите корректный email адрес' };
	}

	return { valid: true };
}

/**
 * Валидация цены
 */
export function validatePrice(
	price: number | string,
	minPrice: number = 99
): { valid: boolean; error?: string } {
	const numPrice = typeof price === 'string' ? Number(price) : price;

	if (Number.isNaN(numPrice) || numPrice <= 0) {
		return { valid: false, error: 'Цена должна быть положительным числом' };
	}

	if (numPrice < minPrice) {
		return {
			valid: false,
			error: `Минимальная цена — ${minPrice} ₽ (чтобы покрыть комиссии платежных систем)`,
		};
	}

	return { valid: true };
}

/**
 * Валидация промокода (формат)
 */
export function validatePromoCode(code: string): { valid: boolean; error?: string } {
	if (!code || code.trim() === '') {
		return { valid: false, error: 'Введите промокод' };
	}

	if (code.length < 3) {
		return { valid: false, error: 'Промокод должен содержать минимум 3 символа' };
	}

	if (code.length > 50) {
		return { valid: false, error: 'Промокод не может быть длиннее 50 символов' };
	}

	// Только буквы, цифры и дефисы
	const codeRegex = /^[A-Z0-9-]+$/i;
	if (!codeRegex.test(code.trim())) {
		return { valid: false, error: 'Промокод может содержать только буквы, цифры и дефисы' };
	}

	return { valid: true };
}

/**
 * Валидация названия продукта
 */
export function validateProductTitle(title: string): { valid: boolean; error?: string } {
	if (!title || title.trim() === '') {
		return { valid: false, error: 'Название продукта обязательно' };
	}

	if (title.trim().length < 3) {
		return { valid: false, error: 'Название должно содержать минимум 3 символа' };
	}

	if (title.length > 200) {
		return { valid: false, error: 'Название не может быть длиннее 200 символов' };
	}

	return { valid: true };
}

/**
 * Валидация описания продукта
 */
export function validateProductDescription(description: string): {
	valid: boolean;
	error?: string;
} {
	if (!description || description.trim() === '') {
		return { valid: false, error: 'Описание продукта обязательно' };
	}

	if (description.trim().length < 10) {
		return { valid: false, error: 'Описание должно содержать минимум 10 символов' };
	}

	return { valid: true };
}
