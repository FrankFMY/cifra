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

import type { RecordModel } from 'pocketbase';
import type { Payout, Product, ProductCategory, PromoCode, Sale, UserSettings } from '../types';
import { pb } from './pocketbase';

// Type definitions for PocketBase records
export interface PBUser extends RecordModel {
	email: string;
	displayName?: string;
	bio?: string;
	avatarUrl?: string;
	accentColor?: string;
	emailNotifications?: boolean;
}

export interface PBProduct extends RecordModel {
	title: string;
	description: string;
	priceRub: number;
	category: ProductCategory;
	coverImage?: string;
	productFiles?: string[]; // Старые файлы PocketBase (для обратной совместимости)
	s3FileKeys?: string[]; // S3 ключи файлов продуктов
	s3CoverImageKey?: string; // S3 ключ обложки
	sales: number;
	revenue: number;
	status: 'published' | 'draft';
	owner: string;
	expand?: {
		owner?: PBUser;
	};
}

export interface PBSale extends RecordModel {
	product: string;
	customerEmail: string;
	amount: number;
	platformFee: number;
	netAmount: number;
	owner: string;
	expand?: {
		product?: PBProduct;
		owner?: PBUser;
	};
}

export interface PBPromo extends RecordModel {
	code: string;
	discountPercent: number;
	uses: number;
	isActive: boolean;
	owner: string;
}

export interface PBPayout extends RecordModel {
	amount: number;
	status: 'pending' | 'completed' | 'failed';
	method?: string;
	owner: string;
}

// Helper to convert PBProduct to Product
const pbProductToProduct = (pbProduct: PBProduct): Product => {
	// Определяем источник файлов: приоритет S3, затем PocketBase
	const fileKeys = pbProduct.s3FileKeys || pbProduct.productFiles || [];

	// Определяем обложку: приоритет S3, затем PocketBase
	let coverImageUrl = '';
	if (pbProduct.s3CoverImageKey) {
		// Для S3 обложки используем API route для получения pre-signed URL
		coverImageUrl = `/api/files/${encodeURIComponent(pbProduct.s3CoverImageKey)}`;
	} else if (pbProduct.coverImage) {
		// Старая обложка из PocketBase
		coverImageUrl = pb.files.getURL(pbProduct, pbProduct.coverImage);
	}

	return {
		id: pbProduct.id,
		title: pbProduct.title,
		description: pbProduct.description,
		priceRub: pbProduct.priceRub,
		category: pbProduct.category,
		coverImage: coverImageUrl,
		sales: pbProduct.sales || 0,
		revenue: pbProduct.revenue || 0,
		status: pbProduct.status,
		files: fileKeys, // Теперь это S3 ключи или старые имена файлов
		createdAt: new Date(pbProduct.created).getTime(),
	};
};

// Helper to convert PBSale to Sale
const pbSaleToSale = (pbSale: PBSale): Sale => {
	return {
		id: pbSale.id,
		productId: pbSale.product,
		productTitle: pbSale.expand?.product?.title || '',
		amount: pbSale.amount,
		platformFee: pbSale.platformFee,
		netAmount: pbSale.netAmount,
		date: new Date(pbSale.created).toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'numeric',
		}),
		customerEmail: pbSale.customerEmail,
	};
};

// Auth Service
export const authService = {
	async register(email: string, password: string, passwordConfirm: string, displayName?: string) {
		const data = {
			email,
			password,
			passwordConfirm,
			displayName: displayName || email.split('@')[0],
			accentColor: '#8b5cf6',
			emailNotifications: true,
		};
		return await pb.collection('users').create(data);
	},

	async login(email: string, password: string) {
		return await pb.collection('users').authWithPassword(email, password);
	},

	async logout() {
		pb.authStore.clear();
	},

	async getCurrentUser(): Promise<PBUser | null> {
		if (!pb.authStore.isValid) return null;
		try {
			return await pb.collection('users').getOne(pb.authStore.model?.id || '');
		} catch {
			return null;
		}
	},

	isAuthenticated(): boolean {
		return pb.authStore.isValid;
	},
};

