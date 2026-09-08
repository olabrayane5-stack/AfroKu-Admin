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

export interface ActivePartner {
  userId: string;
  type: "guide" | "artisan";
  email: string;
  applicationId: string | null;
  details: Record<string, any>;
  productCount: number;
}

/**
 * Liste les comptes Guide/Artisan déjà vérifiés (donc déjà visibles sur le
 * site public) — distinct des candidatures en attente.
 */
export async function fetchActivePartners(): Promise<ActivePartner[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/partners`, { headers: authHeaders() });
  const data = await parseOrThrow(response);
  return data.partners;
}

/** Modifie les informations publiques d'un partenaire déjà validé. */
export async function updatePartner(userId: string, details: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/api/admin/partners/${userId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ details }),
  });
  return parseOrThrow(response);
}

/**
 * Supprime intégralement le statut de partenaire : le compte redevient
 * Voyageur, toutes les infos Guide/Artisan (+ produits si Artisan) sont
 * effacées.
 */
export async function deletePartner(userId: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/partners/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return parseOrThrow(response);
}

export interface RevenueData {
  totals: {
    totalGMV: number;
    totalCommission: number;
    totalNetToPartners: number;
    confirmedCount: number;
    pendingCount: number;
    totalReservationsCount: number;
  };
  byCategory: Record<string, { count: number; gmv: number; commission: number }>;
  monthlyTrend: { month: string; gmv: number; commission: number }[];
  topPartners: { name: string; commission: number; gmv: number; count: number }[];
}

/**
 * Tableau de bord financier de la plateforme : commission de 20% réellement
 * perçue par AfroKu sur toutes les réservations confirmées, tous
 * prestataires confondus.
 */
export async function fetchRevenue(): Promise<RevenueData> {
  const response = await fetch(`${API_BASE_URL}/api/admin/revenue`, { headers: authHeaders() });
  return parseOrThrow(response);
}
