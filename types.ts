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

export enum ProductCategory {
	Notion = 'Notion Template',
	Design = 'Design Asset',
	Code = 'Code Snippet/Plugin',
	Ebook = 'E-book/Guide',
	Audio = 'Audio/Preset',
	Other = 'Other',
}

export interface Product {
	id: string;
	title: string;
	description: string;
	priceRub: number;
	category: ProductCategory;
	coverImage: string;
	sales: number;
	revenue: number;
	status: 'published' | 'draft';
	files: string[]; // Simulated file names
	createdAt: number;
}

export interface Sale {
	id: string;
	productId: string;
	productTitle: string;
	amount: number; // Total amount paid by customer
	platformFee: number; // Our commission
	netAmount: number; // What creator gets
	date: string;
	customerEmail: string;
}

export interface SalesDataPoint {
	date: string;
	amount: number;
}

export interface PromoCode {
	id: string;
	code: string;
	discountPercent: number;
	uses: number;
	isActive: boolean;
}

export interface UserSettings {
	displayName: string;
	bio: string;
	avatarUrl: string;
	accentColor: string;
	emailNotifications: boolean;
}

export interface Payout {
	id: string;
	amount: number;
	status: 'pending' | 'completed';
	date: string;
	method: string;
}

export type ViewState =
	| 'dashboard'
	| 'create-product'
	| 'storefront'
	| 'settings'
	| 'marketing'
	| 'customers';
