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

import {
	AlertTriangle,
	ArrowLeft,
	Eye,
	EyeOff,
	Image as ImageIcon,
	Loader2,
	RefreshCcw,
	Save,
	Sparkles,
	Upload,
} from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CATEGORY_LABELS } from '../constants';
import { validatePrice, validateProductDescription, validateProductTitle } from '../lib/validation';
import {
	generateCoverImage,
	generateProductDescription,
	suggestPrice,
} from '../services/geminiService';
import { pbService } from '../services/pbService';
import { type Product, ProductCategory } from '../types';

interface ProductEditorProps {
	initialProduct?: Product | null;
	onBack: () => void;
	onSave: (product: Product) => void;
}

const ProductEditor: React.FC<ProductEditorProps> = ({ initialProduct, onBack, onSave }) => {
	const [title, setTitle] = useState('');
	const [category, setCategory] = useState<ProductCategory>(ProductCategory.Notion);
	const [description, setDescription] = useState('');
	const [price, setPrice] = useState<number | ''>('');
	const [features, setFeatures] = useState('');
	const [isGeneratingInfo, setIsGeneratingInfo] = useState(false);
	const [isGeneratingImage, setIsGeneratingImage] = useState(false);
	const [uploadedFile, setUploadedFile] = useState<string | null>(null);
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [coverImage, setCoverImage] = useState<string | null>(null);
	const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
	const [status, setStatus] = useState<'published' | 'draft'>('published');
	const [saving, setSaving] = useState(false);
	const [uploadingFiles, setUploadingFiles] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<string>('');

	useEffect(() => {
		if (initialProduct) {
			setTitle(initialProduct.title);
			setCategory(initialProduct.category);
			setDescription(initialProduct.description);
			setPrice(initialProduct.priceRub);
			setCoverImage(initialProduct.coverImage);
			setUploadedFile(initialProduct.files.join(', ') || null);
			setUploadedFiles([]); // Files are already in PocketBase, no need to re-upload
			setStatus(initialProduct.status);
		}
	}, [initialProduct]);

	const handleAIInfoHelp = async () => {
		const titleValidation = validateProductTitle(title);
		if (!titleValidation.valid) {
			toast.error(titleValidation.error || 'Введите название продукта');
			return;
		}
		setIsGeneratingInfo(true);

		try {
			const [descResult, priceResult] = await Promise.all([
				generateProductDescription(title, category, features),
				suggestPrice(title, category),
			]);

			setDescription(descResult);
			if (price === '') {
				setPrice(priceResult);
			}
			toast.success('Описание и цена сгенерированы!');
		} catch (e) {
			console.error(e);
			toast.error('Ошибка генерации описания. Попробуйте еще раз.');
		}
		setIsGeneratingInfo(false);
	};

	const handleAIImageGen = async () => {
		const titleValidation = validateProductTitle(title);
		if (!titleValidation.valid) {
			toast.error(titleValidation.error || 'Введите название продукта');
			return;
		}
		setIsGeneratingImage(true);
		try {
			const imageBase64 = await generateCoverImage(title, category);
			if (imageBase64) {
				setCoverImage(imageBase64);
				// Convert base64 to File for upload
				const response = await fetch(imageBase64);
				const blob = await response.blob();
				const file = new File([blob], 'cover.png', { type: 'image/png' });
				setCoverImageFile(file);
				toast.success('Обложка сгенерирована!');
			} else {
				toast.error('Не удалось сгенерировать изображение. Попробуйте снова.');
			}
		} catch (_error) {
			toast.error('Ошибка при генерации изображения.');
		}
		setIsGeneratingImage(false);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const files = Array.from(e.target.files) as File[];
			setUploadedFiles(files);
			setUploadedFile(files.map((f) => f.name).join(', '));
		}
	};

	const MIN_PRICE = 99;

	const handleSave = async () => {
		// Валидация названия
		const titleValidation = validateProductTitle(title);
		if (!titleValidation.valid) {
			toast.error(titleValidation.error || 'Заполните название продукта');
			return;
		}

		// Валидация описания
		const descriptionValidation = validateProductDescription(description);
		if (!descriptionValidation.valid) {
			toast.error(descriptionValidation.error || 'Заполните описание продукта');
			return;
		}

		// Валидация цены
		const priceValidation = validatePrice(price, MIN_PRICE);
		if (!priceValidation.valid) {
			toast.error(priceValidation.error || 'Укажите корректную цену');
			return;
		}

		// Проверяем наличие файлов: либо новые загружены, либо уже есть в продукте
		if (
			uploadedFiles.length === 0 &&
			(!initialProduct || !initialProduct.files || initialProduct.files.length === 0)
		) {
			toast.error('Необходимо загрузить хотя бы один файл продукта');
			return;
		}

		const numPrice = Number(price);

		setSaving(true);
		setUploadingFiles(true);
		try {
			// 1. Загружаем файлы в S3 (если есть новые)
			let s3FileKeys: string[] = [];
			let s3CoverImageKey: string | null = null;

			// Загружаем файлы продукта в S3
			if (uploadedFiles.length > 0) {
				setUploadProgress(`Загрузка ${uploadedFiles.length} файл(ов)...`);
				const uploadPromises = uploadedFiles.map(async (file, index) => {
					const formData = new FormData();
					formData.append('file', file);
					formData.append('folder', 'products');

					setUploadProgress(
						`Загрузка файла ${index + 1} из ${uploadedFiles.length}: ${file.name}`
					);

					const response = await fetch('/api/upload', {
						method: 'POST',
						body: formData,
					});

					if (!response.ok) {
						throw new Error(`Не удалось загрузить ${file.name}`);
					}

					const data = await response.json();
					return data.fileKey;
				});

				s3FileKeys = await Promise.all(uploadPromises);
				setUploadProgress('Файлы загружены!');
			} else if (initialProduct) {
				// Если редактируем и файлы не менялись, используем существующие
				// Это будет обработано в pbService
				s3FileKeys = initialProduct.files || [];
			}

			// Загружаем обложку в S3 (если есть новая)
			if (coverImageFile) {
				setUploadProgress('Загрузка обложки...');
				const coverFormData = new FormData();
				coverFormData.append('file', coverImageFile);
				coverFormData.append('folder', 'covers');

				const coverResponse = await fetch('/api/upload', {
					method: 'POST',
					body: coverFormData,
				});

				if (coverResponse.ok) {
					const coverData = await coverResponse.json();
					s3CoverImageKey = coverData.fileKey;
				}
			}

			setUploadProgress('Сохранение продукта...');

			// 2. Формируем данные продукта
			const productData: Omit<Product, 'id' | 'createdAt'> = {
				title,
				description,
				category,
				priceRub: numPrice,
				coverImage: coverImage || `https://picsum.photos/800/600?random=${Date.now()}`,
				sales: initialProduct ? initialProduct.sales : 0,
				revenue: initialProduct ? initialProduct.revenue : 0,
				status: status,
				files: s3FileKeys, // Теперь это S3 ключи, а не имена файлов
			};

			// 3. Сохраняем в PocketBase с S3 ключами
			let savedProduct: Product;

			if (initialProduct) {
				savedProduct = await pbService.products.updateProduct(
					initialProduct.id,
					productData,
					undefined, // Не передаем файлы, так как они уже в S3
					undefined,
					s3FileKeys.length > 0 ? s3FileKeys : undefined,
					s3CoverImageKey || undefined
				);
			} else {
				savedProduct = await pbService.products.createProduct(
					productData,
					undefined, // Не передаем файлы, так как они уже в S3
					undefined,
					s3FileKeys,
					s3CoverImageKey || undefined
				);
			}

			toast.success(initialProduct ? 'Продукт обновлен!' : 'Продукт создан!');
			onSave(savedProduct);
		} catch (error) {
			console.error('Failed to save product:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Ошибка при сохранении продукта';
			toast.error(errorMessage);
		} finally {
			setSaving(false);
			setUploadingFiles(false);
			setUploadProgress('');
		}
	};

	const calculatedRevenue = price ? Number(price) * 0.95 - 30 : 0;
	const isPriceTooLow = price !== '' && Number(price) < MIN_PRICE;

	return (
		<div className="max-w-4xl mx-auto animate-fade-in pb-20">
			<button
				onClick={onBack}
				className="flex items-center text-zinc-500 hover:text-zinc-200 mb-6 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Назад к дашборду
			</button>

			<div className="flex items-center justify-between mb-8">
				<h2 className="text-2xl font-bold text-white">
					{initialProduct ? 'Редактировать товар' : 'Новый цифровой товар'}
				</h2>

				<div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
					<button
						onClick={() => setStatus('published')}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${status === 'published' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
					>
						<Eye className="w-3 h-3" />
						Опубликован
					</button>
					<button
						onClick={() => setStatus('draft')}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${status === 'draft' ? 'bg-zinc-800 text-zinc-200 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
					>
						<EyeOff className="w-3 h-3" />
						Черновик
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Left Column: Details */}
				<div className="lg:col-span-2 space-y-6">
					<div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-lg font-medium text-white">Основная информация</h3>
							<button
								onClick={handleAIInfoHelp}
								disabled={isGeneratingInfo}
								className="flex items-center gap-2 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 rounded-lg text-xs font-medium transition-all border border-violet-500/20 disabled:opacity-50"
							>
								{isGeneratingInfo ? (
									<Loader2 className="w-3 h-3 animate-spin" />
								) : (
									<Sparkles className="w-3 h-3" />
								)}
								<span>Заполнить с AI</span>
							</button>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-zinc-400 mb-1">
									Название продукта
								</label>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Например: iOS 17 Icon Pack"
									className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-zinc-400 mb-1">
									Категория
								</label>
								<select
									value={category}
									onChange={(e) => setCategory(e.target.value as ProductCategory)}
									className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:ring-2 focus:ring-violet-500 outline-none appearance-none"
								>
									{Object.entries(CATEGORY_LABELS).map(([key, label]) => (
										<option key={key} value={key}>
											{label}
										</option>
									))}
								</select>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-zinc-400 mb-1">
								Особенности (для AI)
							</label>
							<input
								type="text"
								value={features}
								onChange={(e) => setFeatures(e.target.value)}
								placeholder="Темная тема, 500+ иконок, Figma исходники..."
								className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:ring-2 focus:ring-violet-500 outline-none"
							/>
							<p className="text-xs text-zinc-600 mt-1">
								Кратко перечислите фишки, чтобы AI составил лучшее описание.
							</p>
						</div>

						<div>
							<label className="block text-sm font-medium text-zinc-400 mb-1">
								Описание
							</label>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={8}
								className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:ring-2 focus:ring-violet-500 outline-none resize-none leading-relaxed"
								placeholder="Описание будет сгенерировано автоматически..."
							/>
						</div>
					</div>

					{/* Pricing & Files */}
					<div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-6">
						<div>
							<label className="block text-sm font-medium text-zinc-400 mb-1">
								Стоимость (₽)
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
									₽
								</span>
								<input
									type="number"
									value={price}
									onChange={(e) => setPrice(Number(e.target.value))}
									className={`w-full bg-zinc-950 border rounded-lg pl-8 pr-4 py-2.5 text-zinc-100 focus:ring-2 outline-none transition-all ${isPriceTooLow ? 'border-red-500/50 focus:ring-red-500' : 'border-zinc-800 focus:ring-emerald-500'}`}
									placeholder="0"
								/>
							</div>
							{isPriceTooLow ? (
								<div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
									<AlertTriangle className="w-3 h-3" />
									<span>Минимальная цена {MIN_PRICE} ₽</span>
								</div>
							) : (
								<p className="text-xs text-zinc-500 mt-2">
									Комиссия: 5% + 30₽. Ваш доход:{' '}
									<span
										className={
											calculatedRevenue > 0
												? 'text-emerald-400 font-bold'
												: 'text-zinc-400'
										}
									>
										{calculatedRevenue.toFixed(0)} ₽
									</span>
								</p>
							)}
						</div>

						<div className="border-t border-zinc-800 pt-6">
							<label className="block text-sm font-medium text-zinc-400 mb-3">
								Файл продукта
							</label>
							<div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-zinc-500 transition-colors bg-zinc-950/50">
								<input
									type="file"
									id="file-upload"
									className="hidden"
									onChange={handleFileChange}
									multiple
								/>
								<label
									htmlFor="file-upload"
									className="cursor-pointer flex flex-col items-center justify-center"
								>
									<div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3 text-violet-400">
										<Upload className="w-6 h-6" />
									</div>
									<span className="text-sm font-medium text-zinc-300">
										{uploadedFile ? uploadedFile : 'Нажмите для загрузки файла'}
									</span>
									<span className="text-xs text-zinc-600 mt-1">
										ZIP, PDF, MOV до 2ГБ (можно выбрать несколько)
									</span>
									<input
										type="file"
										id="file-upload"
										className="hidden"
										onChange={handleFileChange}
										multiple
									/>
								</label>
							</div>
						</div>
					</div>
				</div>

				{/* Right Column: Visuals & Actions */}
				<div className="space-y-6">
					<div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl sticky top-24">
						<h3 className="text-lg font-medium text-white mb-4">Обложка</h3>

						<div className="aspect-4/3 w-full bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-center overflow-hidden relative group">
							{coverImage && coverImage.trim() !== '' ? (
								<Image
									src={coverImage}
									alt="Cover"
									fill
									className="object-cover"
									unoptimized={coverImage.startsWith('data:')}
								/>
							) : (
								<div className="text-center p-4">
									<ImageIcon className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
									<p className="text-sm text-zinc-500">Нет обложки</p>
								</div>
							)}

							{isGeneratingImage && (
								<div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm z-10">
									<Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-2" />
									<span className="text-xs text-zinc-300">Рисуем...</span>
								</div>
							)}
						</div>

						<button
							onClick={handleAIImageGen}
							disabled={isGeneratingImage || !title}
							className="w-full mt-4 flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors border border-zinc-700"
						>
							{coverImage ? (
								<RefreshCcw className="w-4 h-4" />
							) : (
								<Sparkles className="w-4 h-4" />
							)}
							<span>{coverImage ? 'Перегенерировать' : 'Создать обложку AI'}</span>
						</button>
						<p className="text-[10px] text-zinc-600 mt-2 text-center">
							Используется модель Imagen 2.5
						</p>

						<div className="h-px bg-zinc-800 my-6"></div>

						<div className="space-y-3">
							{uploadProgress && (
								<div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-300">
									<div className="flex items-center gap-2">
										<Loader2 className="w-3 h-3 animate-spin text-violet-400" />
										<span>{uploadProgress}</span>
									</div>
								</div>
							)}
							<button
								onClick={handleSave}
								disabled={
									saving ||
									uploadingFiles ||
									!title ||
									!price ||
									(uploadedFiles.length === 0 &&
										(!initialProduct ||
											!initialProduct.files ||
											initialProduct.files.length === 0)) ||
									isPriceTooLow
								}
								className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-zinc-200 text-black rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{saving || uploadingFiles ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										{uploadProgress ||
											(initialProduct ? 'Сохранение...' : 'Публикация...')}
									</>
								) : (
									<>
										<Save className="w-4 h-4" />
										{initialProduct ? 'Сохранить изменения' : 'Опубликовать'}
									</>
								)}
							</button>
							<button
								onClick={onBack}
								className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
							>
								Отмена
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProductEditor;
