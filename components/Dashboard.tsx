'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Package, ArrowUpRight, Plus, MousePointerClick, Copy, ExternalLink, RefreshCw, Pencil, Trash2, CheckCircle, Circle, AlertCircle, Wallet, EyeOff } from 'lucide-react';
import { Product, Sale } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { StorageService } from '../services/storage';
import { pbService } from '../services/pbService';

interface DashboardProps {
  onCreateClick: () => void;
  onEditClick: (product: Product) => void;
  onProductClick: (p: Product) => void;
}

const TRAFFIC_DATA = [
  { name: 'Telegram', value: 450, color: '#2AABEE' },
  { name: 'ВКонтакте', value: 300, color: '#0077FF' },
  { name: 'Прямые', value: 150, color: '#10b981' },
  { name: 'Органика', value: 100, color: '#8b5cf6' },
];

const Dashboard: React.FC<DashboardProps> = ({ onCreateClick, onEditClick, onProductClick }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try PocketBase first
      const [p, s, balance] = await Promise.all([
        pbService.products.getProducts(true).catch(() => []),
        pbService.sales.getSales().catch(() => []),
        pbService.payouts.getAvailableBalance().catch(() => 0)
      ]);
      setProducts(p);
      setSales(s);
      setAvailableBalance(balance);
    } catch (error) {
      // Fallback to localStorage
      console.error('Failed to fetch from PocketBase, using localStorage:', error);
    const p = StorageService.getProducts();
    const s = StorageService.getSales();
    setProducts(p);
    setSales(s);
    setAvailableBalance(StorageService.getAvailableBalance());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Delay charts rendering to avoid size calculation issues in Strict Mode
    const timer = setTimeout(() => setChartsReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    pbService.settings.getSettings().then(settings => {
      setHasProfile(settings.avatarUrl !== '');
    }).catch(() => {
      setHasProfile(StorageService.getSettings().avatarUrl !== '');
    });
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Вы уверены, что хотите удалить этот товар? Статистика продаж останется, но товар исчезнет из магазина.')) {
        try {
          await pbService.products.deleteProduct(id);
        } catch (error) {
          // Fallback to localStorage
        StorageService.deleteProduct(id);
        }
        fetchData();
    }
  };

  const handleWithdraw = async () => {
      const amount = Number(withdrawAmount);
      if (amount <= 0 || amount > availableBalance) {
          alert("Некорректная сумма");
          return;
      }
      setIsWithdrawing(true);
      try {
        await pbService.payouts.createPayout(amount, 'Карта •••• 4582');
        setIsWithdrawing(false);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchData();
        alert(`Средства (${amount} ₽) успешно отправлены на вашу карту.`);
      } catch (error) {
        // Fallback to localStorage
          StorageService.requestPayout(amount);
          setIsWithdrawing(false);
          setShowWithdrawModal(false);
          setWithdrawAmount('');
          fetchData();
          alert(`Средства (${amount} ₽) успешно отправлены на вашу карту.`);
      }
  };

  // Calculate Real Metrics
  const totalRevenue = products.reduce((acc, p) => acc + p.revenue, 0); // Total lifetime net revenue
  const totalSales = products.reduce((acc, p) => acc + p.sales, 0);
  
  // Prepare Sales Chart Data from real sales history
  const salesChartData = sales.reduce((acc: any[], sale) => {
    const existingDay = acc.find(d => d.date === sale.date);
    if (existingDay) {
        existingDay.amount += sale.netAmount;
    } else {
        acc.push({ date: sale.date, amount: sale.netAmount });
    }
    return acc;
  }, []).slice(-7); // Last 7 active days

  const handleShare = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.status === 'draft') {
        alert('Нельзя поделиться черновиком. Опубликуйте товар, чтобы открыть доступ.');
        return;
    }
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/product/${product.id}`;
    if (typeof window !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(url);
    alert(`Ссылка на магазин скопирована: ${url}`);
    }
  };

  // Onboarding Status
  const hasProducts = products.length > 0;
  const hasSales = sales.length > 0;
  const onboardingProgress = [hasProducts, hasProfile, hasSales].filter(Boolean).length / 3 * 100;

  if (loading) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      
      {/* Onboarding Widget */}
      {onboardingProgress < 100 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Добро пожаловать в Cifra!</h3>
                  <span className="text-sm font-mono text-violet-400">{Math.round(onboardingProgress)}% готово</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full mb-6">
                  <div className="bg-violet-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${onboardingProgress}%` }}></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`flex items-center gap-3 p-3 rounded-lg border ${hasProducts ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-zinc-700 bg-zinc-800/30'}`}>
                      {hasProducts ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-zinc-500" />}
                      <span className={hasProducts ? 'text-emerald-200' : 'text-zinc-400'}>Создать первый продукт</span>
                  </div>
                   <div className={`flex items-center gap-3 p-3 rounded-lg border ${hasProfile ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-zinc-700 bg-zinc-800/30'}`}>
                      {hasProfile ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-zinc-500" />}
                      <span className={hasProfile ? 'text-emerald-200' : 'text-zinc-400'}>Настроить аватар профиля</span>
                  </div>
                   <div className={`flex items-center gap-3 p-3 rounded-lg border ${hasSales ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-zinc-700 bg-zinc-800/30'}`}>
                      {hasSales ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-zinc-500" />}
                      <span className={hasSales ? 'text-emerald-200' : 'text-zinc-400'}>Получить первую продажу</span>
                  </div>
              </div>
          </div>
      )}

      {/* Header stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 text-sm font-medium">Общая выручка</h3>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {totalRevenue.toLocaleString('ru-RU')} ₽
          </div>
          <div className="mt-2 flex items-center text-xs text-zinc-500">
            <span>За всё время</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 text-sm font-medium">Продажи</h3>
            <Package className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {totalSales}
          </div>
           <div className="mt-2 text-xs text-zinc-500">
            Цифровые копии
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 text-sm font-medium">Конверсия</h3>
            <MousePointerClick className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {totalSales > 0 ? '4.8%' : '0%'}
          </div>
           <div className="mt-2 text-xs text-zinc-500">
            Просмотр в покупку
          </div>
        </div>

        <div 
            onClick={() => availableBalance > 0 && setShowWithdrawModal(true)}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer transition-all hover:border-emerald-500/50"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-emerald-600/20 to-teal-600/20 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          <div>
             <h3 className="text-zinc-400 text-sm font-medium">Баланс кошелька</h3>
             <div className="text-2xl font-bold text-white mt-2">
              {availableBalance.toLocaleString('ru-RU')} ₽
            </div>
          </div>
          <button className={`mt-3 w-full py-1.5 text-xs font-medium rounded-lg transition-colors border ${availableBalance > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent' : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'}`}>
            Вывести средства
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-zinc-100">Динамика доходов</h3>
            <button onClick={fetchData} className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800">
                <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64 w-full min-h-[256px]">
            {salesChartData.length > 0 && chartsReady ? (
                <ResponsiveContainer width="100%" height={256} minWidth={0}>
                <BarChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                    dataKey="date" 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    />
                    <YAxis 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `₽${value}`}
                    />
                    <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                    cursor={{fill: '#27272a', opacity: 0.4}}
                    />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 text-sm border-2 border-dashed border-zinc-800 rounded-lg">
                    Нет продаж за этот период. Опубликуйте товар и поделитесь ссылкой!
                </div>
            )}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">Источники</h3>
          <div className="h-48 w-full relative min-h-[192px]">
            {chartsReady && (
              <ResponsiveContainer width="100%" height={192} minWidth={0}>
              <PieChart>
                <Pie
                  data={TRAFFIC_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {TRAFFIC_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                   itemStyle={{ color: '#e4e4e7' }}
                />
              </PieChart>
            </ResponsiveContainer>
            )}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                   <div className="text-2xl font-bold text-white">1000+</div>
                   <div className="text-xs text-zinc-500">Визитов</div>
                </div>
             </div>
          </div>
          <div className="space-y-3 mt-4">
             {TRAFFIC_DATA.map((item) => (
               <div key={item.name} className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-zinc-400">{item.name}</span>
                 </div>
                 <span className="text-zinc-200 font-medium">{Math.round(item.value / 10)}%</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Products List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-zinc-100">Ваши продукты</h3>
          <button 
            onClick={onCreateClick}
            className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Новый продукт
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map(product => (
            <div 
              key={product.id} 
              onClick={() => onProductClick(product)}
              className={`group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all cursor-pointer flex flex-col gap-4 relative ${product.status === 'draft' ? 'opacity-75' : ''}`}
            >
              <div className="relative h-48 w-full bg-zinc-800 rounded-lg overflow-hidden">
                {product.coverImage && product.coverImage.trim() !== '' ? (
                  <Image 
                    src={product.coverImage} 
                    alt={product.title} 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized={product.coverImage.startsWith('data:')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <span>Нет изображения</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white border border-white/10">
                  {product.priceRub} ₽
                </div>
                <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider border backdrop-blur-sm ${product.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-zinc-900/80 text-zinc-400 border-zinc-700'}`}>
                        {product.status === 'published' ? 'Опубликован' : 'Черновик'}
                    </span>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{CATEGORY_LABELS[product.category]}</span>
                  <span className="text-xs text-zinc-500">{product.sales} продаж</span>
                </div>
                <h4 className="font-medium text-zinc-100 mt-1 group-hover:text-violet-400 transition-colors">{product.title}</h4>
                <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{product.description}</p>
              </div>

              <div className="border-t border-zinc-800 pt-3 flex items-center justify-between mt-auto z-10">
                 <button 
                    onClick={(e) => handleShare(e, product)}
                    className={`flex items-center gap-1 text-xs transition-colors p-2 rounded ${product.status === 'draft' ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    disabled={product.status === 'draft'}
                 >
                    {product.status === 'draft' ? <EyeOff className="w-3 h-3"/> : <Copy className="w-3 h-3" />}
                    {product.status === 'draft' ? 'Скрыт' : 'Копия'}
                 </button>

                 <div className="flex items-center gap-1">
                     <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditClick(product);
                        }}
                        className="text-zinc-500 hover:text-white p-2 hover:bg-zinc-800 rounded transition-colors"
                     >
                         <Pencil className="w-3 h-3" />
                     </button>
                     <button 
                         onClick={(e) => handleDelete(e, product.id)}
                         className="text-zinc-500 hover:text-red-400 p-2 hover:bg-zinc-800 rounded transition-colors"
                     >
                         <Trash2 className="w-3 h-3" />
                     </button>
                 </div>
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
              <div className="col-span-full border-2 border-dashed border-zinc-800 rounded-xl p-12 text-center">
                  <Package className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zinc-300">У вас пока нет товаров</h3>
                  <p className="text-zinc-500 mb-6">Создайте первый цифровой продукт, чтобы начать зарабатывать</p>
                  <button 
                    onClick={onCreateClick}
                    className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Создать продукт
                  </button>
              </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)}></div>
              <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-fade-in">
                  <h3 className="text-xl font-bold text-white mb-2">Вывод средств</h3>
                  <p className="text-sm text-zinc-400 mb-6">Доступно: <span className="text-emerald-400 font-bold">{availableBalance} ₽</span></p>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">Сумма вывода</label>
                          <input 
                              type="number" 
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              placeholder="0"
                              max={availableBalance}
                              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                          />
                      </div>
                      <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-800 flex items-center gap-3">
                          <Wallet className="w-5 h-5 text-zinc-400" />
                          <div className="flex-1">
                              <p className="text-sm text-zinc-200">Карта **** 4582</p>
                              <p className="text-xs text-zinc-500">Сбербанк</p>
                          </div>
                          <span className="text-xs text-zinc-500">Изменить</span>
                      </div>
                      <div className="bg-yellow-900/10 border border-yellow-900/30 p-3 rounded-lg flex gap-3 items-start">
                          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                          <p className="text-xs text-yellow-600/80">Средства поступят на счет в течение 1-3 рабочих дней (обычно моментально).</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                          <button 
                              onClick={() => setShowWithdrawModal(false)}
                              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors"
                          >
                              Отмена
                          </button>
                          <button 
                              onClick={handleWithdraw}
                              disabled={isWithdrawing}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                              {isWithdrawing ? 'Обработка...' : 'Подтвердить'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
