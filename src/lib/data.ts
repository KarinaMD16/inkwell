// Tipos del dominio y utilidades. Sirve tanto en el servidor como en el navegador.
// La lectura de la API vive en queries.ts; lo que sigue de muestra está marcado abajo.

export type Art = "wave" | "chat" | "moon" | "sun" | "dots" | "stripes";
export type Rating = "Todo público" | "+13" | "+16" | "+18";
export type Status = "En curso" | "En pausa" | "Completa";
export type Kind = "Original" | "Fanfic" | "Poesía" | "No ficción";
export type Format = "Narrativa" | "Redes sociales" | "Con fichas";

export interface Story {
  slug: string;
  title: string;
  author: string;
  /** Color de portada y de lomo. Con portadas subidas se calculará de la imagen. */
  color: string;
  /** Color del texto sobre la portada generada. */
  ink: string;
  art: Art;
  /** URL de la portada subida por el autor. Si falta, se genera una tipográfica. */
  cover?: string;
  kind: Kind;
  /** Género principal: el que se ve en la tarjeta. */
  genre: string;
  subgenres: string[];
  fandom: string;
  relation?: string;
  characters: string[];
  tropes: string[];
  warnings: string[];
  /** Etiquetas libres. */
  tags: string[];
  rating: Rating;
  status: Status;
  format: Format;
  license: string;
  chapters: number;
  votes: number;
  reads: number;
  updatedDays: number;
  tagline: string;
  synopsis: string[];
}

export type TitleFace = "redonda" | "novela" | "maquina";
export type TitleOrnament = "ninguno" | "sparkle" | "heart" | "moon";
/** Tipografía y adorno del título de un capítulo. El título en sí es texto normal. */
export interface TitleStyle { face: TitleFace; ornament: TitleOrnament }

export interface ChapterMeta {
  n: number;
  title: string;
  badge?: string;
  titleStyle?: TitleStyle;
}

/** Formato dentro de un párrafo: [inicio, fin, negrita | cursiva | subrayado], contando caracteres de `text`. */
export type MarkKind = "b" | "i" | "u";
export type Mark = [start: number, end: number, kind: MarkKind];
export type Align = "left" | "center" | "right" | "justify";

export type Block =
  | { type: "p"; text: string; align?: Align; marks?: Mark[]; comments?: number }
  | { type: "chat"; title: string; messages: { who: string; text: string; me?: boolean }[] }
  | { type: "post"; author: string; text: string }
  | { type: "ficha"; name: string; tags: string[]; text: string }
  | { type: "interludio"; text: string };

export interface Author {
  handle: string;
  name: string;
  bio: string;
  link: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  /** Cuándo se unió (ISO). */
  joined: string;
  followers: number;
  following: number;
  color: string;
}

// Catálogos. La API valida contra las mismas listas (inkwell-backend, stories.schemas.ts): si cambias una, cambia la otra.
export const genres = ["Romance", "Fantasía", "Misterio", "Terror", "Ciencia ficción", "Aventura", "Amistad", "Humor", "Drama", "Paranormal", "Histórica", "Deportes"];
export const kinds: Kind[] = ["Original", "Fanfic", "Poesía", "No ficción"];
export const ratings: Rating[] = ["Todo público", "+13", "+16", "+18"];
export const statuses: Status[] = ["En curso", "En pausa", "Completa"];
export const licenses = ["Todos los derechos reservados", "CC BY", "CC BY-NC", "CC BY-NC-ND", "Dominio público"];

/** Una historia tal como la entrega la API. */
export interface ApiStory {
  slug: string; title: string; author: string; tagline: string; synopsis: string; cover: string | null;
  color: string; ink: string; art: Art; kind: Kind; genre: string; subgenres: string[]; fandom: string; relation: string | null;
  characters: string[]; tropes: string[]; warnings: string[]; tags: string[]; rating: Rating; status: Status; format: Format; license: string;
  reads: number; updatedAt: string; chapters: number; votes: number;
}

/** Adapta la respuesta de la API al tipo que usan las pantallas. */
export function toStory(a: ApiStory): Story {
  const paragraphs = a.synopsis.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return {
    ...a,
    cover: a.cover ?? undefined,
    relation: a.relation ?? undefined,
    synopsis: paragraphs.length ? paragraphs : [a.tagline],
    updatedDays: Math.max(0, Math.floor((Date.now() - Date.parse(a.updatedAt)) / 86_400_000)),
  };
}

