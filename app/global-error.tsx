'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import '../app/globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <html lang="ru">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Критическая ошибка</h1>
          <p className="text-zinc-400 mb-2">
            Произошла критическая ошибка приложения.
          </p>
          {error.digest && (
            <p className="text-zinc-500 text-sm mb-6">
              Код ошибки: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}

