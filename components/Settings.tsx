'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { User, Shield, Wallet, Save, Check, Clock, ArrowUpRight, Bell, Mail, AlertCircle, Trash2 } from 'lucide-react';
import { StorageService } from '../services/storage';
import { UserSettings, Payout } from '../types';
import { pbService } from '../services/pbService';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    displayName: '',
    bio: '',
    avatarUrl: '',
    accentColor: '#8b5cf6',
    emailNotifications: true
  });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'notifications'>('profile');
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsData, payoutsData] = await Promise.all([
          pbService.settings.getSettings(),
          pbService.payouts.getPayouts()
        ]);
        setSettings(settingsData);
        setPayouts(payoutsData);
      } catch (error) {
        // Fallback to localStorage
        setSettings(StorageService.getSettings());
        setPayouts(StorageService.getPayouts());
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (field: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = async () => {
    try {
      await pbService.settings.updateSettings(settings, avatarFile || undefined);
      setAvatarFile(null);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      // Fallback to localStorage
      StorageService.saveSettings(settings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleReset = () => {
      if (confirm("ВНИМАНИЕ: Это действие удалит все ваши товары, продажи и настройки. Приложение вернется к исходному состоянию. Вы уверены?")) {
          StorageService.reset();
      }
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-20">
       <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Настройки</h2>
        <p className="text-zinc-400">Управление профилем, выплатами и уведомлениями.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'profile' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
          >
            <User className="w-4 h-4" />
            Профиль
          </button>
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'wallet' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
          >
            <Wallet className="w-4 h-4" />
            Выплаты (РФ)
          </button>
           <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'notifications' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
          >
            <Bell className="w-4 h-4" />
            Уведомления
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-8">
          
          {activeTab === 'profile' && (
            <div className="space-y-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Профиль магазина</h3>
                        {isSaved && <span className="text-emerald-500 text-sm flex items-center gap-1"><Check className="w-3 h-3"/> Сохранено</span>}
                    </div>
                    
                    <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 border border-zinc-700 overflow-hidden relative">
                        {settings.avatarUrl && settings.avatarUrl.trim() !== '' ? (
                            <Image 
                              src={settings.avatarUrl} 
                              alt="Avatar" 
                              fill
                              className="object-cover"
                              unoptimized={settings.avatarUrl.startsWith('data:')}
                            />
                        ) : (
                            <span className="text-xl font-bold">{settings.displayName.charAt(0)}</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <button 
                            onClick={() => {
                                const url = prompt("Введите URL изображения для аватара:");
                                if (url) handleChange('avatarUrl', url);
                            }}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700"
                        >
                        Изменить фото
                        </button>
                        <p className="text-xs text-zinc-500">Рекомендуется 400x400px</p>
                    </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Отображаемое имя</label>
                        <input 
                        type="text" 
                        value={settings.displayName}
                        onChange={(e) => handleChange('displayName', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Bio (О себе)</label>
                        <textarea 
                        rows={3}
                        value={settings.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Акцентный цвет</label>
                        <div className="flex gap-3">
                        {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                            <button 
                            key={color}
                            onClick={() => handleChange('accentColor', color)}
                            className={`w-8 h-8 rounded-full border border-zinc-700 transition-all ${settings.accentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : ''}`}
                            style={{ backgroundColor: color }}
                            />
                        ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Сохранить изменения
                        </button>
                    </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-zinc-900 border border-red-900/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-500 flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5" />
                        Опасная зона
                    </h3>
                    <p className="text-sm text-zinc-400 mb-4">
                        Сброс приложения удалит все товары, статистику и настройки. Это действие необратимо. Используйте для перезапуска демо-режима.
                    </p>
                    <button 
                        onClick={handleReset}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Сбросить все данные (Factory Reset)
                    </button>
                </div>
            </div>
          )}

          {activeTab === 'wallet' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-500" />
                        Платежные данные
                    </h3>
                    
                    <div className="p-4 bg-emerald-900/10 border border-emerald-900/30 rounded-lg mb-6 flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                        <div>
                        <p className="text-sm text-emerald-400 font-medium">Верификация пройдена</p>
                        <p className="text-xs text-emerald-600/70 mt-1">Вы можете выводить средства на карты российских банков и через СБП без ограничений.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                            <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-zinc-800 rounded flex items-center justify-center text-[8px] text-zinc-400">MIR</div>
                            <div className="text-sm text-zinc-300">•••• 4582</div>
                            </div>
                            <span className="text-xs text-zinc-500">Основная</span>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-800">
                        <h3 className="text-lg font-semibold text-white">История выплат</h3>
                    </div>
                    {payouts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-800/50 text-xs text-zinc-400 uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Дата</th>
                                        <th className="px-6 py-4 font-medium">Сумма</th>
                                        <th className="px-6 py-4 font-medium">Метод</th>
                                        <th className="px-6 py-4 font-medium">Статус</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {payouts.map(payout => (
                                        <tr key={payout.id}>
                                            <td className="px-6 py-4 text-sm text-zinc-400 flex items-center gap-2">
                                                <Clock className="w-3 h-3" /> {payout.date}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-white font-medium">
                                                -{payout.amount} ₽
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-400">
                                                {payout.method}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                                                    Выплачено
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-zinc-500 text-sm">
                            История выплат пуста
                        </div>
                    )}
                </div>
              </div>
          )}

          {activeTab === 'notifications' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-fade-in">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-violet-500" />
                      Настройки уведомлений
                  </h3>
                  
                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                  <Mail className="w-5 h-5" />
                              </div>
                              <div>
                                  <p className="text-sm font-medium text-white">Email уведомления о продажах</p>
                                  <p className="text-xs text-zinc-500">Получать письма при каждой новой покупке</p>
                              </div>
                          </div>
                          <button 
                            onClick={() => {
                                handleChange('emailNotifications', !settings.emailNotifications);
                                handleSave();
                            }}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.emailNotifications ? 'bg-violet-600' : 'bg-zinc-700'}`}
                          >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.emailNotifications ? 'left-7' : 'left-1'}`}></div>
                          </button>
                      </div>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
