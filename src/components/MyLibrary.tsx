"use client";

import type { Story } from "@/lib/data";
import { useLibrary } from "@/lib/useLibrary";
import { LibraryView, type LibItem } from "./LibraryView";
import { Btn } from "./ui";

/**
 * Arma las pestañas del librero con la repisa de la API:
 * guardadas (sin empezar), leyendo y terminadas, según el capítulo por el que va.
 */
export function MyLibrary({ stories, listName, listStories }: { stories: Story[]; listName: string; listStories: Story[] }) {
  const { loaded, signedIn, entries } = useLibrary();

  if (!loaded) return <p className="muted">Sacando los libros de la repisa…</p>;
  if (!signedIn) {
    return (
      <div className="empty">
        <h1 className="h-hero">Tu librero</h1>
        <p className="muted">Entra para ver las historias que guardaste y por dónde vas en cada una.</p>
        <div className="row wrap"><Btn href="/entrar">Entrar</Btn><Btn variant="ghost" href="/registro">Crear cuenta</Btn></div>
      </div>
    );
  }

  const bySlug = new Map(stories.map((s) => [s.slug, s]));
  const items: LibItem[] = entries.flatMap((e) => {
    const story = bySlug.get(e.slug);
    return story ? [{ story, chapter: e.chapter, offline: false }] : [];
  });
  const done = (i: LibItem) => i.story.chapters > 0 && i.chapter >= i.story.chapters;
  const tabs = [
    { name: "Leyendo", items: items.filter((i) => i.chapter > 1 && !done(i)) },
    { name: "Guardadas", items: items.filter((i) => i.chapter <= 1 && !done(i)) },
    { name: "Terminadas", items: items.filter(done) },
  ];
  return <LibraryView tabs={tabs} listName={listName} listStories={listStories} />;
}
