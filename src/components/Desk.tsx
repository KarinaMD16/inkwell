"use client";

import Link from "next/link";
import { pct, type Story } from "@/lib/data";
import { useLibrary } from "@/lib/useLibrary";
import { Book } from "./Book";
import { OpenBook } from "./OpenBook";
import { Shelf, Spine } from "./Shelf";
import { Btn, Progress, Vial } from "./ui";

/**
 * "Tu escritorio" y "Tu repisa" del inicio. Depende de la sesión, así que se arma en el
 * navegador con la repisa de la API; las historias llegan ya cargadas desde el servidor.
 */
export function Desk({ stories }: { stories: Story[] }) {
  const { loaded, signedIn, entries } = useLibrary();
  const bySlug = new Map(stories.map((s) => [s.slug, s]));
  const reading = entries.flatMap((e) => {
    const story = bySlug.get(e.slug);
    return story ? [{ story, chapter: Math.min(e.chapter, Math.max(1, story.chapters)) }] : [];
  });

  if (!loaded) return <section className="desk" aria-busy="true"><div className="desk__blob" aria-hidden="true" /></section>;

  if (!signedIn || reading.length === 0) {
    return (
      <section className="desk">
        <div className="desk__blob" aria-hidden="true" />
        <div className="desk__now">
          <span className="muted">{signedIn ? "Tu escritorio está libre" : "Leer no pide cuenta"}</span>
          <h2 className="h-page">{signedIn ? "Elige tu próxima historia" : "Entra para guardar por dónde vas"}</h2>
          <p className="muted">
            {signedIn
              ? "Pon una historia en tu repisa y aquí verás el capítulo por el que vas."
              : "Con tu cuenta guardas historias en tu repisa y retomas cada una en el capítulo exacto."}
          </p>
          <div className="row wrap">
            <Btn href="/explorar" icon="search">Explorar historias</Btn>
            {!signedIn && <Btn variant="ghost" href="/entrar">Entrar</Btn>}
          </div>
        </div>
      </section>
    );
  }

  const [first, second] = reading;
  const now = first.story;
  return (
    <>
      <section className="desk">
        <div className="desk__blob" aria-hidden="true" />
        <OpenBook chapter={first.chapter} color={now.color} />
        <div className="desk__now">
          <span className="muted">Lo dejaste abierto aquí</span>
          <h2 className="h-page">{now.title}</h2>
          <strong>@{now.author}</strong>
          <Vial pct={pct(first.chapter, now.chapters)} label={`Capítulo ${first.chapter} de ${now.chapters} · ${pct(first.chapter, now.chapters)} % entintado`} />
          <div className="row wrap">
            <Btn href={`/leer/${now.slug}/${first.chapter}`} icon="arrow">Seguir leyendo</Btn>
            <Btn variant="ghost" href={`/historia/${now.slug}`}>Ver ficha</Btn>
          </div>
        </div>
        {second && (
          <div className="desk__also">
            <Book story={second.story} size="n" />
            <div className="stack-sm" style={{ minWidth: 0, flex: 1 }}>
              <span className="muted small">También abierto</span>
              <span className="h-card">{second.story.title}</span>
              <Progress pct={pct(second.chapter, second.story.chapters)} track="var(--line)" />
              <Link href={`/leer/${second.story.slug}/${second.chapter}`} className="textlink">Seguir en el cap. {second.chapter}</Link>
            </div>
          </div>
        )}
      </section>

      <Shelf label={`Tu repisa · ${reading.length}`} action={<Link href="/biblioteca" className="textlink">Ver tu librero</Link>}>
        {reading.map((r) => <Spine key={r.story.slug} story={r.story} />)}
      </Shelf>
    </>
  );
}
