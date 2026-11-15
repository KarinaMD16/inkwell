// Tipos del dominio y utilidades. Sirve tanto en el servidor como en el navegador.
// La lectura de la API vive en queries.ts; lo que sigue de muestra está marcado abajo.

export type Art = "wave" | "chat" | "moon" | "sun" | "dots" | "stripes";
export type Rating = "Todo público" | "+13" | "+16" | "+18";
export type Status = "En curso" | "Completa";
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
  genre: string;
  fandom: string;
  relation?: string;
  tropes: string[];
  warnings: string[];
  rating: Rating;
  status: Status;
  format: Format;
  chapters: number;
  votes: number;
  reads: number;
  updatedDays: number;
  tagline: string;
  synopsis: string[];
}

export interface ChapterMeta {
  n: number;
  title: string;
  badge?: string;
}

export type Block =
  | { type: "p"; text: string; comments?: number }
  | { type: "chat"; title: string; messages: { who: string; text: string; me?: boolean }[] }
  | { type: "post"; author: string; text: string }
  | { type: "ficha"; name: string; tags: string[]; text: string }
  | { type: "interludio"; text: string };

export interface Author {
  handle: string;
  name: string;
  bio: string;
  followers: number;
  following: number;
  color: string;
}

export const genres = ["Romance", "Fantasía", "Misterio", "Terror", "Ciencia ficción", "Amistad", "Humor", "Drama", "Deportes"];

/** Una historia tal como la entrega la API. */
export interface ApiStory {
  slug: string; title: string; author: string; tagline: string; synopsis: string; cover: string | null;
  color: string; ink: string; art: Art; genre: string; fandom: string; relation: string | null;
  tropes: string[]; warnings: string[]; rating: Rating; status: Status; format: Format;
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

/** Una historia propia: incluye si ya es pública y cuántos capítulos tiene contando borradores. */
export interface MyStory extends Story { published: boolean; totalChapters: number }

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
  if (days <= 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  return `hace ${Math.round(days / 30)} mes${days >= 60 ? "es" : ""}`;
}
export function lengthOf(story: Story): "Corta" | "Media" | "Larga" {
  return story.chapters < 15 ? "Corta" : story.chapters <= 30 ? "Media" : "Larga";
}
export function pct(chapter: number, total: number): number {
  return Math.round((chapter / total) * 100);
}