// Product Service
export const productService = {
	async getProducts(includeDrafts = false): Promise<Product[]> {
		if (!pb.authStore.isValid || !pb.authStore.model?.id) {
			return [];
		}

		try {
			// Use getList instead of getFullList to avoid potential issues
			// listRule already filters: status = 'published' || owner = @request.auth.id
			const result = await pb.collection('products').getList<PBProduct>(1, 500, {
				sort: '-id',
			});

			// Filter client-side based on includeDrafts
			const userId = pb.authStore.model.id;
			const filtered = includeDrafts
				? result.items.filter((r) => r.owner === userId)
				: result.items; // listRule already filtered to published or own

			return filtered.map(pbProductToProduct);
		} catch (error) {
			console.error('Error fetching products:', error);
			return [];
		}
	},

	async getProduct(id: string): Promise<Product | null> {
		try {
			const record = await pb.collection('products').getOne<PBProduct>(id);
			return pbProductToProduct(record);
		} catch {
			return null;
		}
	},

	async getPublicProduct(id: string): Promise<Product | null> {
		try {
			const record = await pb.collection('products').getOne<PBProduct>(id);
			if (record.status !== 'published') return null;
			return pbProductToProduct(record);
		} catch {
			return null;
		}
	},

	async createProduct(
		productData: Omit<Product, 'id' | 'createdAt'>,
		coverImageFile?: File,
		productFiles?: File[],
		s3FileKeys?: string[],
		s3CoverImageKey?: string
	): Promise<Product> {
		const formData = new FormData();
		formData.append('title', productData.title);
		formData.append('description', productData.description);
		formData.append('priceRub', productData.priceRub.toString());
		formData.append('category', productData.category);
		formData.append('status', productData.status);
		formData.append('sales', (productData.sales || 0).toString());
		formData.append('revenue', (productData.revenue || 0).toString());
		formData.append('owner', pb.authStore.model?.id || '');

		// Если есть S3 ключи, сохраняем их
		if (s3FileKeys && s3FileKeys.length > 0) {
			formData.append('s3FileKeys', JSON.stringify(s3FileKeys));
		}

		if (s3CoverImageKey) {
			formData.append('s3CoverImageKey', s3CoverImageKey);
		}

		// Обратная совместимость: если файлы переданы напрямую, загружаем в PocketBase
		// (но лучше использовать S3)
		if (coverImageFile && !s3CoverImageKey) {
			formData.append('coverImage', coverImageFile);
		}

		if (productFiles && productFiles.length > 0 && (!s3FileKeys || s3FileKeys.length === 0)) {
			productFiles.forEach((file) => {
				formData.append('productFiles', file);
			});
		}

		const record = await pb.collection('products').create<PBProduct>(formData);
		return pbProductToProduct(record);
	},

	async updateProduct(
		id: string,
		productData: Partial<Product>,
		coverImageFile?: File,
		productFiles?: File[],
		s3FileKeys?: string[],
		s3CoverImageKey?: string
	): Promise<Product> {
		const formData = new FormData();

		if (productData.title !== undefined) formData.append('title', productData.title);
		if (productData.description !== undefined)
			formData.append('description', productData.description);
		if (productData.priceRub !== undefined)
			formData.append('priceRub', productData.priceRub.toString());
		if (productData.category !== undefined) formData.append('category', productData.category);
		if (productData.status !== undefined) formData.append('status', productData.status);
		if (productData.sales !== undefined) formData.append('sales', productData.sales.toString());
		if (productData.revenue !== undefined)
			formData.append('revenue', productData.revenue.toString());

		// Если есть S3 ключи, обновляем их
		if (s3FileKeys !== undefined) {
			formData.append('s3FileKeys', JSON.stringify(s3FileKeys));
		}

		if (s3CoverImageKey !== undefined) {
			formData.append('s3CoverImageKey', s3CoverImageKey);
		}

		// Обратная совместимость: если файлы переданы напрямую, загружаем в PocketBase
		if (coverImageFile && !s3CoverImageKey) {
			formData.append('coverImage', coverImageFile);
		}

		if (productFiles && productFiles.length > 0 && (!s3FileKeys || s3FileKeys.length === 0)) {
			productFiles.forEach((file) => {
				formData.append('productFiles', file);
			});
		}

		const record = await pb.collection('products').update<PBProduct>(id, formData);
		return pbProductToProduct(record);
	},

	async deleteProduct(id: string): Promise<boolean> {
		try {
			await pb.collection('products').delete(id);
			return true;
		} catch {
			return false;
		}
	},
};

