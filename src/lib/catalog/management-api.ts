import { apiClient } from "../api/client";
import type { Category } from "./api";
import type { Offer, OfferType } from "./offer-api";

export type ManagementPayload = Record<string, unknown>;

const adminPaths: Record<OfferType, string> = {
  attractions: "/attractions/admin",
  commerces: "/commerces/admin",
  services: "/services/admin",
  events: "/events/admin",
};

export async function listManaged(type: OfferType, own = false): Promise<Offer[]> {
  const path = type === "commerces" && own ? "/commerces/mine"
    : type === "events" && own ? "/events/mine"
      : adminPaths[type];
  const response = await apiClient.get<Offer[]>(path);
  return response.data;
}

export async function listCommerceServices(commerceId: number): Promise<Offer[]> {
  const response = await apiClient.get<Offer[]>(`/commerces/${commerceId}/services`);
  return response.data;
}

export async function createManaged(type: OfferType, payload: ManagementPayload, commerceId?: number, eventMode: "destination" | "commerce" = "destination"): Promise<Offer> {
  const path = type === "attractions" ? "/attractions"
    : type === "events" ? `/events/${eventMode}`
      : type === "commerces" ? "/commerces"
        : `/commerces/${commerceId}/services`;
  const response = await apiClient.post<Offer>(path, payload);
  return response.data;
}

export async function updateManaged(type: OfferType, id: number, payload: ManagementPayload, ownerMode = false): Promise<Offer> {
  const path = type === "attractions" ? `/attractions/${id}`
    : type === "events" ? (ownerMode ? `/events/destination/${id}` : `/events/commerce/${id}`)
      : `/${type}/${id}`;
  const response = await apiClient.put<Offer>(path, payload);
  return response.data;
}

export async function deactivateManaged(type: OfferType, id: number, ownerMode = false): Promise<void> {
  const path = type === "attractions" ? `/attractions/${id}/deactivate`
    : type === "events" ? (ownerMode ? `/events/destination/${id}/deactivate` : `/events/commerce/${id}/deactivate`)
      : type === "commerces" ? `/commerces/${id}/deactivate`
        : `/services/${id}`;
  if (type === "services") await apiClient.delete(path);
  else await apiClient.put(path);
}

export async function updateStatus(type: OfferType, id: number, status: string): Promise<void> {
  const path = type === "attractions" ? `/attractions/${id}/status`
    : type === "events" ? `/events/admin/${id}/status`
      : `/${type}/admin/${id}/status`;
  await apiClient.put(path, { status });
}

export async function listCategories(includeInactive = false): Promise<Category[]> {
  const response = await apiClient.get<Category[]>(includeInactive ? "/categories" : "/categories/public");
  return response.data;
}

export async function saveCategory(id: number | null, payload: { name: string; description: string }): Promise<Category> {
  const response = id
    ? await apiClient.put<Category>(`/categories/${id}`, payload)
    : await apiClient.post<Category>("/categories", payload);
  return response.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
