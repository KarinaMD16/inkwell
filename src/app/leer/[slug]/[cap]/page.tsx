import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReaderView } from "@/components/ReaderView";
import { ReaderSkeleton } from "@/components/Skeleton";
import { getChapter, getChapters, getStories, getStory } from "@/lib/queries";

export async function generateStaticParams() {
  const stories = await getStories();
  const all = await Promise.all(stories.map(async (s) => (await getChapters(s.slug)).map((c) => ({ slug: s.slug, cap: String(c.n) }))));
  return all.flat();
}
export async function generateMetadata({ params }: PageProps<"/leer/[slug]/[cap]">): Promise<Metadata> {
  const { slug, cap } = await params;
  const story = await getStory(slug);
  return story ? { title: `${story.title} · capítulo ${cap}` } : {};
}

// La lectura de `params` va dentro de <Suspense>: así la navegación muestra el marco al instante.
export default function Leer({ params }: PageProps<"/leer/[slug]/[cap]">) {
  return (
    <Suspense fallback={<ReaderSkeleton />}>
      <Capitulo params={params} />
    </Suspense>
  );
}

async function Capitulo({ params }: Pick<PageProps<"/leer/[slug]/[cap]">, "params">) {
  const { slug, cap } = await params;
  const n = Number(cap);
  if (!Number.isInteger(n) || n < 1) notFound();
  const [story, chapter] = await Promise.all([getStory(slug), getChapter(slug, n)]);
  if (!story || !chapter) notFound();
  return <ReaderView story={story} chapter={chapter.meta} total={story.chapters} blocks={chapter.blocks} />;
}