// Sale Service
export const saleService = {
	async getSales(): Promise<Sale[]> {
		if (!pb.authStore.isValid || !pb.authStore.model?.id) {
			return [];
		}

		try {
			// listRule already filters to owner = @request.auth.id, so we can omit filter
			// Sort by id (descending) to get most recent sales first
			// Note: PocketBase always includes 'created' and 'updated' fields in RecordModel
			// However, if 'created' is missing, we need to fetch each record individually to get full data
			const result = await pb.collection('sales').getList<PBSale>(1, 500, {
				sort: '-id', // Sort by id (most recent first)
			});
			const records = result.items;

			// Debug: Log first record to see what fields are actually returned
			if (records.length > 0 && process.env.NEXT_PUBLIC_DEBUG_POCKETBASE === 'true') {
				const firstRecord = records[0] as PBSale & RecordModel;
				console.log('First sale record keys:', Object.keys(firstRecord));
				console.log('First sale record created:', firstRecord.created);
				console.log('First sale record (full):', JSON.stringify(firstRecord, null, 2));
			}

			// Fetch product titles and full sale records separately
			// If 'created' is missing from getList response, fetch each record individually
			// This ensures we get all RecordModel fields including 'created' and 'updated'
			const salesWithTitles = await Promise.all(
				records.map(async (sale) => {
					let productTitle = '';
					let fullSale = sale;

					// If 'created' is missing, fetch the full record
					const saleWithModel = sale as PBSale & RecordModel;
					if (!saleWithModel.created) {
						try {
							fullSale = await pb.collection('sales').getOne<PBSale>(sale.id);
						} catch (error) {
							console.warn('Failed to fetch full sale record:', sale.id, error);
							// Continue with original sale record
						}
					}

					try {
						if (typeof sale.product === 'string') {
							const product = await pb
								.collection('products')
								.getOne<PBProduct>(sale.product);
							productTitle = product.title;
						}
					} catch {
						// Ignore if product not found
					}

					// Return the full sale record with productTitle
					return {
						...fullSale,
						productTitle,
					};
				})
			);

			return salesWithTitles.map((sale) => {
				const pbSale = sale as PBSale & RecordModel;
				// Format date safely - handle invalid dates
				// PocketBase RecordModel always includes 'created' and 'updated' fields
				// Access created field directly from the record object
				let formattedDate = 'Неизвестно';
				try {
					// According to PocketBase docs, 'created' is always present in RecordModel
					// Access it directly - it's a string in format "YYYY-MM-DD HH:mm:ss.SSS"
					const dateValue = pbSale.created;
					if (dateValue && typeof dateValue === 'string') {
						const date = new Date(dateValue);
						if (!Number.isNaN(date.getTime())) {
							formattedDate = date.toLocaleDateString('ru-RU', {
								day: 'numeric',
								month: 'numeric',
							});
						} else {
							console.warn(
								'Invalid date for sale:',
								pbSale.id,
								'dateValue:',
								dateValue
							);
							// Fallback to current date
							formattedDate = new Date().toLocaleDateString('ru-RU', {
								day: 'numeric',
								month: 'numeric',
							});
						}
					} else {
						// Fallback: use current date if created is missing
						// This should not happen according to PocketBase docs, but handle it gracefully
						// The issue might be that 'created' is not being returned by PocketBase API
						// Check if we need to explicitly request it or if there's a configuration issue
						if (process.env.NEXT_PUBLIC_DEBUG_POCKETBASE === 'true') {
							console.warn(
								'Missing created field for sale:',
								pbSale.id,
								'Available keys:',
								Object.keys(pbSale),
								'Full record:',
								pbSale
							);
						}
						formattedDate = new Date().toLocaleDateString('ru-RU', {
							day: 'numeric',
							month: 'numeric',
						});
					}
				} catch (error) {
					console.error('Error formatting date for sale:', pbSale.id, error);
					// Fallback to current date on error
					formattedDate = new Date().toLocaleDateString('ru-RU', {
						day: 'numeric',
						month: 'numeric',
					});
				}
				return {
					id: pbSale.id,
					productId: typeof pbSale.product === 'string' ? pbSale.product : '',
					productTitle: sale.productTitle,
					amount: pbSale.amount,
					platformFee: pbSale.platformFee,
					netAmount: pbSale.netAmount,
					date: formattedDate,
					customerEmail: pbSale.customerEmail,
				};
			});
		} catch (error) {
			console.error('Error fetching sales:', error);
			return [];
		}
	},

	async createSale(productId: string, price: number, customerEmail: string): Promise<Sale> {
		// Get product to calculate fees and get owner
		const product = await pb.collection('products').getOne<PBProduct>(productId);

		// Calculate platform fee: 5% + 30 RUB
		const platformFee = Math.round(price * 0.05 + 30);
		const netAmount = price - platformFee;

		const saleData = {
			product: productId,
			customerEmail,
			amount: price,
			platformFee,
			netAmount,
			owner: product.owner,
		};

		const record = await pb.collection('sales').create<PBSale>(saleData);

		// Fetch product separately if needed for title
		let _productTitle = '';
		try {
			const product = await pb.collection('products').getOne<PBProduct>(productId);
			_productTitle = product.title;
		} catch {
			// Ignore if product not found
		}

		// Update product stats
		await pb.collection('products').update(productId, {
			sales: (product.sales || 0) + 1,
			revenue: (product.revenue || 0) + netAmount,
		});

		return pbSaleToSale(record);
	},
};

