#!/usr/bin/env bun

/**
 * Скрипт для добавления copyright headers в файлы проекта
 * Запуск: bun run scripts/add-copyright.ts
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const COPYRIGHT_TS = `/**
 * @fileoverview Cifra Platform — Initiative Development / Инициативная разработка
 * @author Artyom Pryanishnikov <Pryanishnikovartem@gmail.com>
 * @copyright 2025 Artyom Pryanishnikov
 * @license PolyForm-Shield-1.0.0
 * 
 * INITIATIVE DEVELOPMENT: Created independently, without TZ or direct order.
 * IP rights remain with the Author. Commercial use requires agreement.
 * Contact: Pryanishnikovartem@gmail.com
 */

`;

const COPYRIGHT_TSX = `/**
 * @fileoverview Cifra Platform — Initiative Development / Инициативная разработка
 * @author Artyom Pryanishnikov <Pryanishnikovartem@gmail.com>
 * @copyright 2025 Artyom Pryanishnikov
 * @license PolyForm-Shield-1.0.0
 * 
 * INITIATIVE DEVELOPMENT: Created independently, without TZ or direct order.
 * IP rights remain with the Author. Commercial use requires agreement.
 * Contact: Pryanishnikovartem@gmail.com
 */

`;

const COPYRIGHT_JS = `/**
 * @fileoverview Cifra Platform — Initiative Development / Инициативная разработка
 * @author Artyom Pryanishnikov <Pryanishnikovartem@gmail.com>
 * @copyright 2025 Artyom Pryanishnikov
 * @license PolyForm-Shield-1.0.0
 * 
 * INITIATIVE DEVELOPMENT: Created independently, without TZ or direct order.
 * IP rights remain with the Author. Commercial use requires agreement.
 * Contact: Pryanishnikovartem@gmail.com
 */

`;

const EXTENSIONS: Record<string, string> = {
	'.ts': COPYRIGHT_TS,
	'.tsx': COPYRIGHT_TSX,
	'.js': COPYRIGHT_JS,
};

const IGNORE_DIRS = [
	'node_modules',
	'.next',
	'dist',
	'build',
	'.git',
	'.turbo',
	'pb_data',
	'.svelte-kit',
];

const IGNORE_FILES = [
	'*.d.ts',
	'*.config.*',
	'next-env.d.ts',
	'types.d.ts',
];

async function* walk(dir: string): AsyncGenerator<string> {
	const entries = await readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const path = join(dir, entry.name);

		if (entry.isDirectory()) {
			if (!IGNORE_DIRS.includes(entry.name)) {
				yield* walk(path);
			}
		} else {
			yield path;
		}
	}
}

function shouldIgnore(filename: string): boolean {
	return IGNORE_FILES.some((pattern) => {
		const regex = new RegExp(pattern.replace('*', '.*'));
		return regex.test(filename);
	});
}

async function addCopyright(filePath: string): Promise<boolean> {
	const ext = extname(filePath);
	const header = EXTENSIONS[ext];

	if (!header) return false;
	if (shouldIgnore(filePath)) return false;

	const content = await readFile(filePath, 'utf-8');

	// Уже есть copyright
	if (content.includes('@copyright') || content.includes('Copyright')) {
		return false;
	}

	// Для TS/TSX/JS: вставляем в начало
	const newContent = header + content;
	await writeFile(filePath, newContent);
	return true;
}

async function main() {
	console.log('🔒 Adding copyright headers...\n');

	let added = 0;
	let skipped = 0;

	// Обрабатываем основные директории проекта Cifra
	const directories = ['app', 'components', 'services', 'hooks', 'lib'];

	for (const dir of directories) {
		try {
			for await (const file of walk(dir)) {
				if (await addCopyright(file)) {
					console.log(`✅ ${file}`);
					added++;
				} else {
					skipped++;
				}
			}
		} catch (error) {
			// Директория может не существовать
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
				console.error(`Error processing ${dir}:`, error);
			}
		}
	}

	// Обрабатываем корневые файлы
	const rootFiles = ['constants.ts', 'types.ts', 'proxy.ts'];
	for (const file of rootFiles) {
		try {
			if (await addCopyright(file)) {
				console.log(`✅ ${file}`);
				added++;
			} else {
				skipped++;
			}
		} catch (error) {
			// Файл может не существовать
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
				console.error(`Error processing ${file}:`, error);
			}
		}
	}

	console.log(`\n📊 Done: ${added} files updated, ${skipped} skipped`);
}

main().catch(console.error);

