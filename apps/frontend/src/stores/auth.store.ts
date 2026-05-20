import { create } from 'zustand';
import { api } from '@/lib/api';

interface Usuario {
  id: string;
  email: string;
  rol: 'ADMIN' | 'PROFESOR';
  profesorId: string | null;
  nombre: string | null;
  apellido: string | null;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  usuario: Usuario | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<boolean>;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  usuario: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      set({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        usuario: data.usuario,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error al iniciar sesión',
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('usuario');
    set({ token: null, refreshToken: null, usuario: null });
  },

  refresh: async () => {
    const currentRefresh = get().refreshToken;
    if (!currentRefresh) return false;

    try {
      const data = await api<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken: currentRefresh }),
        },
      );

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      set({ token: data.accessToken, refreshToken: data.refreshToken });
      return true;
    } catch {
      get().logout();
      return false;
    }
  },

  hydrate: () => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const usuarioStr = localStorage.getItem('usuario');

    if (token && usuarioStr) {
      set({
        token,
        refreshToken,
        usuario: JSON.parse(usuarioStr),
      });
    }
  },
}));
