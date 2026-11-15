import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorView } from "@/components/EditorView";
import { getChapters, getStories, getStory } from "@/lib/data";

export const metadata: Metadata = { title: "Editor" };

export function generateStaticParams() {
  return getStories().map((s) => ({ slug: s.slug }));
}

export default async function Editor({ params }: PageProps<"/editor/[slug]">) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) notFound();
  return <EditorView story={story} chapters={getChapters(slug)} />;
}