// Promo Service
export const promoService = {
	async getPromos(): Promise<PromoCode[]> {
		const userId = pb.authStore.model?.id;
		if (!userId) return [];

		try {
			// listRule already filters to owner = @request.auth.id, so we can omit filter
			const result = await pb.collection('promos').getList<PBPromo>(1, 500, {
				sort: '-id',
			});
			const records = result.items;

			return records.map((promo) => ({
				id: promo.id,
				code: promo.code,
				discountPercent: promo.discountPercent,
				uses: promo.uses || 0,
				isActive: promo.isActive,
			}));
		} catch (error) {
			console.error('Error fetching promos:', error);
			return [];
		}
	},

	async getPromoByCode(code: string): Promise<PromoCode | null> {
		try {
			const record = await pb
				.collection('promos')
				.getFirstListItem<PBPromo>(`code = "${code.toUpperCase()}" AND isActive = true`);
			return {
				id: record.id,
				code: record.code,
				discountPercent: record.discountPercent,
				uses: record.uses || 0,
				isActive: record.isActive,
			};
		} catch {
			return null;
		}
	},

	async createPromo(code: string, discountPercent: number): Promise<PromoCode> {
		const record = await pb.collection('promos').create<PBPromo>({
			code: code.toUpperCase(),
			discountPercent,
			uses: 0,
			isActive: true,
			owner: pb.authStore.model?.id || '',
		});

		return {
			id: record.id,
			code: record.code,
			discountPercent: record.discountPercent,
			uses: record.uses || 0,
			isActive: record.isActive,
		};
	},

	async updatePromo(id: string, updates: Partial<PromoCode>): Promise<PromoCode> {
		const record = await pb.collection('promos').update<PBPromo>(id, {
			...(updates.isActive !== undefined && { isActive: updates.isActive }),
			...(updates.discountPercent !== undefined && {
				discountPercent: updates.discountPercent,
			}),
		});

		return {
			id: record.id,
			code: record.code,
			discountPercent: record.discountPercent,
			uses: record.uses || 0,
			isActive: record.isActive,
		};
	},

	async deletePromo(id: string): Promise<boolean> {
		try {
			await pb.collection('promos').delete(id);
			return true;
		} catch {
			return false;
		}
	},

	async incrementPromoUses(id: string): Promise<void> {
		const promo = await pb.collection('promos').getOne<PBPromo>(id);
		await pb.collection('promos').update(id, {
			uses: (promo.uses || 0) + 1,
		});
	},
};

