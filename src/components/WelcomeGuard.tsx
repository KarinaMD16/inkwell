"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isNewAccount, signedInWithProvider } from "@/lib/newAccount";
import { useSession } from "./SessionProvider";

/**
 * El onboarding es solo para cuentas nuevas. Si alguien con cuenta de Google ya existente
 * llega aquí (por ejemplo, tocó "Crear cuenta" y eligió una cuenta que ya tenía), sigue al inicio.
 * Quien se registró con correo llega desde el enlace de confirmación y sí hace el onboarding.
 */
export function WelcomeGuard() {
  const router = useRouter();
  const { ready, session } = useSession();
  useEffect(() => {
    const user = session?.user;
    if (ready && signedInWithProvider(user) && !isNewAccount(user)) router.replace("/");
  }, [ready, session, router]);
  return null;
}
