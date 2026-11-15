// Solo para componentes del servidor: usa "use cache".
import { cacheLife } from "next/cache";
import { api, ApiError } from "./api";
import { colorFor, toStory, type ApiStory, type Author, type Block, type ChapterMeta, type Story } from "./data";

// ----- Lectura pública desde la API -----
// Todo lo público se cachea unos minutos ("use cache"): las páginas se prerenderizan
// y se refrescan solas. Lo de cada persona (perfil, repisa, votos) se pide desde el
// navegador con su sesión; ver SessionProvider y useLibrary.

/** null si la API responde 404; cualquier otro error se propaga. */
async function orNull<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getStories(): Promise<Story[]> {
  "use cache";
  cacheLife("minutes");
  const { items } = await api<{ items: ApiStory[] }>("/stories?limit=50&sort=recientes");
  return items.map(toStory);
}

export async function getStory(slug: string): Promise<Story | undefined> {
  "use cache";
  cacheLife("minutes");
  const story = await orNull(api<ApiStory>(`/stories/${encodeURIComponent(slug)}`));
  return story ? toStory(story) : undefined;
}

export async function getChapters(slug: string): Promise<ChapterMeta[]> {
  "use cache";
  cacheLife("minutes");
  const list = await orNull(api<{ n: number; title: string; badge: string | null }[]>(`/stories/${encodeURIComponent(slug)}/chapters`));
  return (list ?? []).map((c) => ({ n: c.n, title: c.title, badge: c.badge ?? undefined }));
}

export async function getChapter(slug: string, n: number): Promise<{ meta: ChapterMeta; blocks: Block[] } | undefined> {
  "use cache";
  cacheLife("minutes");
  const c = await orNull(api<{ n: number; title: string; badge: string | null; content: Block[] }>(`/stories/${encodeURIComponent(slug)}/chapters/${n}`));
  return c ? { meta: { n: c.n, title: c.title, badge: c.badge ?? undefined }, blocks: c.content } : undefined;
}

export async function getStoriesBy(handle: string): Promise<Story[]> {
  "use cache";
  cacheLife("minutes");
  const { items } = await api<{ items: ApiStory[] }>(`/stories?limit=50&sort=recientes&author=${encodeURIComponent(handle)}`);
  return items.map(toStory);
}

/** Autores con historias publicadas: para prerenderizar sus perfiles. */
export async function getAuthors(): Promise<string[]> {
  return Array.from(new Set((await getStories()).map((x) => x.author)));
}

export async function getAuthor(handle: string): Promise<Author | undefined> {
  "use cache";
  cacheLife("minutes");
  const p = await orNull(api<{ handle: string; name: string; bio: string }>(`/profiles/${encodeURIComponent(handle)}`));
  if (!p) return undefined;
  // Seguidores llegan cuando la API tenga "seguir".
  return { handle: p.handle, name: p.name, bio: p.bio || "Todavía no escribió su presentación.", followers: 0, following: 0, color: colorFor(p.handle) };
}

