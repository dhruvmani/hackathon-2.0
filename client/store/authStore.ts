import { create } from "zustand";
import { User } from "@/types";
import { authHelpers } from "@/lib/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: (token, user) => {
    authHelpers.setToken(token);
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    authHelpers.removeToken();
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  hydrate: () => {
    const token = authHelpers.getToken();
    if (token) {
      // In a real app, we might want to fetch /me here or decode token
      // For now, we'll try to decode token payload if it contains user data
      const decoded = authHelpers.decodeToken(token);
      if (decoded) {
        set({ 
          token, 
          user: decoded.user || null, 
          isAuthenticated: true, 
          isLoading: false 
        });
        return;
      }
    }
    set({ isLoading: false });
  },
}));
