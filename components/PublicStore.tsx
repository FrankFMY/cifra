'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShieldCheck, Download, CreditCard, Lock, Loader2, CheckCircle, X, QrCode, Smartphone, FileText, Mail } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, UserSettings } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { StorageService } from '../services/storage';
import { pbService } from '../services/pbService';

interface PublicStoreProps {
  product: Product;
  sellerSettings: UserSettings;
  onClose: () => void;
}

const PublicStore: React.FC<PublicStoreProps> = ({ product, sellerSettings, onClose }) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [email, setEmail] = useState('');
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [otherProducts, setOtherProducts] = useState<Product[]>([]);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
  
  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'sbp'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  
  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string, percent: number} | null>(null);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    // Fetch Cross-sell products
    const fetchOthers = async () => {
      try {
        const all = await pbService.products.getProducts();
        const others = all
          .filter(p => p.id !== product.id && p.status === 'published')
          .sort(() => 0.5 - Math.random()) // Shuffle
          .slice(0, 3);
        setOtherProducts(others);
      } catch {
        // Fallback to localStorage
        const all = StorageService.getProducts();
        const others = all
          .filter(p => p.id !== product.id && p.status === 'published')
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        setOtherProducts(others);
      }
    };
    fetchOthers();
  }, [product]);

  const handleNavigateToProduct = (id: string) => {
    // Use Next.js router if available, otherwise fallback to window.location
    if (typeof window !== 'undefined') {
      window.location.href = `/product/${id}`;
    }
  };

  const calculateTotal = () => {
    if (appliedPromo) {
        const discountAmount = Math.round(product.priceRub * (appliedPromo.percent / 100));
        return Math.max(0, product.priceRub - discountAmount);
    }
    return product.priceRub;
  };

  const finalTotal = calculateTotal();

  const handleApplyPromo = async () => {
    setPromoError('');
    if (!promoCode) return;
    
    try {
      const found = await pbService.promos.getPromoByCode(promoCode.toUpperCase());
      if (found && found.isActive) {
        setAppliedPromo({ code: found.code, percent: found.discountPercent });
      } else {
        setPromoError('Промокод не найден или неактивен');
        setAppliedPromo(null);
      }
    } catch {
      // Fallback to localStorage
      const allPromos = StorageService.getPromos();
      const found = allPromos.find(p => p.code === promoCode.toUpperCase() && p.isActive);
      if (found) {
        setAppliedPromo({ code: found.code, percent: found.discountPercent });
      } else {
        setPromoError('Промокод не найден или неактивен');
        setAppliedPromo(null);
      }
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (v.length >= 2) {
          v = v.substring(0, 2) + '/' + v.substring(2, 4);
      }
      setCardExpiry(v);
  };

  const downloadFile = () => {
      const content = `
Product: ${product.title}
Price Paid: ${finalTotal} RUB
Date: ${new Date().toLocaleString()}
Seller: ${sellerSettings.displayName}
-------------------------------------------------

THANK YOU FOR YOUR PURCHASE!

Here is your content:
${product.description}

(This is a generated file. In a real app, this would be your downloaded asset.)
      `;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = product.files[0] || `${product.title.replace(/\s+/g, '_')}_content.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handlePay = async () => {
    if (!email.includes('@')) {
        alert("Пожалуйста, введите корректный Email");
        return;
    }
    
    if (paymentMethod === 'card') {
        if (cardNumber.length < 16) {
            alert("Введите полный номер карты");
            return;
        }
    }

    setProcessingState('processing');

    // Simulate Payment Gateway delay
    setTimeout(async () => {
        try {
          await pbService.sales.createSale(product.id, finalTotal, email);
          if (appliedPromo) {
            const promo = await pbService.promos.getPromoByCode(appliedPromo.code);
            if (promo) {
              await pbService.promos.incrementPromoUses(promo.id);
            }
          }
        } catch (error) {
          // Fallback to localStorage
          StorageService.recordSale(product.id, finalTotal, email);
        }
        
        setProcessingState('success');
        
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: [sellerSettings.accentColor, '#ffffff', '#10b981']
        });
    }, 2500);
  };

  if (processingState === 'success') {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
             <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Оплата прошла успешно!</h2>
                <p className="text-zinc-400 mb-8">Спасибо за покупку. Файлы отправлены на {email}</p>
                
                <div className="space-y-3">
                    <button 
                        onClick={downloadFile}
                        className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Скачать файлы
                    </button>
                    <button onClick={onClose} className="w-full py-3 text-zinc-500 hover:text-white transition-colors text-sm">
                        Вернуться в магазин
                    </button>
                </div>
             </div>
        </div>
      );
  }

  return (
    <div className="bg-black min-h-screen flex flex-col relative">
      <div className="bg-violet-900/20 border-b border-violet-500/20 py-3 px-6 text-center text-xs font-medium text-violet-300">
         Режим предпросмотра. <span className="underline cursor-pointer" onClick={onClose}>Вернуться в панель управления</span>
      </div>

      <div className="flex-1 flex flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          
          <div className="space-y-6 animate-fade-in">
             <div className="aspect-4/3 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl shadow-violet-900/10 relative">
               {product.coverImage && product.coverImage.trim() !== '' && (
                 <Image 
                   src={product.coverImage} 
                   alt={product.title} 
                   fill
                   className="object-cover"
                   unoptimized={product.coverImage.startsWith('data:')}
                 />
               )}
               <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
             </div>
             
             <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 relative">
                        {sellerSettings.avatarUrl && sellerSettings.avatarUrl.trim() !== '' ? (
                            <Image 
                              src={sellerSettings.avatarUrl} 
                              alt={sellerSettings.displayName} 
                              fill
                              className="object-cover"
                              unoptimized={sellerSettings.avatarUrl.startsWith('data:')}
                            />
                        ) : (
                            <span className="text-xl font-bold text-zinc-500">{sellerSettings.displayName.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500">Автор</p>
                        <p className="font-medium text-white">{sellerSettings.displayName}</p>
                    </div>
                 </div>
                 <a 
                    href={`mailto:?subject=Вопрос по товару: ${product.title}`}
                    className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors"
                    title="Задать вопрос автору"
                 >
                     <Mail className="w-5 h-5" />
                 </a>
             </div>
          </div>

          <div className="text-zinc-100 space-y-8 animate-fade-in" style={{animationDelay: '0.1s'}}>
             <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400 mb-4">
                  {CATEGORY_LABELS[product.category]}
               </div>
               <h1 className="text-4xl font-extrabold tracking-tight mb-4">{product.title}</h1>
               <div className="flex items-center gap-2 text-zinc-400 text-sm mb-6">
                  <div className="flex text-yellow-500">★★★★★</div>
                  <span>4.9 (120 оценок)</span>
               </div>
               <div className="text-3xl font-bold text-white flex items-center gap-2">
                  {product.priceRub} ₽
                  <span className="text-sm font-normal text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                    Цифровая копия
                  </span>
               </div>
             </div>

             <div className="prose prose-invert prose-zinc max-w-none">
                {product.description.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 text-zinc-300 leading-relaxed">{line}</p>
                ))}
             </div>

             <div className="sticky bottom-4 z-10">
                <div className="bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-800 p-6 space-y-4 shadow-2xl">
                    <button 
                        onClick={() => setShowCheckout(true)}
                        style={{ backgroundColor: sellerSettings.accentColor }}
                        className="w-full py-4 text-white font-bold text-lg rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
                    >
                        <CreditCard className="w-5 h-5" />
                        Купить за {product.priceRub} ₽
                    </button>
                    <p className="text-center text-xs text-zinc-500 flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Безопасная оплата картами РФ
                    </p>
                    <div className="flex justify-center gap-3 opacity-30 grayscale">
                        <div className="h-6 w-10 bg-white rounded flex items-center justify-center text-[8px] text-black font-bold font-serif italic">VISA</div>
                        <div className="h-6 w-10 bg-white rounded flex items-center justify-center text-[8px] text-black font-bold">MIR</div>
                        <div className="h-6 w-10 bg-white rounded flex items-center justify-center text-[8px] text-black font-bold">MC</div>
                    </div>
                </div>
             </div>
          </div>
        </div>

        {otherProducts.length > 0 && (
            <div className="w-full max-w-5xl border-t border-zinc-800 pt-16">
                <h3 className="text-xl font-bold text-white mb-8">Другие товары автора</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {otherProducts.map(other => (
                        <div 
                            key={other.id} 
                            onClick={() => handleNavigateToProduct(other.id)}
                            className="group cursor-pointer bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-colors"
                        >
                            <div className="h-40 overflow-hidden relative">
                                {other.coverImage && other.coverImage.trim() !== '' && (
                                  <Image 
                                    src={other.coverImage} 
                                    alt={other.title} 
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    unoptimized={other.coverImage.startsWith('data:')}
                                  />
                                )}
                            </div>
                            <div className="p-4">
                                <h4 className="text-sm font-medium text-zinc-100 group-hover:text-violet-400 transition-colors line-clamp-1">{other.title}</h4>
                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-xs text-zinc-500">{CATEGORY_LABELS[other.category]}</span>
                                    <span className="text-sm font-bold text-white">{other.priceRub} ₽</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      <footer className="border-t border-zinc-900 bg-zinc-950/50 py-12 mt-auto">
          <div className="max-w-5xl mx-auto px-6 text-center">
              <div className="flex justify-center gap-8 text-xs text-zinc-500 mb-6">
                  <button onClick={() => setActiveModal('privacy')} className="cursor-pointer hover:text-zinc-300">Политика конфиденциальности</button>
                  <button onClick={() => setActiveModal('terms')} className="cursor-pointer hover:text-zinc-300">Оферта и условия</button>
                  <a href="mailto:support@cifra.store" className="cursor-pointer hover:text-zinc-300">Поддержка платформы</a>
              </div>
              <p className="text-[10px] text-zinc-600">
                  © 2024 Cifra. Платформа для цифровой дистрибуции. Безопасные платежи обеспечиваются партнером.
              </p>
          </div>
      </footer>

      {/* Legal Modals */}
      {activeModal && (
          <div className="fixed inset-0 z-150 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
              <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-8 animate-fade-in max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-zinc-400" />
                          {activeModal === 'privacy' ? 'Политика конфиденциальности' : 'Оферта и условия'}
                      </h3>
                      <button onClick={() => setActiveModal(null)} className="text-zinc-500 hover:text-white">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="prose prose-invert prose-sm text-zinc-400">
                      {activeModal === 'privacy' ? (
                          <>
                            <p>Настоящая Политика конфиденциальности персональных данных (далее – Политика конфиденциальности) действует в отношении всей информации, которую Сайт может получить о Пользователе во время использования сайта, программ и продуктов сайта.</p>
                            <p>1.1 В рамках настоящей Политики под «персональной информацией пользователя» понимаются: Личная информация, которую пользователь предоставляет о себе самостоятельно при регистрации (создании учётной записи) или в процессе использования Сервисов.</p>
                            <p>1.2 Мы защищаем ваши данные с использованием современных стандартов шифрования и не передаем их третьим лицам, за исключением случаев, предусмотренных законодательством РФ.</p>
                          </>
                      ) : (
                          <>
                             <p>Настоящий текст является публичной офертой (предложением) в соответствии со статьей 435 и пунктом 2 статьи 437 Гражданского кодекса Российской Федерации.</p>
                             <p>1. ПРЕДМЕТ ДОГОВОРА</p>
                             <p>1.1. Продавец обязуется передать в собственность Покупателя Цифровой товар, а Покупатель обязуется принять и оплатить Товар на условиях настоящей Оферты.</p>
                             <p>2. ВОЗВРАТ ТОВАРА</p>
                             <p>2.1. Цифровые товары надлежащего качества не подлежат возврату или обмену на аналогичный товар. Будьте внимательны при покупке.</p>
                          </>
                      )}
                  </div>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="mt-8 w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                  >
                      Понятно, закрыть
                  </button>
              </div>
          </div>
      )}

      {showCheckout && (
          <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCheckout(false)}></div>
              <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 sm:rounded-2xl rounded-t-2xl p-6 animate-fade-in shadow-2xl max-h-[90vh] overflow-y-auto">
                  
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Lock className="w-4 h-4 text-zinc-400" />
                          Оплата заказа
                      </h3>
                      <button onClick={() => setShowCheckout(false)} className="text-zinc-500 hover:text-white">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  {processingState === 'processing' ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                          <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
                          <p className="text-white font-medium">Обработка платежа...</p>
                          <p className="text-sm text-zinc-500 mt-1">Не закрывайте окно</p>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                  <span className="text-sm text-zinc-300 truncate max-w-[200px]">{product.title}</span>
                                  <div className="text-right">
                                    {appliedPromo && <span className="block text-xs text-zinc-500 line-through">{product.priceRub} ₽</span>}
                                    <span className="font-bold text-xl text-white">{finalTotal} ₽</span>
                                  </div>
                              </div>
                              {appliedPromo && (
                                  <div className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-fit">
                                      Скидка {appliedPromo.percent}% (Промокод: {appliedPromo.code})
                                  </div>
                              )}
                          </div>

                          {/* Email */}
                          <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Email</label>
                              <input 
                                  type="email" 
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="you@email.com"
                                  className={`w-full bg-zinc-950 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all ${email && !email.includes('@') ? 'border-red-900/50' : 'border-zinc-700'}`}
                              />
                          </div>

                           {/* Payment Methods */}
                           <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Способ оплаты</label>
                              <div className="grid grid-cols-2 gap-3">
                                  <button 
                                    onClick={() => setPaymentMethod('card')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${paymentMethod === 'card' ? 'bg-violet-600/10 border-violet-500 text-violet-300' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                  >
                                      <CreditCard className="w-5 h-5 mb-1" />
                                      <span className="text-xs font-medium">Карта РФ</span>
                                  </button>
                                  <button 
                                    onClick={() => setPaymentMethod('sbp')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${paymentMethod === 'sbp' ? 'bg-emerald-600/10 border-emerald-500 text-emerald-300' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                  >
                                      <QrCode className="w-5 h-5 mb-1" />
                                      <span className="text-xs font-medium">СБП</span>
                                  </button>
                              </div>
                           </div>

                          {/* Card Inputs */}
                          {paymentMethod === 'card' && (
                            <div className="animate-fade-in space-y-3">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={cardNumber}
                                        onChange={handleCardNumberChange}
                                        placeholder="0000 0000 0000 0000"
                                        maxLength={19}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none font-mono tracking-wide"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                        <div className="w-5 h-3 bg-zinc-700 rounded-sm"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input 
                                        type="text" 
                                        value={cardExpiry}
                                        onChange={handleExpiryChange}
                                        placeholder="MM/YY" 
                                        maxLength={5}
                                        className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white text-center focus:ring-2 focus:ring-violet-500 outline-none" 
                                    />
                                    <input 
                                        type="password" 
                                        value={cardCvc}
                                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                                        placeholder="CVC" 
                                        maxLength={3}
                                        className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white text-center focus:ring-2 focus:ring-violet-500 outline-none" 
                                    />
                                </div>
                            </div>
                          )}

                           {/* SBP Info */}
                           {paymentMethod === 'sbp' && (
                               <div className="animate-fade-in p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-4">
                                   <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                                       <QrCode className="w-full h-full text-black" />
                                   </div>
                                   <div>
                                       <p className="text-sm text-white font-medium">Оплата через приложение банка</p>
                                       <p className="text-xs text-zinc-500">Сбербанк, Тинькофф, Альфа и др.</p>
                                   </div>
                               </div>
                           )}

                           {/* Promo Input */}
                           <div className="pt-2">
                               <div className="flex gap-2">
                                   <input 
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        placeholder="Промокод"
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-violet-500 outline-none uppercase text-xs"
                                   />
                                   <button 
                                        onClick={handleApplyPromo}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                                   >
                                       Применить
                                   </button>
                               </div>
                               {promoError && <p className="text-xs text-red-400 mt-1">{promoError}</p>}
                          </div>

                          <button 
                              onClick={handlePay}
                              disabled={!email || (paymentMethod === 'card' && cardNumber.length < 19)}
                              className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg mt-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                              {paymentMethod === 'sbp' ? <Smartphone className="w-4 h-4"/> : <Lock className="w-4 h-4"/>}
                              Оплатить {finalTotal} ₽
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default PublicStore;
