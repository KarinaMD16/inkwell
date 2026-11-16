"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MyChapterFull } from "@/lib/data";
import { useAuthHref } from "@/lib/useAuthHref";
import { useManagedStory } from "@/lib/useManagedStory";
import { EditorView } from "./EditorView";
import { useSession } from "./SessionProvider";
import { EditorSkeleton } from "./Skeleton";
import { Btn } from "./ui";

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="content"><div className="empty"><h1 className="h-sec">{title}</h1>{children}</div></div>;
}

/**
 * Abre el editor sobre un capítulo propio: /editor/<historia>?cap=<id del capítulo>.
 * Carga en el navegador porque un borrador solo lo puede ver quien lo escribe.
 * Sin `cap` no hay qué editar: se vuelve a la pantalla de capítulos de la historia.
 */
export function EditorLoader() {
  const auth = useAuthHref();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const cap = useSearchParams().get("cap");
  const { token } = useSession();
  const { loaded, signedIn, story, error } = useManagedStory(slug);
  const [chapter, setChapter] = useState<{ id: string; data: MyChapterFull | null } | null>(null);
  const hasStory = Boolean(story);

  useEffect(() => {
    if (!cap) router.replace(`/escribir/${slug}`);
  }, [cap, slug, router]);

  useEffect(() => {
    if (!cap || !token || !hasStory) return;
    let alive = true;
    api<MyChapterFull>(`/me/stories/${encodeURIComponent(slug)}/chapters/${encodeURIComponent(cap)}`, { token })
      .then((data) => { if (alive) setChapter({ id: cap, data }); })
      .catch(() => { if (alive) setChapter({ id: cap, data: null }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se pide una vez por capítulo, no por cada token renovado
  }, [cap, slug, hasStory]);

  if (!loaded || !cap) return <EditorSkeleton />;
  if (!signedIn) {
    return <Message title="Entra para escribir"><p className="muted">El editor necesita tu cuenta.</p><Btn href={auth.entrar}>Entrar</Btn></Message>;
  }
  if (error === "api") return <Message title="No pudimos abrir el editor"><p className="muted">Revisa que la API esté encendida y recarga.</p></Message>;
  if (!story) {
    return <Message title="Esta historia no es tuya o no existe"><p className="muted">Solo quien la escribe puede editarla.</p><Btn href="/escribir">Mis historias</Btn></Message>;
  }
  if (chapter?.id !== cap) return <EditorSkeleton />;
  if (!chapter.data) {
    return <Message title="No encontramos ese capítulo"><p className="muted">Puede que lo hayas borrado.</p><Btn href={`/escribir/${story.slug}`}>Ver los capítulos</Btn></Message>;
  }
  return <EditorView key={chapter.id} story={story} chapter={chapter.data} />;
}
