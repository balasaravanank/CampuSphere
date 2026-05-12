import { create } from 'zustand';
import api from './api';

export interface User {
  id: number;
  reg_no: string;
  name: string;
  email: string;
  role: 'student' | 'staff' | 'admin';
  department: string;
  year: number | null;
  section: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: JSON.parse(sessionStorage.getItem('user') || 'null'),
  isAuthenticated: !!sessionStorage.getItem('access_token'),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user } = res.data.data;
      sessionStorage.setItem('access_token', access_token);
      sessionStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Logout even if API call fails
    }
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      const user = res.data.data;
      sessionStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    }
  },
}));
