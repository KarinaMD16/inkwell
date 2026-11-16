"use client";

import { EditorContent } from "@tiptap/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { refreshStory } from "@/app/actions";
import { api } from "@/lib/api";
import { stateLabel, whenLabel, type Block, type ManagedStory, type MyChapter, type MyChapterFull, type TitleFace, type TitleOrnament } from "@/lib/data";
import { countWords } from "@/lib/richtext";
import { problem } from "@/lib/story";
import { useSession } from "./SessionProvider";
import { Book } from "./Book";
import { Icon, type IconName } from "./Icon";
import { NewChapterButton } from "./NewChapterButton";
import { FormatBar, insertTemplate, TEMPLATES, useChapterEditor } from "./RichEditor";
import { Btn } from "./ui";

interface Draft { title: string; face: TitleFace; ornament: TitleOrnament; blocks: Block[] }

const FACES: { id: TitleFace; label: string }[] = [{ id: "redonda", label: "Redonda" }, { id: "novela", label: "Novela" }, { id: "maquina", label: "Máquina" }];
const ORNAMENTS: { id: TitleOrnament; label: string; icon: IconName }[] = [
  { id: "ninguno", label: "Sin adorno", icon: "x" }, { id: "sparkle", label: "Destellos", icon: "sparkle" },
  { id: "heart", label: "Corazones", icon: "heart" }, { id: "moon", label: "Lunas", icon: "moon" },
];
/** Cuánto espera el autoguardado después de la última tecla. */
const AUTOSAVE_MS = 2000;
type SaveStatus = "limpio" | "pendiente" | "guardando" | "guardado" | "error";
const STATUS: Record<SaveStatus, string> = {
  limpio: "Sin cambios", pendiente: "Cambios sin guardar", guardando: "Guardando…", guardado: "Guardado en tu cuenta", error: "No se pudo guardar",
};

function toDraft(chapter: MyChapterFull): Draft {
  return {
    title: chapter.title === "Sin título" ? "" : chapter.title,
    face: chapter.titleStyle?.face ?? "novela", ornament: chapter.titleStyle?.ornament ?? "ninguno", blocks: chapter.content,
  };
}

/** Lo que quedó sin guardar la última vez (se cerró la pestaña, se cayó la red), si hay algo. */
function readBackup(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null; // sin almacenamiento o copia dañada: se usa lo de la cuenta
  }
}

