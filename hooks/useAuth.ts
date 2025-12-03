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

import { useEffect, useState } from 'react';
import { type PBUser, pbService } from '../services/pbService';
import { pb } from '../services/pocketbase';

export interface AuthState {
	user: PBUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

export const useAuth = () => {
	const [authState, setAuthState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
	});

	useEffect(() => {
		// Check if user is already authenticated
		const checkAuth = async () => {
			if (pbService.auth.isAuthenticated()) {
				try {
					const user = await pbService.auth.getCurrentUser();
					setAuthState({
						user,
						isAuthenticated: !!user,
						isLoading: false,
					});
				} catch (error) {
					console.error('Auth check failed:', error);
					setAuthState({
						user: null,
						isAuthenticated: false,
						isLoading: false,
					});
				}
			} else {
				setAuthState({
					user: null,
					isAuthenticated: false,
					isLoading: false,
				});
			}
		};

		checkAuth();

		// Listen for auth changes
		const unsubscribe = pb.authStore.onChange((_token, model) => {
			if (model) {
				pbService.auth
					.getCurrentUser()
					.then((user) => {
						setAuthState({
							user,
							isAuthenticated: !!user,
							isLoading: false,
						});
					})
					.catch(() => {
						setAuthState({
							user: null,
							isAuthenticated: false,
							isLoading: false,
						});
					});
			} else {
				setAuthState({
					user: null,
					isAuthenticated: false,
					isLoading: false,
				});
			}
		});

		return () => {
			unsubscribe();
		};
	}, []);

	const login = async (email: string, password: string) => {
		try {
			await pbService.auth.login(email, password);
			const user = await pbService.auth.getCurrentUser();
			setAuthState({
				user,
				isAuthenticated: !!user,
				isLoading: false,
			});
			return { success: true };
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Ошибка входа';
			return { success: false, error: message };
		}
	};

	const register = async (
		email: string,
		password: string,
		passwordConfirm: string,
		displayName?: string
	) => {
		try {
			await pbService.auth.register(email, password, passwordConfirm, displayName);
			await pbService.auth.login(email, password);
			const user = await pbService.auth.getCurrentUser();
			setAuthState({
				user,
				isAuthenticated: !!user,
				isLoading: false,
			});
			return { success: true };
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Ошибка регистрации';
			return { success: false, error: message };
		}
	};

	const logout = async () => {
		await pbService.auth.logout();
		setAuthState({
			user: null,
			isAuthenticated: false,
			isLoading: false,
		});
	};

	return {
		...authState,
		login,
		register,
		logout,
	};
};
