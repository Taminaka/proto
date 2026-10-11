import { apiClient } from "../api/client";
import type { AuthSession, UserProfile } from "./types";

export async function getMyProfile(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>("/accounts/me");
  return response.data;
}

export async function updateMyProfile(input: {
  fullName: string;
  phone: string;
  address: string;
  avatarUrl?: string;
}): Promise<UserProfile> {
  const response = await apiClient.put<UserProfile>("/accounts/me", input);
  return response.data;
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<UserProfile>("/accounts/me/avatar", formData);
  return response.data;
}

export async function enableOperatorMode(input: {
  businessName: string;
  businessNit: string;
  businessAddress: string;
  businessPhone: string;
}): Promise<AuthSession> {
  const response = await apiClient.post<AuthSession>("/accounts/me/operator-mode", input);
  return response.data;
}

export async function switchMode(mode: "TURISTA" | "OPERADOR"): Promise<AuthSession> {
  const response = await apiClient.put<AuthSession>("/accounts/me/mode", { mode });
  return response.data;
}

export async function uploadContentImage(file: File, folder: "attractions" | "commerces" | "services" | "events"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<{ url: string }>("/storage/upload", formData, {
    params: { folder },
  });
  return response.data.url;
}
