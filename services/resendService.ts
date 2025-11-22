/**
 * Resend Service
 * Сервис для работы с Resend API
 * Документация: https://resend.com/docs
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';
const RESEND_SENDER_NAME = process.env.RESEND_SENDER_NAME || 'Cifra';

// Инициализируем Resend только если API ключ есть
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/**
 * Отправка транзакционного email через Resend
 */
export async function sendEmail(params: {
  email: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!resend) {
    console.error('RESEND_API_KEY не настроен');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const fromEmail = params.from || RESEND_SENDER_EMAIL;
    const fromName = params.fromName || RESEND_SENDER_NAME;
    const fromAddress = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    const result = await resend.emails.send({
      from: fromAddress,
      to: params.email,
      subject: params.subject,
      html: params.html,
    });

    if (result.error) {
      console.error('Resend sendEmail error:', result.error);
      return { success: false, error: result.error.message || 'Unknown error' };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Resend sendEmail exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Отправка email с ссылкой на скачивание файлов после покупки
 */
export async function sendPurchaseConfirmationEmail(params: {
  email: string;
  productTitle: string;
  downloadToken: string;
  downloadUrl: string;
  amount: number;
  orderId: string;
}): Promise<{ success: boolean; error?: string }> {
  const subject = `Ваша покупка на Cifra: ${params.productTitle}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Спасибо за покупку! 🎉</h1>
    </div>
    <div class="content">
      <p>Здравствуйте!</p>
      <p>Ваш заказ <strong>#${params.orderId}</strong> успешно оплачен.</p>
      
      <h2>Детали заказа:</h2>
      <ul>
        <li><strong>Товар:</strong> ${params.productTitle}</li>
        <li><strong>Сумма:</strong> ${params.amount.toFixed(2)} ₽</li>
      </ul>
      
      <p>Ваша ссылка для скачивания:</p>
      <p style="text-align: center;">
        <a href="${params.downloadUrl}" class="button">Скачать файл</a>
      </p>
      
      <p style="font-size: 14px; color: #6b7280;">
        Ссылка действительна в течение 30 дней.
      </p>
      
      <p>Если у вас возникли вопросы, свяжитесь с нами.</p>
      
      <div class="footer">
        <p>С уважением,<br>Команда Cifra</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const result = await sendEmail({
    email: params.email,
    subject,
    html,
  });

  return {
    success: result.success,
    error: result.error,
  };
}

/**
 * Отправка уведомления продавцу о новой продаже
 */
export async function sendSaleNotificationEmail(params: {
  sellerEmail: string;
  productTitle: string;
  customerEmail: string;
  amount: number;
  netAmount: number;
  orderId: string;
}): Promise<{ success: boolean; error?: string }> {
  const subject = `Новая продажа на Cifra: ${params.productTitle}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Новая продажа! 💰</h1>
    </div>
    <div class="content">
      <p>Здравствуйте!</p>
      <p>Поздравляем! У вас новая продажа на платформе Cifra:</p>
      
      <div class="info-box">
        <ul style="list-style: none; padding: 0;">
          <li><strong>Товар:</strong> ${params.productTitle}</li>
          <li><strong>Покупатель:</strong> ${params.customerEmail}</li>
          <li><strong>Сумма продажи:</strong> ${params.amount.toFixed(2)} ₽</li>
          <li><strong>Ваш чистый доход:</strong> ${params.netAmount.toFixed(2)} ₽</li>
          <li><strong>Номер заказа:</strong> ${params.orderId}</li>
        </ul>
      </div>
      
      <p>Спасибо, что используете Cifra!</p>
      
      <div class="footer">
        <p>С уважением,<br>Команда Cifra</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const result = await sendEmail({
    email: params.sellerEmail,
    subject,
    html,
  });

  return {
    success: result.success,
    error: result.error,
  };
}

