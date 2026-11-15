import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProfileButtons } from "@/components/ProfileButtons";
import { ShelfCard } from "@/components/StoryCard";
import { Avatar } from "@/components/ui";
import { getAuthor, getAuthors, getStoriesBy } from "@/lib/queries";

export async function generateStaticParams() {
  return (await getAuthors()).map((usuario) => ({ usuario }));
}
export async function generateMetadata({ params }: PageProps<"/perfil/[usuario]">): Promise<Metadata> {
  return { title: `@${(await params).usuario}` };
}

// La lectura de `params` va dentro de <Suspense>: así la navegación muestra el marco al instante.
export default function Perfil({ params }: PageProps<"/perfil/[usuario]">) {
  return (
    <Suspense fallback={<p className="muted">Buscando el perfil…</p>}>
      <Autor params={params} />
    </Suspense>
  );
}

async function Autor({ params }: Pick<PageProps<"/perfil/[usuario]">, "params">) {
  const { usuario } = await params;
  const [author, works] = await Promise.all([getAuthor(usuario), getStoriesBy(usuario)]);
  if (!author) notFound();

  return (
    <div className="stack-lg">
      <section className="profile">
        <Avatar letter={author.name[0].toUpperCase()} color={author.color} size={120} />
        <div className="stack-sm" style={{ flex: "1 1 300px", minWidth: 0 }}>
          <h1 className="h-hero">{author.name}</h1>
          <strong className="muted">@{author.handle}</strong>
          <p className="prose">{author.bio}</p>
          {/* Seguidores y siguiendo vuelven cuando la API tenga "seguir". */}
          <div className="stats"><span><b>{works.length}</b>Historias</span></div>
        </div>
        <ProfileButtons handle={author.handle} />
      </section>

      <section className="shelf">
        <div className="shelf__head"><div className="shelflabel">Historias · {works.length}</div></div>
        {works.length ? (
          <div className="shelfgrid">{works.map((s) => <ShelfCard key={s.slug} story={s} />)}</div>
        ) : (
          <div className="empty"><h2 className="h-sec">Esta repisa espera su primer libro</h2><p className="muted">Cuando publique una historia, aparecerá aquí.</p></div>
        )}
      </section>
    </div>
  );
}
