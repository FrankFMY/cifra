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

/**
 * API Route для генерации описания продукта через Gemini AI
 * POST /api/gemini/generate-description
 */

import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
	try {
		if (!GEMINI_API_KEY) {
			return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
		}

		const { title, category, features } = await request.json();

		if (!title) {
			return NextResponse.json({ error: 'Title is required' }, { status: 400 });
		}

		const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
		const model = 'gemini-2.5-flash';

		const prompt = `
      Ты опытный копирайтер для платформы продажи цифровых товаров (аналог Gumroad).
      Напиши продающее, краткое и структурированное описание на русском языке для продукта.
      
      Название: ${title}
      Категория: ${category || 'Other'}
      Ключевые особенности (если есть): ${features || ''}
      
      Структура ответа:
      1. Короткий цепляющий заголовок (hook).
      2. Описание проблемы, которую решает продукт (1-2 предложения).
      3. Список того, что внутри (буллиты).
      4. Призыв к действию.
      
      Не используй markdown разметку для заголовков (###), используй просто текст и эмодзи.
    `;

		const response = await ai.models.generateContent({
			model: model,
			contents: prompt,
			config: {
				temperature: 0.7,
				maxOutputTokens: 400,
			},
		});

		const description = response.text || 'Не удалось сгенерировать описание.';

		return NextResponse.json({ description });
	} catch (error) {
		console.error('Gemini generate description error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Ошибка генерации описания' },
			{ status: 500 }
		);
	}
}
