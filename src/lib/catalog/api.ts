import { apiClient } from "../api/client";

export type Category = {
  id: number;
  name: string;
  description?: string;
  status: string;
};

export type Attraction = {
  id: number;
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  status: string;
  capacity?: number;
  currentOccupancy?: number;
  occupancyLevel: "LOW" | "MEDIUM" | "HIGH";
  categoryNames: string[];
};

export async function getPublicCategories(): Promise<Category[]> {
  const response = await apiClient.get<Category[]>("/categories/public");
  return response.data;
}

export async function getPublicAttractions(params?: {
  name?: string;
  categoryId?: number;
}): Promise<Attraction[]> {
  const response = await apiClient.get<Attraction[]>("/attractions/public", { params });
  return response.data;
}
