import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReaderView } from "@/components/ReaderView";
import { getChapterBlocks, getChapters, getStories, getStory } from "@/lib/data";

export function generateStaticParams() {
  return getStories().flatMap((s) => Array.from({ length: s.chapters }, (_, i) => ({ slug: s.slug, cap: String(i + 1) })));
}
export async function generateMetadata({ params }: PageProps<"/leer/[slug]/[cap]">): Promise<Metadata> {
  const { slug, cap } = await params;
  const story = getStory(slug);
  return story ? { title: `${story.title} · capítulo ${cap}` } : {};
}

export default async function Leer({ params }: PageProps<"/leer/[slug]/[cap]">) {
  const { slug, cap } = await params;
  const story = getStory(slug);
  const chapter = getChapters(slug).find((c) => c.n === Number(cap));
  if (!story || !chapter) notFound();
  return <ReaderView story={story} chapter={chapter} total={story.chapters} blocks={getChapterBlocks()} />;
}
