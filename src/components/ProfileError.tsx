"use client";

import type { ReactNode } from "react";
import { useSession } from "./SessionProvider";
import { Btn } from "./ui";

/** Mientras carga el perfil muestra `skeleton`; si falló, el motivo y un botón para reintentar. */
export function ProfileLoading({ skeleton }: { skeleton: ReactNode }) {
  const { profileError, reloadProfile } = useSession();
  if (!profileError) return <>{skeleton}</>;
  return (
    <div className="stack-sm">
      <p className="notice notice--error" role="alert">{profileError} Intenta de nuevo en un momento.</p>
      <div><Btn variant="ghost" size="sm" onClick={reloadProfile}>Reintentar</Btn></div>
    </div>
  );
}
