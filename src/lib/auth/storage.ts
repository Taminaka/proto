import type { AuthSession } from "./types";

const SESSION_KEY = "tamaka.auth.session";

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("tamaka:auth-changed"));
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("tamaka:auth-changed"));
}
