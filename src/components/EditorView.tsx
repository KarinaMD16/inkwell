"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ChapterMeta, Story } from "@/lib/data";
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
const START: Draft = {
  title: "Quién vive aquí", face: "novela", ornament: "sparkle",
  blocks: [
    { id: 1, type: "p", text: "Antes de seguir, conviene que conozcas a los vecinos. No todos pagan alquiler y solo algunos están técnicamente vivos." },
    { id: 2, type: "ficha", name: "Doña Carmen", text: "Vive en el 2A desde 1974. Dejó de envejecer en 1989 y nadie se ha atrevido a preguntar." },
    { id: 3, type: "p", text: "La conocerás pronto. Ella ya te conoce a ti." },
  ],
};

export function EditorView({ story, chapters }: { story: Story; chapters: ChapterMeta[] }) {
  const key = `inkwell:borrador:${story.slug}`;
  const [draft, setDraft] = useState<Draft>(START);
  const [savedAt, setSavedAt] = useState<string>("Sin cambios");
  const [notice, setNotice] = useState("");

  // Mientras no haya API, el borrador se guarda en este navegador.
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
          <Btn variant="ghost" size="sm" icon="calendar" onClick={() => setNotice("Programar la publicación necesita la API, que aún no está conectada.")}>Programar</Btn>
          <Btn size="sm" onClick={() => setNotice("Publicar necesita la API, que aún no está conectada. Tu borrador sigue guardado aquí.")}>Publicar</Btn>
        </div>
      </header>
      {notice && <div className="notice" role="status">{notice}</div>}

      <div className="editor__body">
        <nav className="editor__chapters" aria-label="Capítulos">
          <div className="eyebrow">Capítulos</div>
          {chapters.slice(0, 5).map((c, i) => (
            <span key={c.n} className={`chapterlink${i === 3 ? " is-on" : ""}`}><b>{c.n}</b>{i === 3 ? draft.title || "Sin título" : c.title}</span>
          ))}
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