/**
 * Una historia propia: incluye si ya es pública, cuántos capítulos tiene contando borradores y,
 * si moderación la retiró, cuándo y por qué.
 */
export interface MyStory extends Story { published: boolean; totalChapters: number; removedAt: string | null; removedReason: string | null }
export type ApiMyStory = ApiStory & { published: boolean; totalChapters: number; removedAt?: string | null; removedReason?: string | null };

export function toMyStory(a: ApiMyStory): MyStory {
  return { ...toStory(a), published: a.published, totalChapters: a.totalChapters, removedAt: a.removedAt ?? null, removedReason: a.removedReason ?? null };
}

export type ChapterState = "borrador" | "programado" | "publicado";
/** Un capítulo visto por quien lo escribe. `n` cuenta borradores; quien lee ve otra numeración. */
export interface MyChapter {
  id: string; n: number; title: string; badge: string | null; words: number;
  publishedAt: string | null; updatedAt: string; state: ChapterState;
}
export interface MyChapterFull extends MyChapter { titleStyle: TitleStyle | null; content: Block[] }
/** Una historia propia con todos sus capítulos: lo que usa la pantalla de gestión y el editor. */
export interface ManagedStory extends MyStory { chapterList: MyChapter[] }
export type ApiManagedStory = ApiMyStory & { chapterList: MyChapter[] };

export function toManaged(a: ApiManagedStory): ManagedStory {
  return { ...toMyStory(a), chapterList: a.chapterList };
}

/** Una historia se ve cuando su autora la publicó, ya tiene al menos un capítulo fuera y moderación no la retiró. */
export function isVisible(s: MyStory): boolean {
  return s.published && s.chapters > 0 && !s.removedAt;
}

export const stateLabel: Record<ChapterState, string> = { borrador: "Borrador", programado: "Programado", publicado: "Publicado" };

/** "16 nov, 3:40 p. m." */
export function whenLabel(iso: string): string {
  return new Date(iso).toLocaleString("es", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

const palette = ["#F6C453", "#FF8FAB", "#B9A5F0", "#2EC4B6", "#FFD9A8", "#D7F0EC"];

/** Color estable por nombre de usuario, para avatares sin foto. */
export function colorFor(handle: string): string {
  let h = 0;
  for (const ch of handle) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

// ----- Todavía de muestra (la API aún no los tiene) -----

/** Una lista pública de ejemplo para el librero. */
export const lists = [
  { name: "Para llorar un domingo", slugs: ["cafe-para-dos-sin-azucar", "instrucciones-para-volver", "cartas-a-la-marea", "mi-rival-de-la-orquesta", "el-ultimo-tren-a-cartago"] },
];

export const notifications = [
  { who: "lunadesal", text: "Cartas a la marea tiene capítulo nuevo: el 8", when: "Hace 20 min", unread: true, href: "/historia/cartas-a-la-marea" },
  { who: "maru.escribe", text: "@maru.escribe comentó tu capítulo 3", when: "Hace 1 h", unread: true, href: "/historia/nadie-duerme-en-el-4b" },
  { who: "kepler_22", text: "@kepler_22 empezó a seguirte", when: "Hace 3 h", unread: false, href: "/perfil/kepler_22" },
  { who: "sol.en.do", text: "@sol.en.do respondió tu comentario", when: "Ayer", unread: false, href: "/historia/mi-rival-de-la-orquesta" },
  { who: "valemora", text: "Tu capítulo programado ya se publicó", when: "Ayer", unread: false, href: "/escribir" },
  { who: "tinta.y.te", text: "@tinta.y.te guardó tu historia en una lista", when: "Hace 2 días", unread: false, href: "/perfil/tinta.y.te" },
];

// ----- Utilidades -----
export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",").replace(",0", "")} M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",").replace(",0", "")} k`;
  return String(n);
}
export function updatedLabel(days: number): string {
  if (days < 1) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  return `hace ${Math.round(days / 30)} mes${days >= 60 ? "es" : ""}`;
}
export function lengthOf(story: Story): "Corta" | "Media" | "Larga" {
  return story.chapters < 15 ? "Corta" : story.chapters <= 30 ? "Media" : "Larga";
}
export function pct(chapter: number, total: number): number {
  return Math.round((chapter / total) * 100);
}
