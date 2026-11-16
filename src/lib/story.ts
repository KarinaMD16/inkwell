import { api, ApiError } from "./api";

/** Etiqueta de caché de una historia pública: al editarla o publicar se vence para que se vea lo nuevo. */
export const storyTag = (slug: string) => `historia:${slug}`;

/** Sube la portada de una historia. La API la recorta a 2:3, la comprime y le quita los metadatos. */
export async function uploadCover(slug: string, file: File, token: string): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  try {
    return (await api<{ cover: string }>(`/me/stories/${slug}/cover`, { method: "PUT", token, body })).cover;
  } catch (err) {
    if (err instanceof ApiError && err.status === 503) throw new Error("La subida de imágenes todavía no está configurada en el servidor.");
    throw err;
  }
}

/** Mensaje para mostrar cuando algo falla al hablar con la API. */
export function problem(err: unknown, doing: string): string {
  if (err instanceof ApiError) return `No se pudo ${doing}: ${err.message}`;
  if (err instanceof Error && err.message && !(err instanceof TypeError)) return `No se pudo ${doing}: ${err.message}`;
  return `No se pudo ${doing}: no hay conexión con la API.`;
}
