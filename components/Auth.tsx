/**
 * @fileoverview Cifra Platform — Initiative Development / Инициативная разработка
 * @author Artyom Pryanishnikov <Pryanishnikovartem@gmail.com>
 * @copyright 2025 Artyom Pryanishnikov
 * @license PolyForm-Shield-1.0.0
 * 
 * INITIATIVE DEVELOPMENT: Created independently, without TZ or direct order.
 * IP rights remain with the Author. Commercial use requires agreement.
 * Contact: Pryanishnikovartem@gmail.com
 */

'use client';

import { AlertCircle, Lock, LogIn, Mail, User, UserPlus } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthProps {
	onSuccess?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
	const [isLogin, setIsLogin] = useState(true);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [passwordConfirm, setPasswordConfirm] = useState('');
	const [displayName, setDisplayName] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const { login, register } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			let result;
			if (isLogin) {
				result = await login(email, password);
			} else {
				if (password !== passwordConfirm) {
					setError('Пароли не совпадают');
					setLoading(false);
					return;
				}
				if (password.length < 8) {
					setError('Пароль должен быть не менее 8 символов');
					setLoading(false);
					return;
				}
				result = await register(email, password, passwordConfirm, displayName || undefined);
			}

			if (result.success) {
				onSuccess?.();
			} else {
				setError(result.error || 'Произошла ошибка');
			}
		} catch (_err) {
			setError('Произошла непредвиденная ошибка');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
					{/* Logo */}
					<div className="flex items-center justify-center gap-3 mb-8">
						<div className="w-12 h-12 bg-linear-to-tr from-violet-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
							C
						</div>
						<span className="text-2xl font-bold text-white">Cifra</span>
					</div>

					{/* Tabs */}
					<div className="flex gap-2 mb-6 bg-zinc-800 p-1 rounded-lg">
						<button
							onClick={() => {
								setIsLogin(true);
								setError('');
							}}
							className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
								isLogin
									? 'bg-violet-600 text-white'
									: 'text-zinc-400 hover:text-white'
							}`}
						>
							<LogIn className="w-4 h-4 inline mr-2" />
							Вход
						</button>
						<button
							onClick={() => {
								setIsLogin(false);
								setError('');
							}}
							className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
								!isLogin
									? 'bg-violet-600 text-white'
									: 'text-zinc-400 hover:text-white'
							}`}
						>
							<UserPlus className="w-4 h-4 inline mr-2" />
							Регистрация
						</button>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
								<AlertCircle className="w-4 h-4 shrink-0" />
								<span>{error}</span>
							</div>
						)}

						{!isLogin && (
							<div>
								<label className="block text-sm font-medium text-zinc-400 mb-1.5">
									Имя
								</label>
								<div className="relative">
									<User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
									<input
										type="text"
										value={displayName}
										onChange={(e) => setDisplayName(e.target.value)}
										placeholder="Ваше имя"
										className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
									/>
								</div>
							</div>
						)}

						<div>
							<label className="block text-sm font-medium text-zinc-400 mb-1.5">
								Email
							</label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com"
									required
									className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-zinc-400 mb-1.5">
								Пароль
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
								<input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									required
									minLength={8}
									className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
								/>
							</div>
						</div>

						{!isLogin && (
							<div>
								<label className="block text-sm font-medium text-zinc-400 mb-1.5">
									Подтвердите пароль
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
									<input
										type="password"
										value={passwordConfirm}
										onChange={(e) => setPasswordConfirm(e.target.value)}
										placeholder="••••••••"
										required
										minLength={8}
										className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
									/>
								</div>
							</div>
						)}

						<button
							type="submit"
							disabled={loading}
							className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{loading ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									{isLogin ? 'Вход...' : 'Регистрация...'}
								</>
							) : (
								<>
									{isLogin ? (
										<LogIn className="w-4 h-4" />
									) : (
										<UserPlus className="w-4 h-4" />
									)}
									{isLogin ? 'Войти' : 'Зарегистрироваться'}
								</>
							)}
						</button>
					</form>

					<p className="mt-6 text-center text-xs text-zinc-500">
						{isLogin ? (
							<>
								Нет аккаунта?{' '}
								<button
									onClick={() => setIsLogin(false)}
									className="text-violet-400 hover:text-violet-300 font-medium"
								>
									Зарегистрироваться
								</button>
							</>
						) : (
							<>
								Уже есть аккаунт?{' '}
								<button
									onClick={() => setIsLogin(true)}
									className="text-violet-400 hover:text-violet-300 font-medium"
								>
									Войти
								</button>
							</>
						)}
					</p>
				</div>
			</div>
		</div>
	);
};

export default Auth;
