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

export default function Loading() {
	return (
		<div className="space-y-8 animate-pulse">
			<div className="flex items-center justify-between">
				<div className="h-9 w-48 bg-zinc-800 rounded-lg"></div>
				<div className="h-10 w-40 bg-zinc-800 rounded-lg"></div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{[1, 2, 3].map((i) => (
					<div key={i} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
						<div className="h-4 w-24 bg-zinc-800 rounded mb-2"></div>
						<div className="h-8 w-32 bg-zinc-800 rounded mt-1"></div>
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{[1, 2].map((i) => (
					<div key={i} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
						<div className="h-6 w-48 bg-zinc-800 rounded mb-4"></div>
						<div className="h-64 bg-zinc-800 rounded"></div>
					</div>
				))}
			</div>

			<div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
				<div className="h-6 w-48 bg-zinc-800 rounded mb-4"></div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800"
						>
							<div className="h-48 w-full bg-zinc-800"></div>
							<div className="p-4 space-y-2">
								<div className="h-5 w-full bg-zinc-800 rounded"></div>
								<div className="h-4 w-24 bg-zinc-800 rounded"></div>
								<div className="h-6 w-20 bg-zinc-800 rounded mt-3"></div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
