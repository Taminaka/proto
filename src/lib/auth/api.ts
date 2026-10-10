import { apiClient } from "../api/client";
import type { AuthSession, LoginRequest, RegisterRequest } from "./types";

export async function login(request: LoginRequest): Promise<AuthSession> {
  const response = await apiClient.post<AuthSession>("/auth/login", request);
  return response.data;
}

export async function register(request: RegisterRequest): Promise<void> {
  await apiClient.post("/auth/register", request);
}

export async function verifyAccount(token: string): Promise<void> {
  await apiClient.post("/auth/verify", { token });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post("/auth/reset-password", { token, newPassword });
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}
