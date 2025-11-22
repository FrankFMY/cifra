import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Авторизуемся как админ для доступа к токенам
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    await pb.admins.authWithPassword(adminEmail, adminPassword);

    // Находим токен
    const downloadToken = await pb.collection('download_tokens').getFirstListItem(
      `token="${token}"`
    );

    // Проверяем срок действия
    const expiresAt = new Date(downloadToken.expiresAt);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Download link has expired' },
        { status: 410 }
      );
    }

    // Получаем продукт и файлы
    const product = await pb.collection('products').getOne(downloadToken.product);

    if (!product.productFiles || product.productFiles.length === 0) {
      return NextResponse.json(
        { error: 'No files available for this product' },
        { status: 404 }
      );
    }

    // Обновляем счетчик скачиваний
    await pb.collection('download_tokens').update(downloadToken.id, {
      downloadCount: (downloadToken.downloadCount || 0) + 1,
    });

    // Если один файл - возвращаем его напрямую
    // Если несколько - возвращаем ZIP (упрощенная версия - возвращаем первый файл)
    // В production лучше использовать библиотеку для создания ZIP
    const fileUrl = `${PB_URL}/api/files/${product.collectionId}/${product.id}/${product.productFiles[0]}`;

    // Перенаправляем на файл в PocketBase
    return NextResponse.redirect(fileUrl);
  } catch (error: any) {
    console.error('Download error:', error);

    if (error?.status === 404 || error?.response?.code === 404) {
      return NextResponse.json(
        { error: 'Download link not found or invalid' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    );
  }
}

