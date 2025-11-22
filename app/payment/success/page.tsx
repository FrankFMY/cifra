'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Download, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { pbService } from '@/services/pbService';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    
    if (!paymentId) {
      setError('Не найден ID платежа');
      setLoading(false);
      return;
    }

    // Запускаем конфетти
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#ffffff', '#10b981'],
    });

    // Проверяем статус заказа (webhook может еще не обработаться)
    const checkOrder = async () => {
      try {
        // Ждем немного, чтобы webhook успел обработаться
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // В реальном приложении здесь можно сделать запрос к API для проверки статуса
        // Пока просто показываем успех
        setLoading(false);
      } catch (err) {
        console.error('Error checking order:', err);
        setLoading(false);
      }
    };

    checkOrder();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Проверка платежа...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Оплата прошла успешно!</h1>
        <p className="text-zinc-400 mb-8">
          Спасибо за покупку! Ссылка на скачивание отправлена на вашу почту.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            Вернуться в магазин
          </button>
        </div>
      </div>
    </div>
  );
}

