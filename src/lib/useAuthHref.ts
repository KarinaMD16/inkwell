"use client";

import { usePathname } from "next/navigation";
import { authHref } from "./next";

/** Enlaces a /entrar y /registro que devuelven a la página actual después de entrar. */
export function useAuthHref(): { entrar: string; registro: string } {
  const path = usePathname();
  return { entrar: authHref("/entrar", path), registro: authHref("/registro", path) };
}
