import { apiClient } from "../api/client";
import type { UserProfile } from "./types";

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
}): Promise<void> {
  await apiClient.post("/accounts/me/operator-mode", input);
}

export async function switchMode(mode: "TURISTA" | "OPERADOR"): Promise<void> {
  await apiClient.put("/accounts/me/mode", { mode });
}

export async function uploadContentImage(file: File, folder: "attractions" | "commerces" | "services" | "events"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<{ url: string }>("/storage/upload", formData, {
    params: { folder },
  });
  return response.data.url;
}