export function EditorView({ story, chapter }: { story: ManagedStory; chapter: MyChapterFull }) {
  const backup = `inkwell:borrador:${story.slug}:${chapter.id}`;
  const base = `/me/stories/${story.slug}/chapters/${chapter.id}`;
  const router = useRouter();
  const { token } = useSession();
  const [recovered] = useState(() => readBackup(backup));
  const [draft, setDraft] = useState<Draft>(() => recovered ?? toDraft(chapter));
  const [live, setLive] = useState({ state: chapter.state, publishedAt: chapter.publishedAt });
  const [status, setStatus] = useState<SaveStatus>(recovered ? "pendiente" : "limpio");
  const [notice, setNotice] = useState(recovered ? "Recuperamos cambios de este capítulo que no se habían guardado en tu cuenta. Guárdalos para conservarlos." : "");
  const [busy, setBusy] = useState(false);
  /** Fecha elegida en "Programar"; null cuando el panel está cerrado. */
  const [at, setAt] = useState<string | null>(null);

  // El guardado corre fuera del ciclo de pintado (temporizador, salir de la página): lee de aquí lo último.
  const latest = useRef({ draft, token, dirty: Boolean(recovered), autosave: chapter.state !== "publicado" });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlight = useRef<Promise<boolean> | null>(null);
  useEffect(() => { latest.current.token = token; }, [token]);
  useEffect(() => { latest.current.autosave = live.state !== "publicado"; }, [live.state]);
  useEffect(() => () => clearTimeout(timer.current), []);

  /** Guarda lo último en la cuenta. Devuelve si quedó guardado. */
  async function save(): Promise<boolean> {
    clearTimeout(timer.current);
    if (inFlight.current) await inFlight.current;
    const now = latest.current;
    if (!now.dirty) return true;
    if (!now.token) {
      setStatus("error");
      setNotice("Tu sesión se cerró. Entra de nuevo; lo que escribiste sigue guardado en este navegador.");
      return false;
    }
    now.dirty = false;
    setStatus("guardando");
    const { title, face, ornament, blocks } = now.draft;
    const run = api(base, { method: "PATCH", token: now.token, body: JSON.stringify({ title: title.trim(), titleStyle: { face, ornament }, content: blocks }) })
      .then(() => {
        // Si se escribió algo mientras viajaba la petición, todavía falta guardar eso.
        if (latest.current.dirty) setStatus("pendiente");
        else {
          setStatus("guardado");
          try { localStorage.removeItem(backup); } catch { /* nada */ }
        }
        return true;
      })
      .catch((err: unknown) => {
        latest.current.dirty = true;
        setStatus("error");
        setNotice(`${problem(err, "guardar")} Lo que escribiste sigue en este navegador.`);
        return false;
      })
      .finally(() => { inFlight.current = null; });
    inFlight.current = run;
    return run;
  }

  function change(patch: Partial<Draft>) {
    const next = { ...latest.current.draft, ...patch };
    latest.current.draft = next;
    latest.current.dirty = true;
    setDraft(next);
    setStatus("pendiente");
    try { localStorage.setItem(backup, JSON.stringify(next)); } catch { /* sin almacenamiento: queda el autoguardado */ }
    clearTimeout(timer.current);
    // Un capítulo ya publicado no se autoguarda: cada guardado lo verían quienes leen.
    if (latest.current.autosave) timer.current = setTimeout(() => void save(), AUTOSAVE_MS);
  }
  const editor = useChapterEditor(draft.blocks, (blocks) => change({ blocks }));

  /** Publica ahora o, con fecha, programa. Antes guarda lo que falte. */
  async function publish(when?: Date) {
    if (busy) return;
    if (!draft.title.trim()) return setNotice("Ponle un título al capítulo antes de publicarlo.");
    if (draft.blocks.length === 0) return setNotice("El capítulo está vacío: escribe algo antes de publicarlo.");
    setBusy(true);
    setNotice("");
    try {
      if (!(await save())) return;
      const saved = await api<MyChapter>(`${base}/publish`, { method: "POST", token, body: JSON.stringify(when ? { at: when.toISOString() } : {}) });
      setLive({ state: saved.state, publishedAt: saved.publishedAt });
      setAt(null);
      void refreshStory(story.slug);
    } catch (err) {
      setNotice(problem(err, when ? "programar" : "publicar"));
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const saved = await api<MyChapter>(`${base}/unpublish`, { method: "POST", token, body: "{}" });
      setLive({ state: saved.state, publishedAt: saved.publishedAt });
      void refreshStory(story.slug);
    } catch (err) {
      setNotice(problem(err, "volver a borrador"));
    } finally {
      setBusy(false);
    }
  }

  /** Guardar los cambios de un capítulo que ya está publicado. */
  async function update() {
    if (busy) return;
    setBusy(true);
    setNotice("");
    if (await save()) void refreshStory(story.slug);
    setBusy(false);
  }

  /** Antes de salir se guarda el borrador, para que la lista de capítulos ya lo muestre al día. */
  async function leave() {
    if (live.state !== "publicado") await save();
    router.push(`/escribir/${story.slug}`);
  }

  const orn = ORNAMENTS.find((o) => o.id === draft.ornament)!;
  const unsaved = status === "pendiente" || status === "error";
  const words = countWords(draft.blocks);

  return (
    <div className="editor">
      <header className="reader__bar">
        <button type="button" className="reader__back" onClick={() => void leave()} aria-label={`Volver a los capítulos de ${story.title}`}>
          <Icon name="back" /><Book story={story} size="xs" />
          <span><strong>{story.title}</strong><span className="small muted" role="status">{stateLabel[live.state]} · {STATUS[status]}</span></span>
        </button>
        <div className="row wrap">
          {live.state === "borrador" && (
            <>
              <Btn variant="ghost" size="sm" disabled={busy || !unsaved} onClick={() => void save()}>Guardar borrador</Btn>
              <Btn variant="ghost" size="sm" icon="calendar" ariaPressed={at !== null} onClick={() => setAt(at === null ? "" : null)}>Programar</Btn>
              <Btn size="sm" onClick={() => void publish()} disabled={busy}>{busy ? "Publicando…" : "Publicar"}</Btn>
            </>
          )}
          {live.state === "programado" && (
            <>
              <Btn variant="ghost" size="sm" disabled={busy} onClick={() => void unpublish()}>Cancelar fecha</Btn>
              <Btn size="sm" onClick={() => void publish()} disabled={busy}>Publicar ahora</Btn>
            </>
          )}
          {live.state === "publicado" && (
            <>
              <Btn variant="ghost" size="sm" disabled={busy} onClick={() => void unpublish()}>Volver a borrador</Btn>
              <Btn size="sm" onClick={() => void update()} disabled={busy || !unsaved}>{status === "guardando" ? "Guardando…" : "Guardar cambios"}</Btn>
            </>
          )}
        </div>
      </header>
      {at !== null && live.state === "borrador" && (
        <form className="notice row wrap" onSubmit={(e) => { e.preventDefault(); if (at) void publish(new Date(at)); }}>
          <label className="row"><strong>Publicar el</strong>
            <input type="datetime-local" className="input" style={{ width: "auto", minHeight: 44 }} value={at} onChange={(e) => setAt(e.target.value)} required />
          </label>
          <Btn type="submit" size="sm" disabled={busy || !at}>Programar</Btn>
          <span className="muted small">Hora de tu dispositivo. Hasta entonces nadie lo ve.</span>
        </form>
      )}
      {notice && <div className="notice notice--error" role="alert">{notice}</div>}
      {live.state === "programado" && live.publishedAt && <div className="notice" role="status">Programado: sale el {whenLabel(live.publishedAt)}. Lo que cambies hasta entonces se guarda solo.</div>}
      {live.state === "publicado" && (
        <div className="notice" role="status">
          Este capítulo ya está publicado. <Link href={`/historia/${story.slug}`}>Ver la historia</Link>. Lo que cambies aquí se ve cuando tocas «Guardar cambios».
        </div>
      )}

      <div className="editor__body">
        <nav className="editor__chapters" aria-label="Capítulos">
          <div className="eyebrow">Capítulos</div>
          {story.chapterList.map((c) => c.id === chapter.id ? (
            <span key={c.id} className="chapterlink is-on" aria-current="page"><b>{c.n}</b><span>{draft.title || "Sin título"}</span></span>
          ) : (
            <Link key={c.id} href={`/editor/${story.slug}?cap=${c.id}`} className="chapterlink" onClick={() => { if (live.state !== "publicado") void save(); }}>
              <b>{c.n}</b><span>{c.title}</span>{c.state !== "publicado" && <span className="chapterlink__state">{stateLabel[c.state]}</span>}
            </Link>
          ))}
          <NewChapterButton slug={story.slug} variant="ghost" size="sm" before={live.state !== "publicado" ? save : undefined}>Nuevo capítulo</NewChapterButton>
        </nav>

        <main className="editor__page">
          <div className="editor__title">
            {draft.ornament !== "ninguno" && <span className="deep"><Icon name={orn.icon} size={24} /></span>}
            <input
              className={`title--${draft.face}`} value={draft.title} maxLength={120} aria-label="Título del capítulo" placeholder="Título del capítulo"
              onChange={(e) => change({ title: e.target.value })}
              // Enter en el título baja al texto, como en un documento.
              onKeyDown={(e) => { if (e.key === "Enter" && editor) { e.preventDefault(); editor.view.dom.focus(); editor.commands.focus("start"); } }}
            />
            {draft.ornament !== "ninguno" && <span className="deep"><Icon name={orn.icon} size={24} /></span>}
          </div>
          <FormatBar editor={editor} />
          <EditorContent editor={editor} className="editor__sheet" />
          <span className="muted small">{words.toLocaleString("es")} {words === 1 ? "palabra" : "palabras"}</span>
        </main>

        <aside className="editor__side" aria-label="Opciones del capítulo">
          <h2 className="h-sec">Título</h2>
          <div className="row wrap">
            {FACES.map((f) => (
              <button key={f.id} type="button" className={`tag title--${f.id}${draft.face === f.id ? " tag--pick" : ""}`} aria-pressed={draft.face === f.id} onClick={() => change({ face: f.id })}>{f.label}</button>
            ))}
          </div>
          <div className="row wrap">
            {ORNAMENTS.map((o) => (
              <button key={o.id} type="button" className={`tag tag--icon${draft.ornament === o.id ? " tag--pick" : ""}`} aria-label={o.label} aria-pressed={draft.ornament === o.id} onClick={() => change({ ornament: o.id })}>
                <Icon name={o.icon} size={18} />
              </button>
            ))}
          </div>

          <h2 className="h-sec" style={{ marginTop: 16 }}>Plantillas</h2>
          <span className="muted small">Se insertan donde está el cursor.</span>
          {TEMPLATES.map((t) => (
            <button key={t.type} type="button" className="tpl" disabled={!editor} onClick={() => editor && insertTemplate(editor, t.type)}>
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
