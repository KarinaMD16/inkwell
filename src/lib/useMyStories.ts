"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import { api } from "./api";
import { toMyStory, type ApiMyStory, type MyStory } from "./data";

/** Las historias de la persona que entró, publicadas o no. */
export function useMyStories() {
  const { ready, token, session } = useSession();
  const userId = session?.user.id ?? null;
  const [state, setState] = useState<{ for: string; stories: MyStory[]; error: boolean } | null>(null);

  useEffect(() => {
    if (!token || !userId) return;
    let alive = true;
    api<ApiMyStory[]>("/me/stories", { token })
      .then((list) => { if (alive) setState({ for: userId, stories: list.map(toMyStory), error: false }); })
      .catch(() => { if (alive) setState({ for: userId, stories: [], error: true }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se recarga solo al cambiar de persona
  }, [userId]);

  const signedIn = Boolean(session);
  const current = signedIn && state?.for === userId ? state : null;
  return { loaded: ready && (!signedIn || current !== null), signedIn, stories: current?.stories ?? [], error: current?.error ?? false };
}
