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

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
	subsets: ['latin', 'cyrillic'],
	weight: ['300', '400', '500', '600', '700'],
	display: 'swap',
	variable: '--font-inter',
});

export const metadata: Metadata = {
	title: {
		default: 'Cifra | Digital Distribution',
		template: '%s | Cifra',
	},
	description:
		'Платформа для продажи цифровых товаров. Создавайте, продавайте и монетизируйте свои цифровые продукты: шаблоны, дизайны, код, электронные книги и многое другое.',
	keywords: [
		'цифровые товары',
		'digital products',
		'продажа файлов',
		'шаблоны',
		'дизайн',
		'электронные книги',
	],
	authors: [{ name: 'Cifra' }],
	creator: 'Cifra',
	publisher: 'Cifra',
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://cifra.example.com'),
	openGraph: {
		type: 'website',
		locale: 'ru_RU',
		url: '/',
		siteName: 'Cifra',
		title: 'Cifra | Digital Distribution',
		description: 'Платформа для продажи цифровых товаров',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Cifra | Digital Distribution',
		description: 'Платформа для продажи цифровых товаров',
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-video-preview': -1,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="ru" className={inter.variable}>
			<body
				className={`min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-violet-500/30 ${inter.className}`}
			>
				{children}
				<Toaster
					position="top-right"
					toastOptions={{
						duration: 4000,
						style: {
							background: '#18181b',
							color: '#f4f4f5',
							border: '1px solid #3f3f46',
							borderRadius: '8px',
							padding: '12px 16px',
						},
						success: {
							iconTheme: {
								primary: '#10b981',
								secondary: '#fff',
							},
						},
						error: {
							iconTheme: {
								primary: '#ef4444',
								secondary: '#fff',
							},
						},
					}}
				/>
			</body>
		</html>
	);
}
