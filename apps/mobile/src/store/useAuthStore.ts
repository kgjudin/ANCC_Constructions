import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { mobileApi } from '../config/api';
import { Employee, Role } from '@construction/shared-types';

interface MobileAuthState {
  token: string | null;
  user: any | null;
  employee: Employee | null;
  role: Role | null;
  permissions: string[];
  isLoading: boolean;
  login: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useMobileAuthStore = create<MobileAuthState>((set, get) => ({
  token: null,
  user: null,
  employee: null,
  role: null,
  permissions: [],
  isLoading: true,

  login: async (token, user) => {
    await SecureStore.setItemAsync('auth_token', token);
    set({ token, user });
    await get().checkSession();
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ token: null, user: null, employee: null, role: null, permissions: [], isLoading: false });
  },

  checkSession: async () => {
    try {
      set({ isLoading: true });
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        set({ isLoading: false, token: null });
        return;
      }

      const res: any = await mobileApi.get('/auth/me');
      set({
        token,
        user: res.data.user,
        employee: res.data.employee,
        role: res.data.role,
        permissions: (res.data.permissions || []).map((p: any) => typeof p === 'string' ? p : p.key),
        isLoading: false
      });
    } catch (e) {
      await SecureStore.deleteItemAsync('auth_token');
      set({ token: null, user: null, employee: null, role: null, permissions: [], isLoading: false });
    }
  }
}));
