'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Download, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function DownloadPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setError('Invalid download link');
      setLoading(false);
      return;
    }

    // Перенаправляем на API endpoint для скачивания
    // API endpoint обработает токен и вернет файл
    const downloadFile = async () => {
      try {
        const response = await fetch(`/api/download/${token}`, {
          method: 'GET',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Failed to download file');
        }

        // Если ответ - редирект, браузер автоматически перейдет на файл
        // Если JSON - обрабатываем ошибку
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to download file');
        }

        // Редирект на файл произойдет автоматически
        setLoading(false);
      } catch (err) {
        console.error('Download error:', err);
        setError(err instanceof Error ? err.message : 'Failed to download file');
        setLoading(false);
      }
    };

    downloadFile();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Подготовка файлов...</h1>
          <p className="text-zinc-400">Пожалуйста, подождите</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Ошибка загрузки</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
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
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Файлы загружаются</h1>
        <p className="text-zinc-400 mb-6">
          Если загрузка не началась автоматически, нажмите на кнопку ниже
        </p>
        <button
          onClick={() => {
            window.location.href = `/api/download/${token}`;
          }}
          className="w-full py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Скачать файлы
        </button>
      </div>
    </div>
  );
}

