import Image from "next/image";
import Link from "next/link";
import { Desk } from "@/components/Desk";
import { ShelfCard } from "@/components/StoryCard";
import { Btn, Scribble } from "@/components/ui";
import { getStories } from "@/lib/queries";

export default async function Inicio() {
  const stories = await getStories();
  const popular = [...stories].sort((a, b) => b.votes - a.votes).slice(0, 6);
  const fresh = [...stories].sort((a, b) => a.updatedDays - b.updatedDays).slice(0, 6);

  return (
    <div className="stack-lg">
      <div>
        <h1 className="h-hero">Tu escritorio</h1>
        <Scribble width={220} />
      </div>

      <Desk stories={stories} />

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
        <Btn variant="paper" href="/escribir/nueva" icon="upload">Importar .docx</Btn>
      </section>

      <section className="shelf">
        <div className="shelf__head"><div className="shelflabel">Recién actualizadas</div><Link href="/explorar" className="textlink">Ver todas</Link></div>
        <div className="shelfgrid">{fresh.map((s) => <ShelfCard key={s.slug} story={s} />)}</div>
      </section>
    </div>
  );
}
