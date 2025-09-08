import Keycloak from "keycloak-js";

const KC_URL    = import.meta.env.VITE_KEYCLOAK_URL   || "https://auth-ckrikas.duckdns.org/auth";
const KC_REALM  = import.meta.env.VITE_KEYCLOAK_REALM || "stratologia";
const KC_CLIENT = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "citizen-portal";
const API_BASE  = import.meta.env.VITE_API_BASE || "https://api-ckrikas.duckdns.org";

export const keycloak = new Keycloak({ url: KC_URL, realm: KC_REALM, clientId: KC_CLIENT });

export async function initAuth() {
  const authenticated = await keycloak.init({
    onLoad: "check-sso",        // citizen portal: don't force login
    pkceMethod: "S256",
    checkLoginIframe: false,
    silentCheckSsoFallback: false,
    enableLogging: true,
  });

  keycloak.onTokenExpired = () =>
    keycloak.updateToken(30).catch(() => keycloak.login());

  return authenticated;
}

export const login  = (opts = {}) => keycloak.login({  redirectUri: opts.redirectUri || window.location.href });
export const logout = (opts = {}) => keycloak.logout({ redirectUri: opts.redirectUri || window.location.origin });
export const token  = () => keycloak.token;
export const hasRole = (r) => (keycloak?.tokenParsed?.realm_access?.roles || []).includes(r);

export async function authedFetch(path, opts = {}) {
  if (keycloak.authenticated) {
    try { await keycloak.updateToken(30); } catch { await login(); }
  }
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = { ...(opts.headers || {}) };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;

  const res = await fetch(url, { ...opts, headers });
  if (res.status === 401) { await login(); throw new Error("401 Unauthorized"); }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}
