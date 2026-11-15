import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shelf, Spine } from "@/components/Shelf";
import { ShelfCard } from "@/components/StoryCard";
import { Avatar, Btn, IconBtn } from "@/components/ui";
import { fmt, getAuthor, getAuthors, getStories, getStoriesBy, me } from "@/lib/data";

export function generateStaticParams() {
  return getAuthors().map((usuario) => ({ usuario }));
}
export async function generateMetadata({ params }: PageProps<"/perfil/[usuario]">): Promise<Metadata> {
  return { title: `@${(await params).usuario}` };
}

export default async function Perfil({ params }: PageProps<"/perfil/[usuario]">) {
  const { usuario } = await params;
  const author = getAuthor(usuario);
  if (!author) notFound();
  const works = getStoriesBy(usuario);
  const list = getStories().filter((s) => s.author !== usuario).slice(0, 6);
  const isMe = usuario === me.handle;

  return (
    <div className="stack-lg">
      <section className="profile">
        <Avatar letter={author.name[0]} color={author.color} size={120} />
        <div className="stack-sm" style={{ flex: "1 1 300px", minWidth: 0 }}>
          <h1 className="h-hero">{author.name}</h1>
          <strong className="muted">@{author.handle}</strong>
          <p className="prose">{author.bio}</p>
          <div className="stats">
            <span><b>{works.length}</b>Historias</span><span><b>{fmt(author.followers)}</b>Seguidores</span><span><b>{author.following}</b>Siguiendo</span>
          </div>
        </div>
        <div className="row wrap">
          {isMe ? (<><Btn variant="ghost" href="/escribir" icon="pen">Tus historias</Btn><Btn variant="ghost" href="/ajustes" icon="settings">Ajustes</Btn></>) : <Btn icon="plus">Seguir</Btn>}
          <IconBtn icon="share" label="Compartir perfil" />
        </div>
      </section>

      <section className="shelf">
        <div className="shelf__head"><div className="shelflabel">{isMe ? "Tus historias" : "Sus historias"} · {works.length}</div></div>
        {works.length ? (
          <div className="shelfgrid">{works.map((s) => <ShelfCard key={s.slug} story={s} />)}</div>
        ) : (
          <div className="empty"><h2 className="h-sec">Esta repisa espera su primer libro</h2><p className="muted">Cuando publique una historia, aparecerá aquí.</p></div>
        )}
      </section>

      <Shelf label="Lista pública: lo que lee">{list.map((s, i) => <Spine key={s.slug} story={s} lean={i === list.length - 1} />)}</Shelf>
    </div>
  );
}
