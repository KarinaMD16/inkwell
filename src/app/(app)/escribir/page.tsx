import type { Metadata } from "next";
import { Book } from "@/components/Book";
import { Icon, type IconName } from "@/components/Icon";
import { ImportPanel } from "@/components/ImportPanel";
import { Btn, Chip } from "@/components/ui";
import { fmt, getStory, myWorks } from "@/lib/data";

export const metadata: Metadata = { title: "Escribir" };

const TONE = { Publicada: "tint", Programada: "sand", Borrador: "lilac" } as const;

function Tile({ n, label, icon }: { n: string; label: string; icon: IconName }) {
  return <div className="tile"><span className="tile__icon"><Icon name={icon} size={22} /></span><div><b>{n}</b><span className="muted small">{label}</span></div></div>;
}

export default function Escribir() {
  const works = myWorks.map((w) => ({ ...w, story: getStory(w.slug)! }));
  const current = works[0];
  return (
    <div className="stack-lg">
      <div className="row between wrap end">
        <h1 className="h-hero">Escribir</h1>
        <Btn href="/escribir/nueva" icon="plus">Nueva historia</Btn>
      </div>

      <section className="desk desk--write">
        <Book story={current.story} size="m" />
        <div className="desk__now">
          <span className="muted">Sigue escribiendo</span>
          <h2 className="h-page">{current.story.title}</h2>
          <span>{current.note}</span>
          <div className="row"><Btn href={`/editor/${current.slug}`} icon="pen">Continuar</Btn></div>
        </div>
      </section>

      <div className="tiles">
        <Tile n="3,1 k" label="Lecturas esta semana" icon="eye" />
        <Tile n="412" label="Votos esta semana" icon="heart" />
        <Tile n="96" label="Comentarios esta semana" icon="chat" />
      </div>

      <div className="twocol">
        <section className="stack-sm">
          <div className="shelflabel">Tus historias · {works.length}</div>
          {works.map(({ story, state, note }) => (
            <div key={story.slug} className="workrow">
              <Book story={story} size="s" />
              <div className="stack-sm" style={{ flex: "1 1 200px", minWidth: 0 }}>
                <span className="h-card">{story.title}</span>
                <span className="muted small">{note}</span>
              </div>
              <Chip tone={TONE[state]}>{state}</Chip>
              <span className="meta"><span><Icon name="eye" size={16} />{state === "Borrador" ? "—" : fmt(story.reads)}</span></span>
              <Btn variant="ghost" size="sm" href={`/editor/${story.slug}`} icon="pen">Editar</Btn>
            </div>
          ))}
        </section>
        <ImportPanel />
      </div>
    </div>
  );
}
