"use client";

import { fmt, type MyStory } from "@/lib/data";
import { useMyStories } from "@/lib/useMyStories";
import { useAuthHref } from "@/lib/useAuthHref";
import { Book } from "./Book";
import { Icon, type IconName } from "./Icon";
import { Btn, Chip } from "./ui";

function Tile({ n, label, icon }: { n: string; label: string; icon: IconName }) {
  return <div className="tile"><span className="tile__icon"><Icon name={icon} size={22} /></span><div><b>{n}</b><span className="muted small">{label}</span></div></div>;
}

function note(s: MyStory): string {
  const drafts = s.totalChapters - s.chapters;
  const parts = [`${s.chapters} ${s.chapters === 1 ? "capítulo publicado" : "capítulos publicados"}`];
  if (drafts > 0) parts.push(`${drafts} en borrador`);
  return parts.join(" · ");
}

/** El panel de escritura: la historia más reciente, totales reales y la lista de historias propias. */
export function MyWorks() {
  const auth = useAuthHref();
  const { loaded, signedIn, stories, error } = useMyStories();

  if (!loaded) return <p className="muted">Buscando tus cuadernos…</p>;
  if (!signedIn) {
    return (
      <div className="empty">
        <h2 className="h-sec">Entra para escribir</h2>
        <p className="muted">Tus historias y borradores viven en tu cuenta.</p>
        <div className="row wrap"><Btn href={auth.entrar}>Entrar</Btn><Btn variant="ghost" href={auth.registro}>Crear cuenta</Btn></div>
      </div>
    );
  }
  if (error) return <p className="notice" role="alert">No pudimos traer tus historias. Revisa que la API esté encendida y recarga.</p>;
  if (stories.length === 0) {
    return (
      <div className="empty">
        <h2 className="h-sec">Tu primera historia empieza aquí</h2>
        <p className="muted">Créala, escribe el primer capítulo y publícalo cuando quieras.</p>
        <Btn href="/escribir/nueva" icon="plus">Nueva historia</Btn>
      </div>
    );
  }

  const current = stories[0];
  const total = (pick: (s: MyStory) => number) => fmt(stories.reduce((n, s) => n + pick(s), 0));
  return (
    <>
      <section className="desk desk--write">
        <Book story={current} size="m" />
        <div className="desk__now">
          <span className="muted">Sigue escribiendo</span>
          <h2 className="h-page">{current.title}</h2>
          <span>{note(current)}</span>
          <div className="row"><Btn href={`/editor/${current.slug}`} icon="pen">Continuar</Btn></div>
        </div>
      </section>

      <div className="tiles">
        <Tile n={total((s) => s.reads)} label="Lecturas en total" icon="eye" />
        <Tile n={total((s) => s.votes)} label="Votos en total" icon="heart" />
        <Tile n={total((s) => s.chapters)} label="Capítulos publicados" icon="list" />
      </div>

      <section className="stack-sm">
        <div className="shelflabel">Tus historias · {stories.length}</div>
        {stories.map((story) => (
          <div key={story.slug} className="workrow">
            <Book story={story} size="s" />
            <div className="stack-sm" style={{ flex: "1 1 200px", minWidth: 0 }}>
              <span className="h-card">{story.title}</span>
              <span className="muted small">{note(story)}</span>
            </div>
            <Chip tone={story.published ? "tint" : "lilac"}>{story.published ? "Publicada" : "Borrador"}</Chip>
            <span className="meta"><span><Icon name="eye" size={16} />{story.published ? fmt(story.reads) : "—"}</span></span>
            <Btn variant="ghost" size="sm" href={`/editor/${story.slug}`} icon="pen">Escribir</Btn>
          </div>
        ))}
      </section>
    </>
  );
}
