import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  name: string;
  role: "ADMIN" | "STAFF";
  language: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "entron-auth",
      partialize: (state) => ({ user: state.user }),
      skipHydration: true,
    }
  )
);
