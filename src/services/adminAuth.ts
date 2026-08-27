import { API_BASE_URL } from "../config";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const TOKEN_KEY = "afroku_admin_token";
const USER_KEY = "afroku_admin_user";

async function parseOrThrow(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Une erreur est survenue.");
  }
  return data;
}

/**
 * Connexion admin. Réutilise EXACTEMENT la même route que le site public
 * (POST /api/auth/login) — mais refuse localement tout compte dont le rôle
 * n'est pas "admin", même si l'identifiant/mot de passe sont corrects.
 */
export async function adminLogin(email: string, password: string): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseOrThrow(response);

  if (data.user.role !== "admin") {
    throw new Error("Ce compte n'a pas les droits administrateur.");
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user as AdminUser;
}

export function getStoredAdminSession(): { token: string; user: AdminUser } | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    return { token, user: JSON.parse(userRaw) as AdminUser };
  } catch {
    return null;
  }
}

export function adminLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
