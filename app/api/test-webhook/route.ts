/**
 * Тестовый endpoint для эмуляции webhook от ЮKassa
 * Используйте этот endpoint для тестирования без реальной оплаты
 * 
 * POST /api/test-webhook
 * Body: { orderId: "order_id_from_pocketbase" }
 * 
 * ВАЖНО: Этот endpoint создает токен и отправляет email, но НЕ проверяет реальный платеж
 */

import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { sendPurchaseConfirmationEmail, sendSaleNotificationEmail } from '@/services/resendService';
import { randomBytes } from 'crypto';

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Авторизуемся как админ
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'PocketBase admin credentials not configured' },
        { status: 500 }
      );
    }

    await pb.admins.authWithPassword(adminEmail, adminPassword);

    // Находим заказ
    const order = await pb.collection('orders').getOne(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Получаем продукт
    const product = await pb.collection('products').getOne(order.product);

    // Создаем токен для доступа к файлам
    const downloadToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    try {
      await pb.collection('download_tokens').create({
        token: downloadToken,
        order: order.id,
        product: order.product,
        customerEmail: order.customerEmail,
        expiresAt: expiresAt.toISOString(),
        used: false,
        downloadCount: 0,
      });

      // Отправляем email покупателю
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const downloadUrl = `${siteUrl}/download/${downloadToken}`;

      const emailResult = await sendPurchaseConfirmationEmail({
        email: order.customerEmail,
        productTitle: product.title,
        downloadToken,
        downloadUrl,
        amount: order.amount,
        orderId: order.id,
      });

      // Отправляем уведомление продавцу
      let sellerEmailResult = null;
      try {
        const owner = await pb.collection('users').getOne(order.owner);
        if (owner.emailNotifications !== false) {
          sellerEmailResult = await sendSaleNotificationEmail({
            sellerEmail: owner.email,
            productTitle: product.title,
            customerEmail: order.customerEmail,
            amount: order.amount,
            netAmount: order.amount * 0.95 - 30, // Примерный расчет
            orderId: order.id,
          });
        }
      } catch (sellerError) {
        console.warn('Failed to send seller notification:', sellerError);
      }

      return NextResponse.json({
        success: true,
        message: 'Test webhook processed successfully',
        downloadToken,
        downloadUrl,
        emailSent: emailResult.success,
        sellerEmailSent: sellerEmailResult?.success || false,
        errors: {
          customerEmail: emailResult.error,
          sellerEmail: sellerEmailResult?.error,
        },
      });
    } catch (error: any) {
      console.error('Test webhook error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to process test webhook' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

