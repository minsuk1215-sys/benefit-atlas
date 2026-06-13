const TOKEN_KEY = 'benefitatlas_admin_token';
const USER_KEY = 'benefitatlas_admin_user';

export interface AdminUser {
  username: string;
  tenantId: string;
  tenantName: string;
}

export function saveAdminAuth(token: string, user: AdminUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAdminUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAdminAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAdminLoggedIn(): boolean {
  return !!getAdminToken();
}