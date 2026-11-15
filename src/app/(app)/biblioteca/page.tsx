import type { Metadata } from "next";
import { LibraryView, type LibItem } from "@/components/LibraryView";
import { finished, getStory, lists, reading, saved } from "@/lib/data";

export const metadata: Metadata = { title: "Tu librero" };

export default function Biblioteca() {
  const item = (slug: string, chapter: number, offline = false): LibItem => ({ story: getStory(slug)!, chapter, offline });
  const tabs = [
    { name: "Leyendo", items: reading.map((r) => item(r.slug, r.chapter, r.offline)) },
    { name: "Guardadas", items: saved.map((s) => item(s, 1)) },
    { name: "Terminadas", items: finished.map((s) => item(s, getStory(s)!.chapters, true)) },
  ];
  return <LibraryView tabs={tabs} listName={lists[0].name} listStories={lists[0].slugs.map((s) => getStory(s)!)} />;
}
