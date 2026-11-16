"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { api, ApiError } from "./api";
import { toManaged, type ApiManagedStory, type ManagedStory } from "./data";

/**
 * Una historia propia con todos sus capítulos, borradores incluidos. Se pide desde el navegador
 * con la sesión, porque solo la puede ver quien la escribe.
 * `error`: "missing" si no existe o es de otra persona; "api" si la API no respondió.
 */
export function useManagedStory(slug: string) {
  const { ready, token, session } = useSession();
  const userId = session?.user.id ?? null;
  const key = `${userId}:${slug}`;
  const [state, setState] = useState<{ for: string; story: ManagedStory | null; error: "missing" | "api" | null } | null>(null);

  const load = useCallback(async (auth: string) => {
    try {
      const story = toManaged(await api<ApiManagedStory>(`/me/stories/${encodeURIComponent(slug)}`, { token: auth }));
      return { for: key, story, error: null };
    } catch (e) {
      return { for: key, story: null, error: e instanceof ApiError && (e.status === 403 || e.status === 404) ? ("missing" as const) : ("api" as const) };
    }
  }, [key, slug]);

  useEffect(() => {
    if (!token || !userId) return;
    let alive = true;
    void load(token).then((next) => { if (alive) setState(next); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se recarga al cambiar de persona o de historia, no por cada token renovado
  }, [load, userId]);

  /** Vuelve a pedirla después de un cambio. */
  const refresh = useCallback(async () => { if (token) setState(await load(token)); }, [load, token]);
  const setStory = useCallback((story: ManagedStory) => setState({ for: key, story, error: null }), [key]);
  /** Cambia la historia en pantalla sin esperar a la API (para responder al toque de inmediato). */
  const update = useCallback((change: (story: ManagedStory) => ManagedStory) => {
    setState((prev) => (prev?.story && prev.for === key ? { ...prev, story: change(prev.story) } : prev));
  }, [key]);

  const signedIn = Boolean(session);
  const current = signedIn && state?.for === key ? state : null;
  return { loaded: ready && (!signedIn || current !== null), signedIn, story: current?.story ?? null, error: current?.error ?? null, setStory, update, refresh };
}
