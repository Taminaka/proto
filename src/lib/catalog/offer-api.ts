import { apiClient } from "../api/client";

export type OfferType = "attractions" | "commerces" | "services" | "events";

export type Offer = {
  id: number;
  name: string;
  description?: string;
  address?: string;
  location?: string;
  images?: string[];
  status?: string;
  occupancyLevel?: "LOW" | "MEDIUM" | "HIGH";
  currentOccupancy?: number;
  capacity?: number;
  categoryNames?: string[];
  price?: number;
  durationMinutes?: number;
  commerceId?: number;
  commerceName?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
};

const paths: Record<OfferType, string> = {
  attractions: "/attractions/public",
  commerces: "/commerces/public",
  services: "/services/public",
  events: "/events/public",
};

export async function listOffers(type: OfferType, params?: Record<string, string | number>) {
  const response = await apiClient.get<Offer[]>(paths[type], { params });
  return response.data;
}

export async function getOffer(type: OfferType, id: number) {
  const response = await apiClient.get<Offer>(`${paths[type]}/${id}`);
  return response.data;
}

export async function getRecommendations() {
  const response = await apiClient.get<{ items: { item: Offer; reason: string; score: number }[] }>(
    "/recommendations/attractions",
  );
  return response.data;
}
