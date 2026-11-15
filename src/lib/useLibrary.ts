"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { api } from "./api";

export interface LibraryEntry { slug: string; chapter: number; updatedAt: string }

/**
 * La repisa de la persona que entró: qué historias guardó y por qué capítulo va.
 * Sin sesión queda vacía y `signedIn` en false.
 */
export function useLibrary() {
  const { ready, token, session } = useSession();
  const [entries, setEntries] = useState<LibraryEntry[] | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!token || !userId) return;
    let alive = true;
    api<LibraryEntry[]>("/me/library", { token })
      .then((list) => { if (alive) { setEntries(list); setLoadedFor(userId); } })
      .catch(() => { if (alive) { setEntries([]); setLoadedFor(userId); } });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se recarga solo al cambiar de persona
  }, [userId]);

  const save = useCallback(async (slug: string, chapter = 1) => {
    if (!token) return;
    await api(`/me/library/${slug}`, { method: "PUT", token, body: JSON.stringify({ chapter }) });
    setEntries((list) => [{ slug, chapter, updatedAt: new Date().toISOString() }, ...(list ?? []).filter((e) => e.slug !== slug)]);
  }, [token]);

  const remove = useCallback(async (slug: string) => {
    if (!token) return;
    await api(`/me/library/${slug}`, { method: "DELETE", token });
    setEntries((list) => (list ?? []).filter((e) => e.slug !== slug));
  }, [token]);

  const signedIn = Boolean(session);
  const current = signedIn && loadedFor === userId ? entries : null;
  return {
    /** true cuando ya se sabe si hay sesión y, si la hay, ya llegó la repisa. */
    loaded: ready && (!signedIn || current !== null),
    signedIn,
    entries: current ?? [],
    save,
    remove,
  };
}
