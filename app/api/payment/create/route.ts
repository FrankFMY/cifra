import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

export async function POST(req: Request) {
  try {
    const { productId, amount, description, customerEmail, userId, promoCode } = await req.json();

    // Validate input
    if (!productId || !amount || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, amount, customerEmail' },
        { status: 400 }
      );
    }

    // Get product to find owner
    const productResponse = await fetch(`${PB_URL}/api/collections/products/records/${productId}`, {
      cache: 'no-store',
    });

    if (!productResponse.ok) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = await productResponse.json();

    // 1. Авторизуемся как админ в PB для записи заказа
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'PocketBase admin credentials not configured' },
        { status: 500 }
      );
    }

    await pb.admins.authWithPassword(adminEmail, adminPassword);

    // 2. Формируем ключ идемпотентности (уникальный ID запроса)
    const idempotenceKey = crypto.randomUUID();

    // 3. Данные авторизации ЮKassa
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;

    if (!shopId || !secretKey) {
      return NextResponse.json(
        { error: 'YooKassa credentials not configured' },
        { status: 500 }
      );
    }

    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 4. Запрос к API ЮKassa
    const yookassaResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB',
        },
        capture: true, // Сразу списываем деньги (в тестовом режиме это ок)
        confirmation: {
          type: 'redirect',
          return_url: `${baseUrl}/payment/success`,
        },
        description: description || `Покупка: ${product.title}`,
        metadata: {
          productId,
          customerEmail,
        },
      }),
    });

    const paymentData = await yookassaResponse.json();

    if (!yookassaResponse.ok) {
      console.error('YooKassa API error:', paymentData);
      return NextResponse.json(
        { error: paymentData.description || 'Ошибка создания платежа' },
        { status: yookassaResponse.status }
      );
    }

    // 5. Сохраняем заказ в PocketBase
    const order = await pb.collection('orders').create({
      user: userId || null,
      product: productId,
      owner: product.owner,
      customerEmail,
      amount: parseFloat(amount.toFixed(2)),
      status: 'pending',
      yookassa_payment_id: paymentData.id,
      metadata: paymentData, // Сохраняем весь объект для отладки
    });

    // 6. Возвращаем ссылку на оплату фронтенду
    return NextResponse.json({
      confirmationUrl: paymentData.confirmation.confirmation_url,
      orderId: order.id,
      paymentId: paymentData.id,
    });
  } catch (error: unknown) {
    console.error('Payment creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

