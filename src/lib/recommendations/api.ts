import { apiClient } from "../api/client";
import type { Attraction } from "../catalog/api";

export type RecommendationItem<T> = {
  item: T;
  reason: string;
  score: number;
};

export type RecommendationResponse<T> = {
  items: RecommendationItem<T>[];
};

export async function getAttractionAlternatives(
  attractionId: number,
): Promise<RecommendationResponse<Attraction>> {
  const response = await apiClient.get<RecommendationResponse<Attraction>>(
    `/recommendations/attractions/${attractionId}/alternatives`,
  );
  return response.data;
}

export async function getAttractionRecommendations(params?: {
  categoryId?: number;
  date?: string;
}): Promise<RecommendationResponse<Attraction>> {
  const response = await apiClient.get<RecommendationResponse<Attraction>>(
    "/recommendations/attractions",
    { params },
  );
  return response.data;
}
