import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Book } from "@/components/Book";
import { Icon } from "@/components/Icon";
import { Board, Spine } from "@/components/Shelf";
import { StoryActions } from "@/components/StoryActions";
import { Avatar, Btn, Chip, Leader } from "@/components/ui";
import { fmt, getChapters, getStories, getStory, reading, updatedLabel } from "@/lib/data";

export function generateStaticParams() {
  return getStories().map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({ params }: PageProps<"/historia/[slug]">): Promise<Metadata> {
  const story = getStory((await params).slug);
  return story ? { title: story.title, description: story.tagline } : {};
}

function TagRow({ label, tags }: { label: string; tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="tagrow"><span className="tagrow__label">{label}</span><span className="chips">{tags.map((t) => <Chip key={t}>{t}</Chip>)}</span></div>
  );
}

export default async function Historia({ params }: PageProps<"/historia/[slug]">) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) notFound();
  const all = getStories();
  const i = all.indexOf(story);
  const neighbors = [1, 2, 3, 4].map((d) => all[(i + d) % all.length]);
  const chapters = getChapters(slug);
  const at = reading.find((r) => r.slug === slug)?.chapter ?? 0;
  const shown = chapters.slice(0, 7);

  return (
    <div className="stack-lg">
      <section className="hero">
        <div className="hero__shelf">
          <div className="hero__row">
            <div className="hero__dim" aria-hidden="true">{neighbors.slice(0, 2).map((s) => <Spine key={s.slug} story={s} scale={1.25} />)}</div>
            <div className="hero__book hero__book--l"><Book story={story} size="l" /></div>
            <div className="hero__book hero__book--m"><Book story={story} size="m" /></div>
            <div className="hero__dim" aria-hidden="true">{neighbors.slice(2).map((s) => <Spine key={s.slug} story={s} scale={1.25} />)}</div>
          </div>
          <Board />
        </div>
        <div className="ficha">
          <div className="row between">
            <span className="ficha__no">FICHA N.º {String(i + 409).padStart(4, "0")}</span>
            <span className="stamp">{story.status.toUpperCase()}</span>
          </div>
          <h1 className="h-hero">{story.title}</h1>
          <p className="lead">{story.tagline}</p>
          <Leader k="Autor/a"><Link href={`/perfil/${story.author}`}>@{story.author}</Link></Leader>
          <Leader k="Capítulos">{story.chapters}</Leader>
          <Leader k="Lecturas">{fmt(story.reads)}</Leader>
          <Leader k="Votos">{fmt(story.votes)}</Leader>
          <Leader k="Actualizada">{updatedLabel(story.updatedDays)}</Leader>
          <StoryActions story={story} chapter={Math.max(1, at)} />
        </div>
      </section>

      <div className="twocol">
        <div className="stack-lg">
          <section className="stack-sm">
            <h2 className="h-sec">Sinopsis</h2>
            {story.synopsis.map((p) => <p key={p} className="prose">{p}</p>)}
          </section>
          <section className="stack-sm">
            <h2 className="h-sec">Etiquetas</h2>
            <TagRow label="Género" tags={[story.genre]} />
            <TagRow label="Fandom" tags={[story.fandom]} />
            <TagRow label="Relación" tags={story.relation ? [story.relation] : []} />
            <TagRow label="Tropos" tags={story.tropes} />
            <TagRow label="Advertencias" tags={story.warnings} />
            <TagRow label="Clasificación" tags={[story.rating, story.format]} />
          </section>
          <section className="mood">
            <span className="mood__icon"><Icon name="music" size={24} /></span>
            <div style={{ flex: "1 1 180px", minWidth: 0 }}><strong>Moodboard musical</strong><div className="muted small">La playlist que acompaña la historia</div></div>
            <Btn variant="ink" size="sm" disabled>Abrir en Lyric Island</Btn>
          </section>
        </div>

        <div className="stack-lg">
          <section className="stack-sm" id="capitulos">
            <h2 className="h-sec"><span className="deep"><Icon name="drop" size={20} stroke={2.2} /></span> Rastro de tinta</h2>
            <p className="muted small">Lo que ya leíste queda entintado.</p>
            <ol className="trail">
              {shown.map((c) => {
                const done = c.n < at;
                return (
                  <li key={c.n} className={done ? "is-done" : ""}>
                    <Link href={`/leer/${slug}/${c.n}`}>
                      <span className="trail__dot" role="img" aria-label={done ? "Leído" : "Pendiente"} />
                      <span className="trail__title">{c.n}. {c.title}</span>
                      {c.badge && <Chip tone="sand">{c.badge}</Chip>}
                    </Link>
                  </li>
                );
              })}
            </ol>
            {chapters.length > shown.length && <p className="muted small">Y {chapters.length - shown.length} capítulos más.</p>}
          </section>
          <section className="stack-sm">
            <h2 className="h-sec">Lo que dicen</h2>
            <div className="comment"><Avatar letter="M" color="#FF8FAB" size={36} /><div><strong className="small">@maru.escribe</strong><p>El capítulo del chat me hizo reír en el bus. Necesito el siguiente.</p></div></div>
            <div className="comment"><Avatar letter="K" color="#B9A5F0" size={36} /><div><strong className="small">@kepler_22</strong><p>No pensé que me iba a importar tanto esta historia.</p></div></div>
          </section>
        </div>
      </div>
    </div>
  );
}
