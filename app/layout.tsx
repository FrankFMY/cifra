import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Cifra | Digital Distribution',
  description: 'Платформа для продажи цифровых товаров',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className={`min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-violet-500/30 ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}

