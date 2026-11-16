export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Errores por campo cuando la API rechaza un formulario: { handle: "Ese nombre…" }. */
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

/**
 * Llamada a la API de Inkwell. Con `token` (el access_token de Supabase) la petición
 * va autenticada; sin él, solo sirve para las rutas públicas de lectura.
 * Un `body` de texto se envía como JSON; un FormData (para subir archivos) va tal cual.
 */
export async function api<T>(path: string, init: RequestInit & { token?: string | null } = {}): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(typeof rest.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    let message = res.statusText;
    const fields: Record<string, string> = {};
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(", ") : (body.message ?? message);
      for (const e of body.errors ?? []) if (e?.campo && !fields[e.campo]) fields[e.campo] = e.error;
    } catch { /* respuesta sin JSON */ }
    throw new ApiError(res.status, message, fields);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
