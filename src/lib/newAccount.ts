import type { User } from "@supabase/supabase-js";

/**
 * ¿Esta cuenta se creó con el inicio de sesión que acaba de pasar?
 * Con Google, "Crear cuenta" y "Entrar" son el mismo botón: solo después de entrar se sabe si
 * la cuenta es nueva. Una cuenta nueva se crea y abre sesión en el mismo momento; una que ya
 * existía tiene su fecha de creación muy anterior al último inicio. Las dos fechas vienen de
 * Supabase, así que el reloj de la computadora no influye.
 */
export function isNewAccount(user: User | null | undefined): boolean {
  const created = Date.parse(user?.created_at ?? "");
  const lastSignIn = Date.parse(user?.last_sign_in_at ?? "");
  return Number.isFinite(created) && Number.isFinite(lastSignIn) && lastSignIn - created < 60_000;
}

/** La cuenta entró con Google u otro proveedor externo (no con correo y contraseña). */
export function signedInWithProvider(user: User | null | undefined): boolean {
  return Boolean(user && user.app_metadata?.provider && user.app_metadata.provider !== "email");
}
