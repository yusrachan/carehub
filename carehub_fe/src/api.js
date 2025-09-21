/**
 * Fichier api.js
 *
 * Ce fichier centralise toutes les interactions avec l'API backend.
 * Il fournit :
 *  - Une instance Axios préconfigurée avec l'URL de base.
 *  - La gestion automatique des tokens JWT (access & refresh) avec rafraîchissement.
 *  - La gestion de la redirection vers le paywall si le serveur renvoie un statut 402.
 *  - Des fonctions utilitaires pour :
 *      - activer/désactiver des utilisateurs
 *      - gérer les rôles (grant/revoke)
 *      - archiver ou désarchiver un cabinet
 *
 * Toute requête HTTP dans l'application devrait passer par cette instance `api` pour bénéficier
 * de la gestion automatique des headers et des erreurs globales.
 */


import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

// Création d'une instance Axios avec l'URL de base
export const api = axios.create({ baseURL: API_BASE });

let isRefreshing = false; // Indique si un refresh token est en cours
let subscribers = []; // Liste des callbacks à appeler une fois le token rafraîchi

/**
 * Appelle tous les callbacks enregistrés après rafraîchissement du token
 * @param {string} newToken - Nouveau token d'accès
 */
function onRefreshed(newToken) {
  subscribers.forEach((cb) => cb(newToken));
  subscribers = [];
}

/**
 * Ajoute un callback à la liste des subscribers en attente de token
 * @param {Function} cb 
 */
function addSubscriber(cb) {
  subscribers.push(cb);
}

// ---------- Intercepteur des requêtes ----------
// Ajoute automatiquement les headers Authorization et X-Office-Id si présents dans localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const officeId = localStorage.getItem("current_office_id");
  if (officeId) config.headers["X-Office-Id"] = officeId;

  return config;
});

// ---------- Intercepteur des réponses ----------
// Gère les erreurs globales, rafraîchissement de token et paywall
api.interceptors.response.use(
  (res) => res, // Si la réponse est OK, on la retourne telle quelle
  async (error) => {
    const { response, config: originalRequest } = error;

    if (!response) return Promise.reject(error); // Pas de réponse du serveur

    // Gestion du paywall (statut 402)    
    if (response.status === 402){
      const p = response.data || {}

      if (p.checkout_url) sessionStorage.setItem("paywall_checkout_url", p.checkout_url); // URL de paiement
      if (p.office_id) sessionStorage.setItem("paywall_office_id", String(p.office_id)); // ID du cabinet
      if (p.office_name) sessionStorage.setItem("paywall_office_name", p.office_name); // Nom du cabinet
      sessionStorage.setItem("paywall_reason", p.detail || "payment_required") // Raison du paywall

      // Enregistrer la page actuelle pour y revenir après paiement
      const next = window.location.pathname + window.location.search
      sessionStorage.setItem("paywall_next", next)

      if(!window.location.pathname.startsWith("/paywall")) {
        window.location.assign("/paywall")
      }
      return Promise.reject(error)
    }

    // Gestion du rafraîchissement du token (statut 401)
    if (response.status !== 401){
      return Promise.reject(error)
    }

    const isRefreshCall = originalRequest?.url?.endsWith("/auth/token/refresh/"); // Evite boucle infinie
    const refreshToken = localStorage.getItem("refresh_token"); // Token de rafraîchissement
    
    // Si on n'a pas de refresh token ou si c'est déjà un appel de refresh, on abandonne
    if (isRefreshCall || !refreshToken) {
      return Promise.reject(error);
    }

    // Evite les appels concurrents de refresh token
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Marque cette requête comme déjà tentée
    originalRequest._retry = true;

    // Si un rafraîchissement est déjà en cours, on ajoute la requête à la liste des subscribers
    if (isRefreshing) {
      return new Promise((resolve) => {
        addSubscriber((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    // Sinon, on lance le rafraîchissement du token
    isRefreshing = true;

    // Appel pour rafraîchir le token
    try {
      const { data } = await api.post("/auth/token/refresh/", { refresh: refreshToken });
      const newAccess = data.access || data.access_token;
      localStorage.setItem("access_token", newAccess);

      isRefreshing = false;
      onRefreshed(newAccess);

      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (err) {
      isRefreshing = false;
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return Promise.reject(err);
    }
  }
);

// ---------- Fonctions utilitaires pour l'administration ----------

// Désactive un utilisateur globalement (tous cabinets)
export async function deactivateUserGlobal(userId, reason = "") {
    return api.post("/users/deactivate/", { user_id: userId, reason })
}

// Réactive un utilisateur globalement (tous cabinets)
export async function reactivateUserGlobal(userId, reason = "") {
    return api.post("/users/reactivate/", { user_id: userId, reason })
}

// Désactive un utilisateur dans un cabinet spécifique
export async function deactivateUserInOffice(userId, officeId, reason = "") {
    return api.post("/users/deactivate/", { user_id: userId, office_id: officeId, reason })
}

// Réactive un utilisateur dans un cabinet spécifique
export async function reactivateUserInOffice(userId, officeId, reason = "") {
    return api.post("/users/reactivate/", { user_id: userId, office_id: officeId, reason })
}

// Révoque un rôle à un utilisateur dans un cabinet spécifique
export async function revokeRole({ userId, officeId, role, reason = "" }) {
    return api.post("/roles/revoke/", {
        user_id: userId,
        office_id: officeId,
        role,
        reason,
    })
}

// Attribue un rôle à un utilisateur dans un cabinet spécifique
export async function grantRole({ userId, officeId, role, reason = "" }) {
    return api.post("/roles/grant/", {
        user_id: userId,
        office_id: officeId,
        role,
        reason,
    })
}

// Archive un cabinet
export async function archiveOffice(officeId, reason = "") {
    return api.post(`/offices/${officeId}/archive/`, { reason })
}

// Désarchive un cabinet
export async function unarchiveOffice(officeId, reason = "") {
    return api.post(`/offices/${officeId}/unarchive/`, { reason })
}