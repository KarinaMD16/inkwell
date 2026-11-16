"use client";

import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import type { Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

export type { Profile };

interface SessionCtx {
  /** false mientras se lee la sesión guardada en el navegador. */
  ready: boolean;
  session: Session | null;
  token: string | null;
  profile: Profile | null;
  /** Por qué no se pudo cargar el perfil (null mientras carga o si cargó bien). */
  profileError: string | null;
  /** Vuelve a pedir el perfil a la API. */
  reloadProfile: () => void;
  /** true cuando la persona llegó desde el enlace de "recuperar contraseña". */
  recovering: boolean;
  setProfile: (p: Profile) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionCtx | null>(null);

/**
 * Trae el perfil de la API (lo crea la primera vez). Lo que la persona escribió al registrarse
 * (nombre de usuario y fecha de nacimiento) viaja en los metadatos de Supabase y se pasa al
 * perfil aquí, una sola vez.
 */
async function loadProfile(session: Session): Promise<Profile> {
  const token = session.access_token;
  let profile = await api<Profile>("/me", { token });
  const wanted = session.user.user_metadata?.handle as string | undefined;
  if (wanted) {
    if (wanted !== profile.handle) {
      try {
        profile = await api<Profile>("/me", { method: "PATCH", token, body: JSON.stringify({ handle: wanted, name: wanted }) });
      } catch { /* nombre ocupado: se queda el generado y se puede cambiar después */ }
    }
    await supabase().auth.updateUser({ data: { handle: null } });
  }
  const birthdate = session.user.user_metadata?.birthdate as string | undefined;
  if (birthdate) {
    if (!profile.birthdate) {
      try {
        profile = await api<Profile>("/me", { method: "PATCH", token, body: JSON.stringify({ birthdate }) });
      } catch { /* fecha rechazada: se puede completar en Ajustes */ }
    }
    await supabase().auth.updateUser({ data: { birthdate: null } });
  }
  return profile;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = sb.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setReady(true);
      if (event === "PASSWORD_RECOVERY") {
        setRecovering(true);
        if (location.pathname !== "/recuperar") router.push("/recuperar");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  // El perfil depende de quién entró, no del token: renovar el token no lo vuelve a pedir.
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!session) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- se limpia el error del intento anterior
    setProfileError(null);
    loadProfile(session)
      .then((p) => { if (alive) setProfile(p); })
      .catch((err: unknown) => {
        if (!alive) return;
        // El detalle queda en la consola para quien programa; la persona ve un mensaje claro.
        console.error("No se pudo cargar el perfil desde la API:", err);
        setProfileError(
          err instanceof ApiError
            ? `La API respondió con un error (${err.status}) al cargar tu perfil.`
            : "No hay conexión con la API de Inkwell.",
        );
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se recarga al cambiar de persona o al reintentar
  }, [userId, attempt]);

  const reloadProfile = useCallback(() => setAttempt((n) => n + 1), []);

  const signOut = useCallback(async () => {
    await supabase().auth.signOut();
    setProfile(null);
    setRecovering(false);
    router.push("/");
  }, [router]);

  const value: SessionCtx = {
    ready,
    session,
    token: session?.access_token ?? null,
    profile: session && profile?.id === session.user.id ? profile : null,
    profileError: session ? profileError : null,
    reloadProfile,
    recovering,
    setProfile,
    signOut,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession va dentro de <SessionProvider>");
  return ctx;
}
