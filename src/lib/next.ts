/**
 * "next" es la página a la que se vuelve después de entrar. Solo se aceptan rutas internas:
 * así un enlace armado por otra persona no puede mandar a nadie a un sitio ajeno.
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
  if (/^\/(entrar|registro|recuperar)(\/|\?|$)/.test(raw)) return null;
  return raw;
}

/** Enlace a /entrar o /registro que recuerda de dónde venía la persona. */
export function authHref(page: "/entrar" | "/registro", next: string | null | undefined): string {
  const safe = safeNext(next);
  return safe && safe !== "/" ? `${page}?next=${encodeURIComponent(safe)}` : page;
}
