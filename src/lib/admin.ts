import { api } from "./api";
import type { Role } from "./profile";

export interface Page<T> { items: T[]; total: number; limit: number; offset: number }

export interface AdminUser {
  id: string; handle: string; name: string; avatarUrl: string | null; role: Role;
  suspendedAt: string | null; suspendedReason: string | null; createdAt: string;
  stories: number; email: string | null; lastSignInAt: string | null;
}

export interface AdminStory {
  slug: string; title: string; author: string; authorSuspended: boolean; cover: string | null;
  color: string; ink: string; rating: string; published: boolean; removedAt: string | null; removedReason: string | null;
  reads: number; chapters: number; createdAt: string; updatedAt: string;
}

export interface AdminAction {
  id: string; actor: string; action: string; targetKind: "perfil" | "historia"; target: string;
  targetLabel: string; detail: string | null; createdAt: string;
}

export const PAGE = 20;

function query(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const adminApi = {
  users: (token: string, p: { q?: string; role?: string; estado?: string; offset?: number }) =>
    api<Page<AdminUser>>(`/admin/users${query({ ...p, limit: PAGE })}`, { token }),
  setRole: (token: string, id: string, role: Role) =>
    api<AdminUser>(`/admin/users/${id}/role`, { method: "PATCH", token, body: JSON.stringify({ role }) }),
  suspend: (token: string, id: string, reason: string) =>
    api<AdminUser>(`/admin/users/${id}/suspend`, { method: "POST", token, body: JSON.stringify({ reason }) }),
  unsuspend: (token: string, id: string) => api<AdminUser>(`/admin/users/${id}/unsuspend`, { method: "POST", token }),
  deleteUser: (token: string, id: string) => api<void>(`/admin/users/${id}`, { method: "DELETE", token }),
  stories: (token: string, p: { q?: string; estado?: string; offset?: number }) =>
    api<Page<AdminStory>>(`/admin/stories${query({ ...p, limit: PAGE })}`, { token }),
  removeStory: (token: string, slug: string, reason: string) =>
    api<{ removedAt: string }>(`/admin/stories/${encodeURIComponent(slug)}/remove`, { method: "POST", token, body: JSON.stringify({ reason }) }),
  restoreStory: (token: string, slug: string) =>
    api<{ removedAt: null }>(`/admin/stories/${encodeURIComponent(slug)}/restore`, { method: "POST", token }),
  actions: (token: string) => api<AdminAction[]>("/admin/actions?limit=50", { token }),
};

/** Lo que se lee en el registro: "@carla suspendió a @ana". */
export const ACTION_VERB: Record<string, string> = {
  rol: "cambió el rol de",
  suspender: "suspendió a",
  reactivar: "reactivó a",
  "borrar cuenta": "borró la cuenta de",
  retirar: "retiró",
  restaurar: "restauró",
};

/** "hace 3 días", "hoy", "nunca". */
export function agoLabel(iso: string | null): string {
  if (!iso) return "nunca";
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  if (days < 365) return `hace ${Math.round(days / 30)} ${Math.round(days / 30) === 1 ? "mes" : "meses"}`;
  return `hace ${Math.round(days / 365)} ${Math.round(days / 365) === 1 ? "año" : "años"}`;
}