// Payout Service
export const payoutService = {
	async getPayouts(): Promise<Payout[]> {
		const userId = pb.authStore.model?.id;
		if (!userId) return [];

		try {
			// listRule already filters to owner = @request.auth.id, so we can omit filter
			const result = await pb.collection('payouts').getList<PBPayout>(1, 500, {
				sort: '-id',
			});
			const records = result.items;

			return records.map((payout) => ({
				id: payout.id,
				amount: payout.amount,
				status: payout.status === 'completed' ? 'completed' : 'pending',
				date: new Date(payout.created).toLocaleDateString('ru-RU'),
				method: payout.method || '',
			}));
		} catch (error) {
			console.error('Error fetching payouts:', error);
			return [];
		}
	},

	async createPayout(amount: number, method: string): Promise<Payout> {
		const record = await pb.collection('payouts').create<PBPayout>({
			amount,
			status: 'completed', // In real app, this would be 'pending' and processed by admin
			method,
			owner: pb.authStore.model?.id || '',
		});

		return {
			id: record.id,
			amount: record.amount,
			status: record.status === 'completed' ? 'completed' : 'pending',
			date: new Date(record.created).toLocaleDateString('ru-RU'),
			method: record.method || '',
		};
	},

	async getAvailableBalance(): Promise<number> {
		const products = await productService.getProducts(true);
		const totalNetRevenue = products.reduce((acc, p) => acc + p.revenue, 0);

		const payouts = await this.getPayouts();
		const totalWithdrawn = payouts
			.filter((p) => p.status === 'completed')
			.reduce((acc, p) => acc + p.amount, 0);

		return Math.max(0, totalNetRevenue - totalWithdrawn);
	},
};

// Settings Service
export const settingsService = {
	async getSettings(): Promise<UserSettings> {
		const user = await authService.getCurrentUser();
		if (!user) {
			return {
				displayName: '',
				bio: '',
				avatarUrl: '',
				accentColor: '#8b5cf6',
				emailNotifications: true,
			};
		}

		return {
			displayName: user.displayName || user.email.split('@')[0],
			bio: user.bio || '',
			avatarUrl: user.avatarUrl ? pb.files.getURL(user, user.avatarUrl) : '',
			accentColor: user.accentColor || '#8b5cf6',
			emailNotifications: user.emailNotifications !== false,
		};
	},

	async updateSettings(
		settings: Partial<UserSettings>,
		avatarFile?: File
	): Promise<UserSettings> {
		const userId = pb.authStore.model?.id;
		if (!userId) throw new Error('Not authenticated');

		const formData = new FormData();

		if (settings.displayName !== undefined)
			formData.append('displayName', settings.displayName);
		if (settings.bio !== undefined) formData.append('bio', settings.bio);
		if (settings.accentColor !== undefined)
			formData.append('accentColor', settings.accentColor);
		if (settings.emailNotifications !== undefined)
			formData.append('emailNotifications', settings.emailNotifications.toString());

		if (avatarFile) {
			formData.append('avatarUrl', avatarFile);
		}

		const user = await pb.collection('users').update<PBUser>(userId, formData);

		return {
			displayName: user.displayName || user.email.split('@')[0],
			bio: user.bio || '',
			avatarUrl: user.avatarUrl ? pb.files.getURL(user, user.avatarUrl) : '',
			accentColor: user.accentColor || '#8b5cf6',
			emailNotifications: user.emailNotifications !== false,
		};
	},
};

// File Service
export const fileService = {
	getFileURL(record: RecordModel, filename: string, options?: { token?: string }): string {
		return pb.files.getURL(record, filename, options);
	},

	async getFileToken(): Promise<string> {
		return await pb.files.getToken();
	},
};

// Export all services
export const pbService = {
	auth: authService,
	products: productService,
	sales: saleService,
	promos: promoService,
	payouts: payoutService,
	settings: settingsService,
	files: fileService,
};

export default pbService;
