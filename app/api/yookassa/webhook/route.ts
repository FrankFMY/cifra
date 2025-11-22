import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, object } = body;

    // Проверяем, что событие нас интересует
    if (event === 'payment.succeeded') {
      const paymentId = object.id;

      // !!! ВАЖНО (Security Best Practice) !!!
      // Не верьте слепо body вебхука. Сделайте GET запрос к ЮKassa,
      // чтобы убедиться, что платеж с этим ID реально существует и оплачен.

      const shopId = process.env.YOOKASSA_SHOP_ID;
      const secretKey = process.env.YOOKASSA_SECRET_KEY;

      if (!shopId || !secretKey) {
        console.error('YooKassa credentials not configured');
        return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
      }

      const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
      const checkResponse = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
        headers: { 'Authorization': `Basic ${auth}` },
      });

      if (!checkResponse.ok) {
        console.error('Failed to verify payment with YooKassa:', await checkResponse.text());
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
      }

      const verifiedPayment = await checkResponse.json();

      if (verifiedPayment.status === 'succeeded') {
        // 1. Авторизация админа PB
        const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
        const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
          console.error('PocketBase admin credentials not configured');
          return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        await pb.admins.authWithPassword(adminEmail, adminPassword);

        // 2. Находим заказ в PB по payment_id
        try {
          const order = await pb.collection('orders').getFirstListItem(
            `yookassa_payment_id="${paymentId}"`
          );

          // 3. Обновляем статус заказа
          if (order && order.status === 'pending') {
            await pb.collection('orders').update(order.id, {
              status: 'paid',
              paid_at: new Date().toISOString(),
              metadata: verifiedPayment, // Обновляем метаданные
            });

            // 4. Создаем запись о продаже
            const product = await pb.collection('products').getOne(order.product);
            const amount = parseFloat(verifiedPayment.amount.value);
            const platformFee = Math.round(amount * 0.05 * 100) / 100; // 5% комиссия
            const transactionFee = 30; // 30 руб за транзакцию
            const netAmount = Math.round((amount - platformFee - transactionFee) * 100) / 100;

            await pb.collection('sales').create({
              product: order.product,
              customerEmail: order.customerEmail,
              amount: amount,
              platformFee: platformFee,
              netAmount: netAmount,
              owner: order.owner,
            });

            // 5. Обновляем статистику продукта
            await pb.collection('products').update(order.product, {
              sales: (product.sales || 0) + 1,
              revenue: (product.revenue || 0) + netAmount,
            });
          }
        } catch (error) {
          console.error('Error updating order:', error);
          // Продолжаем выполнение, чтобы вернуть 200 OK
        }
      }
    } else if (event === 'payment.canceled') {
      // Обработка отмены платежа
      const paymentId = object.id;

      const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
      const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

      if (adminEmail && adminPassword) {
        try {
          await pb.admins.authWithPassword(adminEmail, adminPassword);
          const order = await pb.collection('orders').getFirstListItem(
            `yookassa_payment_id="${paymentId}"`
          );

          if (order && order.status === 'pending') {
            await pb.collection('orders').update(order.id, {
              status: 'canceled',
            });
          }
        } catch (error) {
          console.error('Error updating canceled order:', error);
        }
      }
    }

    // Всегда отвечаем 200 OK ЮКассе, иначе она будет слать хуки повторно
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    // Даже при ошибке лучше вернуть 200, если это логическая ошибка вашего кода,
    // чтобы не заспамить себя повторами. Но для отладки можно 500.
    return NextResponse.json({ received: true }); // Возвращаем 200, чтобы не получать повторные запросы
  }
}

