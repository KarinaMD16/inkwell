import { api, ApiError } from "./api";

/** Marca que deja el editor al guardar; el perfil la lee para mostrar "Cambios guardados". */
export const SAVED_FLAG = "inkwell:perfil-guardado";

/** Etiqueta de caché del perfil público: al guardar cambios se vence para que todos vean lo nuevo. */
export const profileTag = (handle: string) => `perfil:${handle}`;

/** Lo que cualquiera ve en un perfil. */
export interface PublicProfile {
  handle: string;
  name: string;
  bio: string;
  link: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
}

/** Tu propio perfil: lo público más el correo de tu cuenta y tu fecha de nacimiento. */
export interface Profile extends PublicProfile {
  id: string;
  email: string | null;
  birthdate: string | null;
}

export type ImageKind = "avatar" | "banner";
/** Igual que en la API: se rechaza antes de subir para no gastar datos. */
export const MAX_IMAGE_MB = 8;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif"];
export const IMAGE_ACCEPT = ACCEPT.join(",");

/** Revisa la imagen elegida antes de subirla. Devuelve el problema en palabras o null. */
export function checkImage(file: File): string | null {
  if (file.type && !ACCEPT.includes(file.type)) return "Usa una imagen JPG, PNG, WebP, GIF o AVIF.";
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `La imagen pesa demasiado: el máximo es ${MAX_IMAGE_MB} MB.`;
  return null;
}

/** Sube la foto de perfil o la portada. La API la recorta, la comprime y le quita los metadatos. */
export async function uploadImage(kind: ImageKind, file: File, token: string): Promise<Profile> {
  const body = new FormData();
  body.append("file", file);
  try {
    return await api<Profile>(`/me/${kind}`, { method: "PUT", token, body });
  } catch (err) {
    if (err instanceof ApiError && err.status === 503) throw new Error("La subida de imágenes todavía no está configurada en el servidor.");
    throw err;
  }
}

export function removeImage(kind: ImageKind, token: string): Promise<Profile> {
  return api<Profile>(`/me/${kind}`, { method: "DELETE", token });
}

/** "https://www.instagram.com/ana/" → "instagram.com/ana": más corto para mostrar. */
export function prettyLink(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    return `${u.hostname.replace(/^www\./, "")}${path}${u.search}`;
  } catch {
    return url;
  }
}

/** "noviembre de 2026" */
export function joinedOn(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("es", { month: "long", year: "numeric" });
}
