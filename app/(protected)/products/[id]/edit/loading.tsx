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
		<div className="max-w-4xl mx-auto animate-pulse pb-20">
			<div className="h-10 w-32 bg-zinc-800 rounded-lg mb-8"></div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="lg:col-span-2 space-y-6">
					<div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
						<div className="h-6 w-32 bg-zinc-800 rounded"></div>
						<div className="h-10 w-full bg-zinc-800 rounded"></div>
					</div>

					<div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
						<div className="h-6 w-24 bg-zinc-800 rounded"></div>
						<div className="h-32 w-full bg-zinc-800 rounded"></div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
						<div className="h-6 w-24 bg-zinc-800 rounded mb-4"></div>
						<div className="aspect-4/3 w-full bg-zinc-800 rounded-lg"></div>
					</div>
				</div>
			</div>
		</div>
	);
}
