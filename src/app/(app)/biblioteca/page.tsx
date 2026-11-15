import type { Metadata } from "next";
import { MyLibrary } from "@/components/MyLibrary";
import { lists, type Story } from "@/lib/data";
import { getStories } from "@/lib/queries";

export const metadata: Metadata = { title: "Tu librero" };

export default async function Biblioteca() {
  const stories = await getStories();
  const bySlug = new Map(stories.map((s) => [s.slug, s]));
  // La lista sigue siendo de muestra hasta que la API tenga listas.
  const listStories = lists[0].slugs.map((s) => bySlug.get(s)).filter((s): s is Story => Boolean(s));
  return <MyLibrary stories={stories} listName={lists[0].name} listStories={listStories} />;
}
