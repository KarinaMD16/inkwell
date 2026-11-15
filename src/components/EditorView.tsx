"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Block, ChapterMeta, MyStory } from "@/lib/data";
import { useSession } from "./SessionProvider";
import { Book } from "./Book";
import { Icon, type IconName } from "./Icon";
import { Btn } from "./ui";

type Face = "redonda" | "novela" | "maquina";
type Ornament = "ninguno" | "sparkle" | "heart" | "moon";
type EBlock =
  | { id: number; type: "p"; text: string }
  | { id: number; type: "chat"; text: string }
  | { id: number; type: "post"; text: string }
  | { id: number; type: "ficha"; name: string; text: string }
  | { id: number; type: "interludio"; text: string };
interface Draft { title: string; face: Face; ornament: Ornament; blocks: EBlock[] }

const FACES: { id: Face; label: string }[] = [{ id: "redonda", label: "Redonda" }, { id: "novela", label: "Novela" }, { id: "maquina", label: "Máquina" }];
const ORNAMENTS: { id: Ornament; label: string; icon: IconName }[] = [
  { id: "ninguno", label: "Sin adorno", icon: "x" }, { id: "sparkle", label: "Destellos", icon: "sparkle" },
  { id: "heart", label: "Corazones", icon: "heart" }, { id: "moon", label: "Lunas", icon: "moon" },
];
const TEMPLATES: { type: EBlock["type"]; label: string; hint: string; icon: IconName }[] = [
  { type: "chat", label: "Chat", hint: "Mensajes entre personajes", icon: "chat" },
  { type: "post", label: "Post de red social", hint: "Publicación con respuestas", icon: "at" },
  { type: "ficha", label: "Ficha de personaje", hint: "Faceclaim, datos y descripción", icon: "idcard" },
  { type: "interludio", label: "Interludio", hint: "Una pausa con su propio formato", icon: "dash" },
];
const START: Draft = { title: "", face: "novela", ornament: "ninguno", blocks: [{ id: 1, type: "p", text: "" }] };

/** Pasa los bloques del editor al formato de la API. Los bloques vacíos no se envían. */
function toBlocks(blocks: EBlock[]): Block[] {
  return blocks.flatMap((b): Block[] => {
    const text = b.text.trim();
    if (b.type === "ficha") return b.name.trim() || text ? [{ type: "ficha", name: b.name.trim() || "Sin nombre", tags: [], text }] : [];
    if (!text) return [];
    if (b.type === "chat") {
      // Un mensaje por línea, "Quién: texto".
      const messages = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
        const cut = line.indexOf(":");
        return cut > 0 ? { who: line.slice(0, cut).trim(), text: line.slice(cut + 1).trim() } : { who: "", text: line };
      });
      return [{ type: "chat", title: "Chat", messages }];
    }
    if (b.type === "post") {
      const m = /^@?([^:\s]+):\s*([\s\S]*)$/.exec(text);
      return [m ? { type: "post", author: m[1], text: m[2] } : { type: "post", author: "", text }];
    }
    return [{ type: b.type, text }];
  });
}

