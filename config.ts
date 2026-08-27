/**
 * Ce site Admin n'a PAS son propre backend — il consomme les mêmes routes
 * API que le site public AfroKu.com (server.ts), déjà sécurisées par
 * requireAuth + requireAdmin. On appelle donc une URL ABSOLUE (pas relative
 * comme sur le site principal), puisque ce projet est déployé séparément.
 *
 * À changer une fois le site principal sur un domaine définitif.
 */
export const API_BASE_URL = "https://afro-ku-com.vercel.app";
