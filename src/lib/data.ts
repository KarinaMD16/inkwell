// Datos de muestra del MVP. Todo lo que hoy sale de aquí debe venir después de la API
// (NestJS + Supabase). Las funciones get* son el único punto que hay que cambiar.

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
  | { type: "ficha"; name: string; tags: string[]; text: string };

export interface Author {
  handle: string;
  name: string;
  bio: string;
  followers: number;
  following: number;
  color: string;
}

const INK = "#14152B";
const PAPER = "#FFFBF8";

function s(
  slug: string, title: string, author: string, color: string, ink: string, art: Art, genre: string,
  tropes: string[], chapters: number, votes: number, reads: number, updatedDays: number, tagline: string,
  extra: Partial<Story> = {},
): Story {
  return {
    slug, title, author, color, ink, art, genre, tropes, chapters, votes, reads, updatedDays, tagline,
    fandom: "Original", warnings: [], rating: "+13", status: "En curso", format: "Narrativa",
    synopsis: [tagline], ...extra,
  };
}

export const stories: Story[] = [
  s("cartas-a-la-marea", "Cartas a la marea", "lunadesal", "#0F8B80", PAPER, "wave", "Romance", ["Slow burn", "Cartas"], 23, 4200, 51000, 1,
    "Una botella, una dirección equivocada y un verano que no termina."),
  s("grupo-los-de-siempre", "Grupo: los de siempre", "maru.escribe", "#F6C453", INK, "chat", "Amistad", ["Found family", "Humor"], 41, 9800, 120000, 2,
    "Seis amigos, un chat y demasiados audios de cuatro minutos.", { format: "Redes sociales", rating: "Todo público" }),
  s("el-ultimo-tren-a-cartago", "El último tren a Cartago", "nicoyano", INK, PAPER, "moon", "Misterio", ["Pueblo pequeño"], 12, 1100, 9400, 9,
    "El tren dejó de pasar en 1995. Anoche alguien lo escuchó.", { warnings: ["Violencia"], rating: "+16" }),
  s("mi-rival-de-la-orquesta", "Mi rival de la orquesta", "sol.en.do", "#DD5D4F", INK, "sun", "Romance", ["Enemies to lovers", "Slow burn", "Música"], 30, 12000, 86000, 2,
    "Dos violines, un solo atril y un concierto que ninguno piensa perder.", {
      relation: "Irene / Dani", warnings: ["Lenguaje fuerte"],
      synopsis: [
        "Irene lleva tres años como primer violín y no piensa ceder el puesto. Entonces llega Dani, con beca, sonrisa fácil y una manera de tocar que hace llorar a la directora.",
        "Les toca compartir atril hasta el concierto de fin de año. Ninguno de los dos sabe perder, y los ensayos son cada vez más largos.",
      ],
    }),
  s("dragones-de-papel", "Dragones de papel", "tinta.y.te", "#B9A5F0", INK, "dots", "Fantasía", ["Aventura", "Magia"], 18, 3400, 28000, 4,
    "Todo lo que Mei dibuja despierta. El problema es que no sabe dibujar puertas."),
  s("nadie-duerme-en-el-4b", "Nadie duerme en el 4B", "valemora", "#FF8FAB", INK, "stripes", "Terror", ["Comedia", "Fantasmas"], 9, 870, 18000, 20,
    "Alquiler barato, vecinos amables y un inquilino que murió en 1989.", { status: "Completa", format: "Con fichas" }),
  s("orbita-baja", "Órbita baja", "kepler_22", "#2EC4B6", INK, "sun", "Ciencia ficción", ["Espacio", "Amistad"], 15, 2000, 16000, 6,
    "La estación tiene aire para seis meses y siete tripulantes."),
  s("cafe-para-dos-sin-azucar", "Café para dos, sin azúcar", "andre.lee", "#FFD9A8", INK, "dots", "Romance", ["Slow burn", "Enemies to lovers"], 27, 6500, 47000, 3,
    "Ella odia el café. Él tiene la única cafetería abierta a las cinco de la mañana.", { rating: "Todo público" }),
  s("la-liga-de-los-suplentes", "La liga de los suplentes", "diez.y.medio", "#F28C38", INK, "stripes", "Deportes", ["Found family", "Fútbol"], 34, 5100, 39000, 5,
    "Nunca los ponen a jugar. Por eso tienen tiempo para todo lo demás.", { fandom: "Fútbol" }),
  s("manual-para-fantasmas-novatos", "Manual para fantasmas novatos", "ecto.plasma", "#D7F0EC", INK, "moon", "Humor", ["Fantasmas", "Comedia"], 11, 1900, 31000, 40,
    "Capítulo uno: atravesar paredes sin perder la dignidad.", { status: "Completa", rating: "Todo público" }),
  s("lo-que-dijo-el-coro", "Lo que dijo el coro", "estrofa.b", "#4B3B8F", PAPER, "wave", "Romance", ["Música", "AU"], 22, 7300, 64000, 2,
    "Un grupo, una gira y una canción que nadie admite haber escrito.", { fandom: "Música", warnings: ["Muerte de personaje"], rating: "+16" }),
  s("instrucciones-para-volver", "Instrucciones para volver", "marea.baja", "#1F3A5F", PAPER, "chat", "Drama", ["Familia", "Segundas oportunidades"], 16, 2600, 22000, 12,
    "Diez años fuera, una casa por vender y una hermana que no contesta."),
];

export const genres = ["Romance", "Fantasía", "Misterio", "Terror", "Ciencia ficción", "Amistad", "Humor", "Drama", "Deportes"];