export function EditorView({ story, chapters }: { story: MyStory; chapters: ChapterMeta[] }) {
  const key = `inkwell:borrador:${story.slug}`;
  const { token } = useSession();
  const [draft, setDraft] = useState<Draft>(START);
  const [savedAt, setSavedAt] = useState<string>("Sin cambios");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  /** Capítulo que se acaba de publicar, para enlazarlo. */
  const [publishedN, setPublishedN] = useState<number | null>(null);
  /** Capítulos ya en el servidor, contando borradores: el que se escribe es el siguiente. */
  const [count, setCount] = useState(story.totalChapters);

  async function publish() {
    if (busy) return;
    const title = draft.title.trim();
    const content = toBlocks(draft.blocks);
    if (!title) return setNotice("Ponle un título al capítulo antes de publicarlo.");
    if (content.length === 0) return setNotice("El capítulo está vacío: escribe al menos un párrafo.");
    if (!token) return setNotice("Tu sesión se cerró. Entra de nuevo para publicar; tu borrador sigue guardado aquí.");
    setBusy(true);
    setNotice("");
    try {
      const created = await api<{ n: number }>(`/stories/${story.slug}/chapters`, { method: "POST", token, body: JSON.stringify({ title, content, publish: true }) });
      try { localStorage.removeItem(key); } catch { /* nada */ }
      setDraft(START);
      setSavedAt("Publicado");
      setCount(created.n);
      setPublishedN(created.n);
    } catch (e) {
      setNotice(e instanceof ApiError ? `No se pudo publicar: ${e.message}` : "No se pudo publicar: no hay conexión con la API. Tu borrador sigue guardado aquí.");
    } finally {
      setBusy(false);
    }
  }

  // El borrador se guarda en este navegador hasta que lo publiques.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una vez al montar
      if (raw) setDraft(JSON.parse(raw));
    } catch { /* sin almacenamiento */ }
  }, [key]);
  function change(next: Draft) {
    setDraft(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setSavedAt("Guardado en este navegador"); } catch { setSavedAt("No se pudo guardar"); }
  }
  const setBlock = (id: number, patch: Partial<EBlock>) =>
    change({ ...draft, blocks: draft.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as EBlock) : b)) });
  const remove = (id: number) => change({ ...draft, blocks: draft.blocks.filter((b) => b.id !== id) });
  function add(type: EBlock["type"]) {
    const id = Math.max(0, ...draft.blocks.map((b) => b.id)) + 1;
    const block: EBlock = type === "ficha" ? { id, type, name: "", text: "" } : { id, type, text: "" };
    change({ ...draft, blocks: [...draft.blocks, block] });
  }
  const orn = ORNAMENTS.find((o) => o.id === draft.ornament)!;
  const placeholder: Record<EBlock["type"], string> = {
    p: "Sigue escribiendo…", chat: "Un mensaje por línea, así:\nLau: ¿Alguien más lo escuchó?", post: "@usuario: texto de la publicación",
    ficha: "Descripción del personaje", interludio: "Texto del interludio",
  };

  return (
    <div className="editor">
      <header className="reader__bar">
        <Link href="/escribir" className="reader__back">
          <Icon name="back" /><Book story={story} size="xs" />
          <span><strong>{story.title}</strong><span className="small muted">{savedAt}</span></span>
        </Link>
        <div className="row wrap">
          <Btn variant="ghost" size="sm" icon="calendar" onClick={() => setNotice("Programar la publicación todavía no existe en la API. Por ahora solo se puede publicar al momento.")}>Programar</Btn>
          <Btn size="sm" onClick={publish} disabled={busy}>{busy ? "Publicando…" : "Publicar"}</Btn>
        </div>
      </header>
      {notice && <div className="notice" role="status">{notice}</div>}
      {publishedN !== null && (
        <div className="notice" role="status">
          Capítulo {publishedN} publicado. <Link href={`/leer/${story.slug}/${publishedN}`}>Leerlo</Link>. Puede tardar un par de minutos en aparecer en las listas.
        </div>
      )}

      <div className="editor__body">
        <nav className="editor__chapters" aria-label="Capítulos">
          <div className="eyebrow">Capítulos</div>
          {chapters.map((c) => (
            <Link key={c.n} href={`/leer/${story.slug}/${c.n}`} className="chapterlink"><b>{c.n}</b>{c.title}</Link>
          ))}
          <span className="chapterlink is-on"><b>{count + 1}</b>{draft.title || "Sin título"}</span>
        </nav>

        <main className="editor__page">
          <div className="facet">
            <span className="eyebrow">Estilo del título</span>
            <div className="row wrap">
              {FACES.map((f) => (
                <button key={f.id} type="button" className={`tag title--${f.id}${draft.face === f.id ? " tag--pick" : ""}`} aria-pressed={draft.face === f.id} onClick={() => change({ ...draft, face: f.id })}>{f.label}</button>
              ))}
              <span className="divider" aria-hidden="true" />
              {ORNAMENTS.map((o) => (
                <button key={o.id} type="button" className={`tag tag--icon${draft.ornament === o.id ? " tag--pick" : ""}`} aria-label={o.label} aria-pressed={draft.ornament === o.id} onClick={() => change({ ...draft, ornament: o.id })}>
                  <Icon name={o.icon} size={18} />
                </button>
              ))}
            </div>
          </div>
          <div className="editor__title">
            {draft.ornament !== "ninguno" && <span className="deep"><Icon name={orn.icon} size={24} /></span>}
            <input className={`title--${draft.face}`} value={draft.title} onChange={(e) => change({ ...draft, title: e.target.value })} aria-label="Título del capítulo" placeholder="Título del capítulo" />
            {draft.ornament !== "ninguno" && <span className="deep"><Icon name={orn.icon} size={24} /></span>}
          </div>

          {draft.blocks.map((b) => (
            <div key={b.id} className={`eblock eblock--${b.type}`}>
              {b.type !== "p" && (
                <div className="row between">
                  <span className="eblock__label"><Icon name={TEMPLATES.find((t) => t.type === b.type)!.icon} size={18} />{TEMPLATES.find((t) => t.type === b.type)!.label}</span>
                  <button type="button" className="linkbtn" onClick={() => remove(b.id)}>Quitar</button>
                </div>
              )}
              {b.type === "ficha" && (
                <input className="eblock__name" value={b.name} onChange={(e) => setBlock(b.id, { name: e.target.value })} placeholder="Nombre del personaje" aria-label="Nombre del personaje" />
              )}
              <textarea
                spellCheck lang="es" rows={b.type === "p" ? 3 : 4} value={b.text} placeholder={placeholder[b.type]}
                aria-label={b.type === "p" ? "Párrafo" : TEMPLATES.find((t) => t.type === b.type)!.label}
                onChange={(e) => setBlock(b.id, { text: e.target.value })}
              />
            </div>
          ))}
          <div><Btn variant="ghost" icon="plus" onClick={() => add("p")}>Párrafo</Btn></div>
        </main>

        <aside className="editor__side" aria-label="Plantillas">
          <h2 className="h-sec">Plantillas</h2>
          {TEMPLATES.map((t) => (
            <button key={t.type} type="button" className="tpl" onClick={() => add(t.type)}>
              <span className="tpl__icon"><Icon name={t.icon} size={22} /></span>
              <span><strong>{t.label}</strong><span className="small muted">{t.hint}</span></span>
            </button>
          ))}
          <p className="hint"><Icon name="check" size={18} stroke={2.2} />La ortografía la revisa el corrector de tu navegador mientras escribes.</p>
        </aside>
      </div>
    </div>
  );
}
