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
 * API Route для предложения цены продукта через Gemini AI
 * POST /api/gemini/suggest-price
 */

import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
	try {
		if (!GEMINI_API_KEY) {
			return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
		}

		const { title, category } = await request.json();

		if (!title) {
			return NextResponse.json({ error: 'Title is required' }, { status: 400 });
		}

		const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
		const model = 'gemini-2.5-flash';

		const prompt = `
      Порекомендуй цену в рублях (RUB) для цифрового товара.
      Название: ${title}
      Категория: ${category || 'Other'}
      
      Ответь ТОЛЬКО числом (например: 1500). Не добавляй текст.
      Оценивай адекватно рынку цифровых товаров в РФ.
    `;

		const response = await ai.models.generateContent({
			model,
			contents: prompt,
		});

		const text = response.text?.trim();
		const price = parseInt(text || '0', 10);
		const finalPrice = Number.isNaN(price) ? 1000 : price;

		return NextResponse.json({ price: finalPrice });
	} catch (error) {
		console.error('Gemini suggest price error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Ошибка генерации цены' },
			{ status: 500 }
		);
	}
}
