import { create } from 'zustand';
import api from '../services/api';
import { Employee, Role } from '@construction/shared-types';

interface AuthState {
  token: string | null;
  user: { id: string; email: string; company_id: string } | null;
  employee: Employee | null;
  role: Role | null;
  permissions: string[];
  isLoading: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  hasPermission: (permissionKey: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('auth_token'),
  user: null,
  employee: null,
  role: null,
  permissions: [],
  isLoading: !!localStorage.getItem('auth_token'),

  login: (token, user) => {
    localStorage.setItem('auth_token', token);
    set({ token, user, isLoading: false });
    get().fetchMe();
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ token: null, user: null, employee: null, role: null, permissions: [], isLoading: false });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const res: any = await api.get('/auth/me');
      set({
        token,
        user: res.data?.user || get().user,
        employee: res.data?.employee || null,
        role: res.data?.role || null,
        permissions: (res.data?.permissions || []).map((p: any) => (typeof p === 'string' ? p : p.key)),
        isLoading: false
      });
    } catch (error) {
      console.warn('fetchMe fallback notice:', error);
      set({ isLoading: false });
    }
  },

  hasPermission: (permissionKey: string) => {
    const state = get();
    if (!state.token) return false;
    // Super Admin has unrestricted full access across all permissions
    if (state.role?.name === 'Super Admin' || state.employee?.role_name === 'Super Admin') return true;
    // Role-Based Access Control: Check assigned permission keys
    return state.permissions.includes(permissionKey);
  }
}));
