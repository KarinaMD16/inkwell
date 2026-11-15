"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ChapterMeta } from "@/lib/data";
import { useMyStories } from "@/lib/useMyStories";
import { useAuthHref } from "@/lib/useAuthHref";
import { EditorView } from "./EditorView";
import { Btn } from "./ui";

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="content"><div className="empty"><h1 className="h-sec">{title}</h1>{children}</div></div>;
}

/**
 * Carga la historia propia (publicada o no) con la sesión de la persona y abre el editor.
 * Va en el navegador porque un borrador solo lo puede ver quien lo escribe.
 */
export function EditorLoader() {
  const auth = useAuthHref();
  const { slug } = useParams<{ slug: string }>();
  const { loaded, signedIn, stories, error } = useMyStories();
  const [chapters, setChapters] = useState<{ slug: string; list: ChapterMeta[] } | null>(null);
  const story = stories.find((s) => s.slug === slug);

  useEffect(() => {
    if (!story) return;
    let alive = true;
    api<{ n: number; title: string; badge: string | null }[]>(`/stories/${story.slug}/chapters`)
      .then((list) => list.map((c) => ({ n: c.n, title: c.title, badge: c.badge ?? undefined })))
      .catch(() => [])
      .then((list) => { if (alive) setChapters({ slug: story.slug, list }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo depende de qué historia es
  }, [story?.slug]);

  if (!loaded) return <Message title="Abriendo tu cuaderno…">{null}</Message>;
  if (!signedIn) {
    return <Message title="Entra para escribir"><p className="muted">El editor necesita tu cuenta.</p><Btn href={auth.entrar}>Entrar</Btn></Message>;
  }
  if (error) return <Message title="No pudimos abrir el editor"><p className="muted">Revisa que la API esté encendida y recarga.</p></Message>;
  if (!story) {
    return <Message title="Esta historia no es tuya o no existe"><p className="muted">Solo quien la escribe puede editarla.</p><Btn href="/escribir">Tus historias</Btn></Message>;
  }
  if (chapters?.slug !== story.slug) return <Message title="Abriendo tu cuaderno…">{null}</Message>;
  return <EditorView key={story.slug} story={story} chapters={chapters.list} />;
}
