import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../types';
import * as api from '../services/api';

export const useAuth = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('auth');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse auth data from localStorage", error);
            localStorage.removeItem('auth');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (credentials: {username: string, password: string}) => {
        const userData = await api.login(credentials);
        localStorage.setItem('auth', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    const register = useCallback(async (data: any) => {
        const userData = await api.register(data);
        localStorage.setItem('auth', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error("Logout API call failed, proceeding with client-side logout.", error);
        } finally {
            localStorage.removeItem('auth');
            setUser(null);
        }
    }, []);

    return { user, login, register, logout, loading };
};
