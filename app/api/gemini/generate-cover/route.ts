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
 * API Route для генерации обложки продукта через Gemini AI
 * POST /api/gemini/generate-cover
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
		const model = 'gemini-2.5-flash-image';

		const prompt = `
      Generate a high-quality, minimalistic, and modern digital art cover image for a digital product named "${title}" in the category "${category || 'Other'}".
      Style: Abstract, gradient, 3D render, high tech, clean.
      No text on the image.
      Aspect Ratio: 4:3.
    `;

		const response = await ai.models.generateContent({
			model: model,
			contents: {
				parts: [{ text: prompt }],
			},
			config: {
				imageConfig: {
					aspectRatio: '4:3',
				},
			},
		});

		let imageBase64: string | null = null;
		for (const part of response.candidates?.[0]?.content?.parts || []) {
			if (part.inlineData) {
				imageBase64 = `data:image/png;base64,${part.inlineData.data}`;
				break;
			}
		}

		if (!imageBase64) {
			return NextResponse.json(
				{ error: 'Не удалось сгенерировать изображение' },
				{ status: 500 }
			);
		}

		return NextResponse.json({ imageBase64 });
	} catch (error) {
		console.error('Gemini generate cover error:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Ошибка генерации обложки' },
			{ status: 500 }
		);
	}
}
