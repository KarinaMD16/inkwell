import Image from "next/image";
import Link from "next/link";
import { Book } from "@/components/Book";
import { OpenBook } from "@/components/OpenBook";
import { Shelf, Spine } from "@/components/Shelf";
import { ShelfCard } from "@/components/StoryCard";
import { Btn, Progress, Scribble, Vial } from "@/components/ui";
import { getStories, getStory, pct, reading } from "@/lib/data";

export default function Inicio() {
  const stories = getStories();
  const [first, second] = reading;
  const now = getStory(first.slug)!;
  const also = getStory(second.slug)!;
  const mine = reading.map((r) => getStory(r.slug)!).slice(2);
  const popular = [...stories].sort((a, b) => b.votes - a.votes).slice(0, 6);
  const fresh = [...stories].sort((a, b) => a.updatedDays - b.updatedDays).slice(0, 6);

  return (
    <div className="stack-lg">
      <div>
        <h1 className="h-hero">Tu escritorio</h1>
        <Scribble width={220} />
      </div>

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
        <div className="desk__also">
          <Book story={also} size="n" />
          <div className="stack-sm" style={{ minWidth: 0, flex: 1 }}>
            <span className="muted small">También abierto</span>
            <span className="h-card">{also.title}</span>
            <Progress pct={pct(second.chapter, also.chapters)} track="var(--line)" />
            <Link href={`/leer/${also.slug}/${second.chapter}`} className="textlink">Seguir en el cap. {second.chapter}</Link>
          </div>
        </div>
      </section>

      <Shelf label={`Tu repisa · ${reading.length}`} action={<Link href="/biblioteca" className="textlink">Ver tu librero</Link>}>
        {mine.map((s) => <Spine key={s.slug} story={s} />)}
      </Shelf>

      <section className="shelf">
        <div className="shelf__head"><div className="shelflabel">Populares esta semana</div><Link href="/explorar" className="textlink">Ver todas</Link></div>
        <div className="shelfgrid">{popular.map((s) => <ShelfCard key={s.slug} story={s} />)}</div>
      </section>

      <section className="banner">
        <Image src="/inkwell-mark-paper.svg" alt="" width={132} height={132} />
        <div className="stack-sm" style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h2 className="h-page">¿Tu historia vive en un Word?</h2>
          <p>Sube el .docx y detectamos tus capítulos. Revisas, ajustas y publicas.</p>
        </div>
        <Btn variant="paper" href="/escribir" icon="upload">Importar .docx</Btn>
      </section>

      <section className="shelf">
        <div className="shelf__head"><div className="shelflabel">Recién actualizadas</div><Link href="/explorar" className="textlink">Ver todas</Link></div>
        <div className="shelfgrid">{fresh.map((s) => <ShelfCard key={s.slug} story={s} />)}</div>
      </section>
    </div>
  );
}
