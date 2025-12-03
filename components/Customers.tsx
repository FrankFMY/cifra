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

import { Download, Mail, Search } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { pbService } from '../services/pbService';
import { StorageService } from '../services/storage';

interface CustomerProfile {
	email: string;
	totalSpent: number;
	orderCount: number;
	lastOrderDate: string;
	productsBought: string[];
}

const Customers: React.FC = () => {
	const [customers, setCustomers] = useState<CustomerProfile[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCustomers = async () => {
			try {
				const sales = await pbService.sales.getSales();

				// Group sales by email to create customer profiles
				const customerMap = new Map<string, CustomerProfile>();

				sales.forEach((sale) => {
					const existing = customerMap.get(sale.customerEmail);

					if (existing) {
						existing.totalSpent += sale.amount;
						existing.orderCount += 1;
						existing.lastOrderDate = sale.date;
						if (!existing.productsBought.includes(sale.productTitle)) {
							existing.productsBought.push(sale.productTitle);
						}
					} else {
						customerMap.set(sale.customerEmail, {
							email: sale.customerEmail,
							totalSpent: sale.amount,
							orderCount: 1,
							lastOrderDate: sale.date,
							productsBought: [sale.productTitle],
						});
					}
				});

				setCustomers(Array.from(customerMap.values()));
			} catch (_error) {
				// Fallback to localStorage
				const sales = StorageService.getSales();
				const customerMap = new Map<string, CustomerProfile>();

				sales.forEach((sale) => {
					const existing = customerMap.get(sale.customerEmail);

					if (existing) {
						existing.totalSpent += sale.amount;
						existing.orderCount += 1;
						existing.lastOrderDate = sale.date;
						if (!existing.productsBought.includes(sale.productTitle)) {
							existing.productsBought.push(sale.productTitle);
						}
					} else {
						customerMap.set(sale.customerEmail, {
							email: sale.customerEmail,
							totalSpent: sale.amount,
							orderCount: 1,
							lastOrderDate: sale.date,
							productsBought: [sale.productTitle],
						});
					}
				});

				setCustomers(Array.from(customerMap.values()));
			}
			setLoading(false);
		};
		fetchCustomers();
	}, []);

	const handleExportCSV = () => {
		const headers = ['Email', 'Total Spent (RUB)', 'Orders', 'Last Order Date', 'Products'];
		const rows = customers.map((c) => [
			c.email,
			c.totalSpent,
			c.orderCount,
			c.lastOrderDate,
			`"${c.productsBought.join(', ')}"`,
		]);

		const csvContent =
			'data:text/csv;charset=utf-8,' +
			[headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', 'cifra_customers.csv');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	if (loading) return null;

	return (
		<div className="animate-fade-in max-w-6xl mx-auto pb-20">
			<div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
				<div>
					<h2 className="text-2xl font-bold text-white mb-2">Клиенты</h2>
					<p className="text-zinc-400">
						Ваша база контактов. Экспортируйте для Email-рассылок.
					</p>
				</div>
				<button
					onClick={handleExportCSV}
					disabled={customers.length === 0}
					className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors border border-zinc-700 disabled:opacity-50"
				>
					<Download className="w-4 h-4" />
					Экспорт CSV
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
					<div className="text-zinc-400 text-sm mb-1">Всего клиентов</div>
					<div className="text-2xl font-bold text-white">{customers.length}</div>
				</div>
				<div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
					<div className="text-zinc-400 text-sm mb-1">LTV (Средний чек)</div>
					<div className="text-2xl font-bold text-emerald-400">
						{customers.length > 0
							? Math.round(
									customers.reduce((acc, c) => acc + c.totalSpent, 0) /
										customers.length
								)
							: 0}{' '}
						₽
					</div>
				</div>
				<div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
					<div className="text-zinc-400 text-sm mb-1">Повторных покупок</div>
					<div className="text-2xl font-bold text-violet-400">
						{customers.filter((c) => c.orderCount > 1).length}
					</div>
				</div>
			</div>

			<div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead className="bg-zinc-800/50 text-xs text-zinc-400 uppercase">
							<tr>
								<th className="px-6 py-4 font-medium">Email</th>
								<th className="px-6 py-4 font-medium">Потрачено</th>
								<th className="px-6 py-4 font-medium">Заказов</th>
								<th className="px-6 py-4 font-medium">Последний заказ</th>
								<th className="px-6 py-4 font-medium hidden lg:table-cell">
									Товары
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-800">
							{customers.map((customer) => (
								<tr
									key={customer.email}
									className="group hover:bg-zinc-800/30 transition-colors"
								>
									<td className="px-6 py-4">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-full bg-violet-900/20 flex items-center justify-center text-violet-400">
												<Mail className="w-4 h-4" />
											</div>
											<span className="font-medium text-zinc-200">
												{customer.email}
											</span>
										</div>
									</td>
									<td className="px-6 py-4 text-emerald-400 font-medium">
										{customer.totalSpent} ₽
									</td>
									<td className="px-6 py-4 text-zinc-300">
										<span
											className={`px-2 py-0.5 rounded text-xs ${customer.orderCount > 1 ? 'bg-violet-500/10 text-violet-300' : 'bg-zinc-800 text-zinc-500'}`}
										>
											{customer.orderCount}
										</span>
									</td>
									<td className="px-6 py-4 text-zinc-400 text-sm">
										{customer.lastOrderDate}
									</td>
									<td className="px-6 py-4 text-zinc-500 text-xs hidden lg:table-cell max-w-xs truncate">
										{customer.productsBought.join(', ')}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{customers.length === 0 && (
					<div className="p-12 text-center">
						<div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
							<Search className="w-6 h-6" />
						</div>
						<h3 className="text-zinc-300 font-medium mb-1">Пока нет клиентов</h3>
						<p className="text-zinc-500 text-sm">
							Клиенты появятся здесь после первой продажи.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Customers;
