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

import { LayoutGrid, Percent, Search, ShoppingBag, User, Users } from 'lucide-react';
import type React from 'react';
import type { ViewState } from '../types';

interface NavbarProps {
	activeView: string;
	onNavigate: (view: ViewState) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeView, onNavigate }) => {
	return (
		<nav className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center gap-4 lg:gap-8">
						<div
							className="flex items-center gap-2 cursor-pointer shrink-0"
							onClick={() => onNavigate('dashboard')}
						>
							<div className="w-8 h-8 bg-linear-to-tr from-violet-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
								C
							</div>
							<span className="hidden sm:inline text-xl font-bold text-white tracking-tight">
								Cifra
							</span>
						</div>

						<div className="flex items-center space-x-1">
							<button
								onClick={() => onNavigate('dashboard')}
								title="Дашборд"
								className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'dashboard' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
							>
								<LayoutGrid className="w-5 h-5 sm:w-4 sm:h-4" />
								<span className="hidden sm:inline">Дашборд</span>
							</button>
							<button
								onClick={() => onNavigate('create-product')}
								title="Продукты"
								className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'create-product' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
							>
								<ShoppingBag className="w-5 h-5 sm:w-4 sm:h-4" />
								<span className="hidden sm:inline">Продукты</span>
							</button>
							<button
								onClick={() => onNavigate('marketing')}
								title="Маркетинг"
								className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'marketing' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
							>
								<Percent className="w-5 h-5 sm:w-4 sm:h-4" />
								<span className="hidden sm:inline">Маркетинг</span>
							</button>
							<button
								onClick={() => onNavigate('customers')}
								title="Клиенты"
								className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'customers' ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
							>
								<Users className="w-5 h-5 sm:w-4 sm:h-4" />
								<span className="hidden sm:inline">Клиенты</span>
							</button>
						</div>
					</div>

					<div className="flex items-center gap-4">
						<div className="relative hidden md:block">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
							<input
								type="text"
								placeholder="Поиск..."
								className="bg-zinc-900 border border-zinc-800 rounded-full pl-9 pr-4 py-1.5 text-sm text-zinc-200 focus:ring-1 focus:ring-zinc-700 outline-none w-48 lg:w-64"
							/>
						</div>
						<button
							onClick={() => onNavigate('settings')}
							className={`h-9 w-9 rounded-full flex items-center justify-center border transition-colors ${activeView === 'settings' ? 'bg-zinc-700 border-zinc-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
						>
							<User className="w-5 h-5 sm:w-4 sm:h-4" />
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
