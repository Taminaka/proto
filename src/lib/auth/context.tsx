"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest, logout as logoutRequest } from "./api";
import { clearSession, getStoredSession, saveSession } from "./storage";
import type { AuthSession, LoginRequest } from "./types";

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<AuthSession>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(getStoredSession());
    setIsLoading(false);

    const syncSession = () => setSession(getStoredSession());
    window.addEventListener("tamaka:auth-changed", syncSession);
    return () => window.removeEventListener("tamaka:auth-changed", syncSession);
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    const nextSession = await loginRequest(request);
    saveSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
      setSession(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      isAuthenticated: Boolean(session),
      login,
      logout,
    }),
    [isLoading, login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