export function getStories(): Story[] {
  return stories;
}
export function getStory(slug: string): Story | undefined {
  return stories.find((x) => x.slug === slug);
}

const featuredChapters: ChapterMeta[] = [
  { n: 1, title: "El atril del fondo" },
  { n: 2, title: "Afinación" },
  { n: 3, title: "Quién es quién", badge: "Fichas" },
  { n: 4, title: "Grupo de cuerdas (sin Dani)", badge: "Chat" },
  { n: 5, title: "Primera fila" },
  { n: 6, title: "Interludio: la directora", badge: "Interludio" },
  { n: 7, title: "Lo que no se ensaya" },
];

export function getChapters(slug: string): ChapterMeta[] {
  const story = getStory(slug);
  if (!story) return [];
  return Array.from({ length: story.chapters }, (_, i) => {
    const n = i + 1;
    if (slug === "mi-rival-de-la-orquesta" && featuredChapters[i]) return featuredChapters[i];
    return { n, title: `Capítulo ${n}` };
  });
}

/** Texto de muestra: el mismo capítulo para cualquier historia hasta conectar la API. */
export function getChapterBlocks(): Block[] {
  return [
    { type: "p", text: "El ensayo terminó veinte minutos tarde y nadie dijo nada, porque la directora había sonreído dos veces y eso, en esa sala, contaba como milagro." },
    { type: "p", comments: 14, text: "Irene guardó el violín despacio. A su lado, Dani ya tenía el estuche al hombro y silbaba el segundo movimiento, el mismo en el que ella había entrado medio compás antes." },
    { type: "p", text: "No la miró. Tampoco hacía falta. El silbido decía todo." },
    {
      type: "chat", title: "Cuerdas (sin Dani) · 5 participantes",
      messages: [
        { who: "Lau", text: "¿Alguien más escuchó ESE silbido?" },
        { who: "Tomás", text: "Lo escuchó hasta el timbalista" },
        { who: "Irene", text: "Fue medio compás. MEDIO.", me: true },
        { who: "Lau", text: "Irene, te queremos, pero fue un compás entero" },
      ],
    },
    { type: "p", comments: 6, text: "Apagó el teléfono y lo dejó boca abajo sobre el atril. Afuera llovía con esa lluvia fina que no moja hasta que ya es tarde." },
    { type: "p", text: "Mañana llegaría media hora antes. No para practicar la entrada, claro. Solo porque sí." },
  ];
}

// ----- Sesión de muestra -----
export const me = { name: "Vale", handle: "vale.lee", color: "#2EC4B6" };

/** Historias en curso de la persona: slug y capítulo por el que va. */
export const reading: { slug: string; chapter: number; offline: boolean }[] = [
  { slug: "cartas-a-la-marea", chapter: 7, offline: true },
  { slug: "grupo-los-de-siempre", chapter: 28, offline: true },
  { slug: "el-ultimo-tren-a-cartago", chapter: 1, offline: false },
  { slug: "dragones-de-papel", chapter: 9, offline: true },
  { slug: "nadie-duerme-en-el-4b", chapter: 8, offline: true },
  { slug: "cafe-para-dos-sin-azucar", chapter: 4, offline: false },
  { slug: "manual-para-fantasmas-novatos", chapter: 5, offline: true },
  { slug: "lo-que-dijo-el-coro", chapter: 16, offline: false },
  { slug: "orbita-baja", chapter: 2, offline: true },
  { slug: "instrucciones-para-volver", chapter: 9, offline: false },
  { slug: "la-liga-de-los-suplentes", chapter: 30, offline: false },
];
export const saved = ["mi-rival-de-la-orquesta", "orbita-baja", "la-liga-de-los-suplentes", "dragones-de-papel"];
export const finished = ["manual-para-fantasmas-novatos", "nadie-duerme-en-el-4b"];
export const lists = [
  { name: "Para llorar un domingo", slugs: ["cafe-para-dos-sin-azucar", "instrucciones-para-volver", "cartas-a-la-marea", "mi-rival-de-la-orquesta", "el-ultimo-tren-a-cartago"] },
];

/** Historias propias en el panel de escritura. */
export const myWorks: { slug: string; state: "Publicada" | "Programada" | "Borrador"; note: string }[] = [
  { slug: "nadie-duerme-en-el-4b", state: "Publicada", note: "9 capítulos · editada ayer" },
  { slug: "manual-para-fantasmas-novatos", state: "Programada", note: "11 capítulos · sale el jueves 8:00" },
  { slug: "instrucciones-para-volver", state: "Borrador", note: "2 capítulos · editada hace 1 semana" },
];

const bios: Record<string, Partial<Author>> = {
  "sol.en.do": { name: "Sol en Do", bio: "Escribo romances con música de fondo y finales que se hacen esperar. Actualizo los jueves.", followers: 8400, following: 112 },
  [me.handle]: { name: "Vale", bio: "Leo más de lo que duermo.", followers: 37, following: 64 },
};
const palette = ["#F6C453", "#FF8FAB", "#B9A5F0", "#2EC4B6", "#FFD9A8", "#D7F0EC"];

export function getAuthors(): string[] {
  return Array.from(new Set([...stories.map((x) => x.author), me.handle]));
}
export function getAuthor(handle: string): Author | undefined {
  const all = getAuthors();
  const i = all.indexOf(handle);
  if (i < 0) return undefined;
  return {
    handle, name: handle, bio: "Todavía no escribió su presentación.", followers: 120 + i * 310, following: 20 + i * 9,
    color: palette[i % palette.length], ...bios[handle],
  };
}
export function getStoriesBy(handle: string): Story[] {
  return stories.filter((x) => x.author === handle);
}

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
