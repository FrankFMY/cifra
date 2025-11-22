/**
 * UniSender Service
 * Сервис для работы с UniSender API
 * Документация: https://www.unisender.com/ru/support/api/
 */

interface SubscribeParams {
  email: string;
  name?: string;
  listId?: string;
  doubleOptin?: '0' | '3'; // 0 = с подтверждением, 3 = без подтверждения
}

interface SendEmailParams {
  email: string;
  subject: string;
  html: string;
  senderName?: string;
  senderEmail?: string;
  listId?: string;
}

interface UniSenderResponse {
  result?: {
    person_id?: string;
    [key: string]: unknown;
  };
  error?: string;
}

const UNISENDER_API_KEY = process.env.UNISENDER_API_KEY;
const UNISENDER_LIST_ID = process.env.UNISENDER_LIST_ID || '1';
const UNISENDER_SENDER_EMAIL = process.env.UNISENDER_SENDER_EMAIL || 'noreply@cifra.ru';
const UNISENDER_SENDER_NAME = process.env.UNISENDER_SENDER_NAME || 'Cifra';

/**
 * Подписка на рассылку
 */
export async function subscribeToNewsletter(params: SubscribeParams): Promise<{ success: boolean; error?: string }> {
  if (!UNISENDER_API_KEY) {
    console.error('UNISENDER_API_KEY не настроен');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const urlParams = new URLSearchParams({
      format: 'json',
      api_key: UNISENDER_API_KEY,
      list_ids: params.listId || UNISENDER_LIST_ID,
      fields: JSON.stringify({
        email: params.email,
        ...(params.name && { Name: params.name }),
      }),
      double_optin: params.doubleOptin || '3', // 3 = без подтверждения
      overwrite: '1', // Перезаписать, если существует
    });

    const response = await fetch(`https://api.unisender.com/ru/api/subscribe?${urlParams}`, {
      method: 'POST',
    });

    const data: UniSenderResponse = await response.json();

    if (data.error) {
      console.error('UniSender subscribe error:', data.error);
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    console.error('UniSender subscribe exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Отправка транзакционного email
 */
export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!UNISENDER_API_KEY) {
    console.error('UNISENDER_API_KEY не настроен');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // UniSender sendEmail API для транзакционных писем
    // Используем POST с параметрами в теле запроса
    // Параметры: api_key, email, sender_name, sender_email, subject, body (не body_html!)
    const formData = new URLSearchParams();
    formData.append('api_key', UNISENDER_API_KEY || '');
    formData.append('email', params.email);
    formData.append('sender_name', params.senderName || UNISENDER_SENDER_NAME || 'Cifra');
    formData.append('sender_email', params.senderEmail || UNISENDER_SENDER_EMAIL || '');
    formData.append('subject', params.subject);
    formData.append('body', params.html); // Используем 'body', не 'body_html'!

    // Примечание: sendEmail - это метод для одиночных транзакционных писем
    // Он НЕ принимает list_id и другие параметры массовых рассылок

    const response = await fetch('https://api.unisender.com/ru/api/sendEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data: UniSenderResponse = await response.json();

    if (data.error) {
      console.error('UniSender sendEmail error:', data.error);
      return { success: false, error: data.error };
    }

    return { success: true, messageId: data.result?.person_id as string | undefined };
  } catch (error) {
    console.error('UniSender sendEmail exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const downloadLink = `${siteUrl}/download/${params.downloadToken}`;

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
      
      <p>Для скачивания файлов нажмите на кнопку ниже:</p>
      <div style="text-align: center;">
        <a href="${downloadLink}" class="button">Скачать файлы</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Или скопируйте ссылку вручную:<br>
        <a href="${downloadLink}" style="color: #8b5cf6; word-break: break-all;">${downloadLink}</a>
      </p>
      
      <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
        <strong>Важно:</strong> Ссылка действительна в течение 30 дней. Сохраните это письмо для доступа к файлам.
      </p>
    </div>
    <div class="footer">
      <p>С уважением, команда Cifra</p>
      <p>Если у вас возникли вопросы, свяжитесь с нами через поддержку.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    email: params.email,
    subject: `Ваш заказ #${params.orderId} готов к скачиванию`,
    html,
  });
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
    .stats { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .stat-row:last-child { border-bottom: none; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Новая продажа! 💰</h1>
    </div>
    <div class="content">
      <p>Поздравляем! У вас новая продажа.</p>
      
      <div class="stats">
        <div class="stat-row">
          <span><strong>Товар:</strong></span>
          <span>${params.productTitle}</span>
        </div>
        <div class="stat-row">
          <span><strong>Покупатель:</strong></span>
          <span>${params.customerEmail}</span>
        </div>
        <div class="stat-row">
          <span><strong>Сумма продажи:</strong></span>
          <span>${params.amount.toFixed(2)} ₽</span>
        </div>
        <div class="stat-row">
          <span><strong>К получению:</strong></span>
          <span style="color: #10b981; font-weight: bold;">${params.netAmount.toFixed(2)} ₽</span>
        </div>
        <div class="stat-row">
          <span><strong>ID заказа:</strong></span>
          <span>#${params.orderId}</span>
        </div>
      </div>
      
      <p>Средства будут доступны для вывода после обработки платежа.</p>
    </div>
    <div class="footer">
      <p>С уважением, команда Cifra</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    email: params.sellerEmail,
    subject: `Новая продажа: ${params.productTitle}`,
    html,
  });
}

