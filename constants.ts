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

import { type Product, ProductCategory, type PromoCode, type SalesDataPoint } from './types';

export const MOCK_PRODUCTS: Product[] = [
	{
		id: '1',
		title: 'Ultimate Freelance Notion Dashboard',
		description:
			'Полная система управления проектами для фрилансеров. Включает CRM, трекер задач и финансовый учет.',
		priceRub: 1500,
		category: ProductCategory.Notion,
		coverImage: 'https://picsum.photos/800/600?random=1',
		sales: 124,
		revenue: 186000,
		status: 'published',
		files: ['dashboard_v2.zip'],
		createdAt: 1696118400000,
	},
	{
		id: '2',
		title: 'Cyberpunk LR Presets',
		description:
			'Пакет из 15 пресетов для Lightroom в стиле киберпанк. Идеально для ночной городской съемки.',
		priceRub: 890,
		category: ProductCategory.Design,
		coverImage: 'https://picsum.photos/800/600?random=2',
		sales: 45,
		revenue: 40050,
		status: 'published',
		files: ['presets.zip', 'guide.pdf'],
		createdAt: 1699353600000,
	},
	{
		id: '3',
		title: 'React Native Starter Kit',
		description:
			'Бойлерплейт для быстрого старта мобильных приложений. TypeScript, Expo, настроенный линтинг.',
		priceRub: 3500,
		category: ProductCategory.Code,
		coverImage: 'https://picsum.photos/800/600?random=3',
		sales: 12,
		revenue: 42000,
		status: 'draft',
		files: [],
		createdAt: 1700000000000,
	},
];

export const SALES_DATA: SalesDataPoint[] = [
	{ date: '01.10', amount: 4500 },
	{ date: '02.10', amount: 7200 },
	{ date: '03.10', amount: 3100 },
	{ date: '04.10', amount: 12500 },
	{ date: '05.10', amount: 8900 },
	{ date: '06.10', amount: 15600 },
	{ date: '07.10', amount: 11200 },
];

export const MOCK_PROMOS: PromoCode[] = [
	{ id: '1', code: 'EARLYBIRD', discountPercent: 20, uses: 45, isActive: true },
	{ id: '2', code: 'SUMMERSALE', discountPercent: 50, uses: 12, isActive: false },
	{ id: '3', code: 'FRIENDS', discountPercent: 10, uses: 89, isActive: true },
];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
	[ProductCategory.Notion]: 'Шаблоны Notion',
	[ProductCategory.Design]: 'Дизайн и Ассеты',
	[ProductCategory.Code]: 'Код и Плагины',
	[ProductCategory.Ebook]: 'Гайды и Книги',
	[ProductCategory.Audio]: 'Аудио и Пресеты',
	[ProductCategory.Other]: 'Другое',
};
