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

import { Copy, Plus, Tag, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { MOCK_PROMOS } from '../constants';
import { pbService } from '../services/pbService';
import { StorageService } from '../services/storage';
import type { PromoCode } from '../types';

const Marketing: React.FC = () => {
	const [promos, setPromos] = useState<PromoCode[]>([]);
	const [newCode, setNewCode] = useState('');
	const [newDiscount, setNewDiscount] = useState(10);
	const [_loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchPromos = async () => {
			try {
				const data = await pbService.promos.getPromos();
				setPromos(data);
			} catch (_error) {
				// Fallback to localStorage
				const data = StorageService.getPromos();
				setPromos(data.length > 0 ? data : MOCK_PROMOS);
			}
			setLoading(false);
		};
		fetchPromos();
	}, []);

	const handleCreate = async () => {
		if (!newCode) return;
		try {
			const newPromo = await pbService.promos.createPromo(newCode.toUpperCase(), newDiscount);
			setPromos([newPromo, ...promos]);
			setNewCode('');
			setNewDiscount(10);
		} catch (_error) {
			// Fallback to localStorage
			const newPromo: PromoCode = {
				id: Date.now().toString(),
				code: newCode.toUpperCase(),
				discountPercent: newDiscount,
				uses: 0,
				isActive: true,
			};
			const allPromos = StorageService.getPromos();
			allPromos.unshift(newPromo);
			StorageService.savePromos(allPromos);
			setPromos([newPromo, ...promos]);
			setNewCode('');
			setNewDiscount(10);
		}
	};

	const toggleStatus = async (id: string) => {
		const promo = promos.find((p) => p.id === id);
		if (!promo) return;

		try {
			const updated = await pbService.promos.updatePromo(id, { isActive: !promo.isActive });
			setPromos(promos.map((p) => (p.id === id ? updated : p)));
		} catch (_error) {
			// Fallback to localStorage
			const updated = { ...promo, isActive: !promo.isActive };
			const allPromos = StorageService.getPromos();
			const index = allPromos.findIndex((p) => p.id === id);
			if (index >= 0) {
				allPromos[index] = updated;
				StorageService.savePromos(allPromos);
			}
			setPromos(promos.map((p) => (p.id === id ? updated : p)));
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm('Удалить промокод?')) return;

		try {
			await pbService.promos.deletePromo(id);
			setPromos(promos.filter((p) => p.id !== id));
		} catch (_error) {
			// Fallback to localStorage
			const allPromos = StorageService.getPromos().filter((p) => p.id !== id);
			StorageService.savePromos(allPromos);
			setPromos(promos.filter((p) => p.id !== id));
		}
	};

	return (
		<div className="animate-fade-in max-w-5xl mx-auto">
			<div className="mb-8">
				<h2 className="text-2xl font-bold text-white mb-2">Маркетинг</h2>
				<p className="text-zinc-400">
					Управляйте скидками и промокодами для увеличения продаж.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Create Form */}
				<div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl h-fit">
					<div className="flex items-center gap-2 mb-6">
						<div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
							<Plus className="w-4 h-4" />
						</div>
						<h3 className="font-semibold text-zinc-100">Создать промокод</h3>
					</div>

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-zinc-400 mb-1">
								Код
							</label>
							<div className="relative">
								<Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
								<input
									type="text"
									value={newCode}
									onChange={(e) => setNewCode(e.target.value)}
									placeholder="SUMMER2024"
									className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-zinc-100 focus:ring-2 focus:ring-violet-500 outline-none uppercase"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-zinc-400 mb-1">
								Скидка (%)
							</label>
							<input
								type="range"
								min="5"
								max="90"
								step="5"
								value={newDiscount}
								onChange={(e) => setNewDiscount(Number(e.target.value))}
								className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
							/>
							<div className="flex justify-between text-xs text-zinc-500 mt-2">
								<span>5%</span>
								<span className="text-violet-400 font-bold">{newDiscount}%</span>
								<span>90%</span>
							</div>
						</div>

						<button
							onClick={handleCreate}
							disabled={!newCode}
							className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Создать
						</button>
					</div>
				</div>

				{/* List */}
				<div className="lg:col-span-2">
					<div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
						<table className="w-full text-left">
							<thead className="bg-zinc-800/50 text-xs text-zinc-400 uppercase">
								<tr>
									<th className="px-6 py-4 font-medium">Код</th>
									<th className="px-6 py-4 font-medium">Скидка</th>
									<th className="px-6 py-4 font-medium">Использований</th>
									<th className="px-6 py-4 font-medium">Статус</th>
									<th className="px-6 py-4 font-medium"></th>
								</tr>
							</thead>
							<tbody className="divide-y divide-zinc-800">
								{promos.map((promo) => (
									<tr
										key={promo.id}
										className="group hover:bg-zinc-800/30 transition-colors"
									>
										<td className="px-6 py-4">
											<div className="flex items-center gap-2">
												<span className="font-mono text-white font-medium">
													{promo.code}
												</span>
												<button className="text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
													<Copy className="w-3 h-3" />
												</button>
											</div>
										</td>
										<td className="px-6 py-4 text-zinc-300">
											-{promo.discountPercent}%
										</td>
										<td className="px-6 py-4 text-zinc-300">{promo.uses}</td>
										<td className="px-6 py-4">
											<button
												onClick={() => toggleStatus(promo.id)}
												className={`px-2 py-1 rounded-full text-xs font-medium border ${
													promo.isActive
														? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
														: 'bg-zinc-800 text-zinc-500 border-zinc-700'
												}`}
											>
												{promo.isActive ? 'Активен' : 'Отключен'}
											</button>
										</td>
										<td className="px-6 py-4 text-right">
											<button
												onClick={() => handleDelete(promo.id)}
												className="text-zinc-600 hover:text-red-400 transition-colors"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{promos.length === 0 && (
							<div className="p-8 text-center text-zinc-500 text-sm">
								Нет активных промокодов
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Marketing;
