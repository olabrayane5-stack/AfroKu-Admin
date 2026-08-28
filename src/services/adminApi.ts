import { API_BASE_URL } from "../config";
import { getStoredAdminSession } from "./adminAuth";

export interface PartnerApplication {
  id: string;
  userId: string;
  email: string;
  type: "guide" | "artisan";
  details: Record<string, any>;
  status: "pending" | "approved" | "rejected";
  adminNotes: string;
  submittedAt: string;
  reviewedAt: string | null;
}

function authHeaders(): HeadersInit {
  const session = getStoredAdminSession();
  if (!session) throw new Error("Session administrateur manquante. Reconnectez-vous.");
  return {
    Authorization: `Bearer ${session.token}`,
    "Content-Type": "application/json",
  };
}

async function parseOrThrow(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Erreur serveur.");
  }
  return data;
}

/**
 * Liste les candidatures, éventuellement filtrées par statut
 * ("pending" | "approved" | "rejected"). Réutilise la route déjà testée
 * ensemble via la Console : GET /api/admin/applications.
 */
export async function fetchApplications(status?: string): Promise<PartnerApplication[]> {
  const url = new URL(`${API_BASE_URL}/api/admin/applications`);
  if (status) url.searchParams.set("status", status);
  const response = await fetch(url.toString(), { headers: authHeaders() });
  const data = await parseOrThrow(response);
  return data.applications;
}

/**
 * Approuve une candidature. "edits" permet de corriger des informations
 * avant validation (ex: reformuler la bio) — envoyé vide si rien à changer.
 */
export async function approveApplication(id: string, edits?: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/api/admin/applications/${id}/approve`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ edits: edits || {} }),
  });
  return parseOrThrow(response);
}

/** Refuse une candidature — un motif est obligatoire côté serveur. */
export async function rejectApplication(id: string, reason: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/applications/${id}/reject`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  return parseOrThrow(response);
}
