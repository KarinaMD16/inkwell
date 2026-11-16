import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfileSkeleton } from "@/components/Skeleton";
import { ShelfCard } from "@/components/StoryCard";
import { getAuthor, getAuthors, getStoriesBy } from "@/lib/queries";

export async function generateStaticParams() {
  return (await getAuthors()).map((usuario) => ({ usuario }));
}
export async function generateMetadata({ params }: PageProps<"/perfil/[usuario]">): Promise<Metadata> {
  const { usuario } = await params;
  const author = await getAuthor(usuario);
  if (!author) return { title: `@${usuario}` };
  const images = author.avatarUrl ? [author.avatarUrl] : undefined;
  return {
    title: `${author.name} (@${author.handle})`,
    description: author.bio || `Historias de @${author.handle} en Inkwell.`,
    openGraph: { title: `${author.name} (@${author.handle})`, description: author.bio || undefined, images },
  };
}

// La lectura de `params` va dentro de <Suspense>: así la navegación muestra el marco al instante.
export default function Perfil({ params }: PageProps<"/perfil/[usuario]">) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
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
      <ProfileHeader author={author} works={works.length} />

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
