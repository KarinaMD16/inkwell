"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { refreshStory } from "@/app/actions";
import { api } from "@/lib/api";
import { fmt, isVisible, stateLabel, statuses, whenLabel, type ManagedStory, type MyChapter, type Status } from "@/lib/data";
import { problem } from "@/lib/story";
import { useAuthHref } from "@/lib/useAuthHref";
import { useManagedStory } from "@/lib/useManagedStory";
import { Book } from "./Book";
import { Icon } from "./Icon";
import { ImportPanel } from "./ImportPanel";
import { NewChapterButton } from "./NewChapterButton";
import { useSession } from "./SessionProvider";
import { WorksSkeleton } from "./Skeleton";
import { StoryForm } from "./StoryForm";
import { Btn, Chip } from "./ui";

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="empty"><h1 className="h-sec">{title}</h1>{children}</div>;
}

function visibility(story: ManagedStory): { label: string; tone: "tint" | "lilac" | "sand" } {
  if (story.removedAt) return { label: "Retirada", tone: "sand" };
  if (isVisible(story)) return { label: "Publicada", tone: "tint" };
  if (!story.published && story.chapterList.some((c) => c.state === "publicado")) return { label: "Escondida", tone: "sand" };
  return { label: "Borrador", tone: "lilac" };
}

function when(c: MyChapter): string {
  if (c.state === "programado" && c.publishedAt) return `Sale el ${whenLabel(c.publishedAt)}`;
  if (c.state === "publicado" && c.publishedAt) return `Publicado el ${whenLabel(c.publishedAt)}`;
  return `Editado el ${whenLabel(c.updatedAt)}`;
}

/**
 * La mesa de trabajo de una historia. Arriba, lo esencial del libro (portada, título, sinopsis,
 * género); abajo, sus capítulos con su estado, su orden y sus acciones, y la importación desde
 * Word. Aquí se llega después de crearla. Los detalles completos se editan en una vista aparte.
 */
export function StoryManager() {
  const auth = useAuthHref();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const params = useSearchParams();
  const { token } = useSession();
  const { loaded, signedIn, story, error, setStory, update, refresh } = useManagedStory(slug);
  // La vista sale de la dirección (?vista=detalles), no de un estado: así cada enlace abre la suya
  // aunque Next conserve esta pantalla entre una visita y otra.
  const view = params.get("vista") === "detalles" ? "detalles" : "capitulos";
  /** Qué se está guardando ahora mismo: "estado", "pub:<id>", "del:<id>"… Solo eso muestra espera; el resto sigue usable. */
  const [pending, setPending] = useState<string[]>([]);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [notice, setNotice] = useState(params.get("aviso") === "portada" ? "La historia se creó, pero la portada no se pudo subir. Inténtalo de nuevo en Detalles." : "");
  /** Lo que espera una segunda confirmación antes de borrarse: el id de un capítulo o "historia". */
  const [confirming, setConfirming] = useState<string | null>(null);

  if (!loaded) return <WorksSkeleton />;
  if (!signedIn) return <Message title="Entra para gestionar tu historia"><p className="muted">Tus historias y borradores viven en tu cuenta.</p><Btn href={auth.entrar}>Entrar</Btn></Message>;
  if (error === "api") return <Message title="No pudimos abrir la historia"><p className="muted">Revisa que la API esté encendida y recarga.</p></Message>;
  if (!story) return <Message title="Esta historia no es tuya o no existe"><p className="muted">Solo quien la escribe puede gestionarla.</p><Btn href="/escribir">Mis historias</Btn></Message>;

  const list = story.chapterList;
  const base = `/me/stories/${story.slug}`;
  const seen = visibility(story);
  const drafts = list.filter((c) => c.state === "borrador").length;

  const busy = (key: string) => pending.includes(key);
  /** Confirma en pocas palabras lo que acaba de pasar. */
  function say(text: string) {
    setToast((t) => ({ id: (t?.id ?? 0) + 1, text }));
    window.setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 2600);
  }

  /**
   * Toda acción de esta pantalla responde en tres tiempos, para que nunca parezca que no pasó nada:
   * 1. al toque: el cambio se ve de inmediato (`now`) o el botón tocado dice qué está haciendo;
   * 2. se guarda en la API sin bloquear lo demás;
   * 3. un aviso corto confirma (`done`). Si falla, se explica y la pantalla vuelve a lo guardado.
   */
  async function act(key: string, o: { doing: string; done: string; now?: (s: ManagedStory) => ManagedStory; send: (auth: string) => Promise<unknown> }) {
    if (busy(key)) return;
    if (!token) return setNotice("Tu sesión se cerró. Entra de nuevo.");
    setNotice("");
    setConfirming(null);
    setPending((p) => [...p, key]);
    if (o.now) update(o.now);
    try {
      await o.send(token);
      if (!o.now) await refresh();
      say(o.done);
      void refreshStory(slug);
    } catch (err) {
      setNotice(problem(err, o.doing));
      await refresh();
    } finally {
      setPending((p) => p.filter((k) => k !== key));
    }
  }
  const post = (path: string) => (auth: string) => api(`${base}${path}`, { method: "POST", token: auth, body: "{}" });
  const patch = (body: object) => (auth: string) => api(base, { method: "PATCH", token: auth, body: JSON.stringify(body) });
  const renumber = (chapters: MyChapter[]) => chapters.map((c, i) => ({ ...c, n: i + 1 }));

  function setStatus(status: Status) {
    if (story?.status === status) return;
    void act("estado", { doing: "cambiar el estado", done: `Estado guardado: ${status.toLowerCase()}`, now: (s) => ({ ...s, status }), send: patch({ status }) });
  }
  function move(i: number, by: -1 | 1) {
    const next = [...list];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    const ids = next.map((c) => c.id);
    // La clave lleva el orden: se puede seguir moviendo mientras se guarda el movimiento anterior.
    void act(`orden:${ids.join()}`, {
      doing: "reordenar", done: "Orden guardado", now: (s) => ({ ...s, chapterList: renumber(next) }),
      send: (auth) => api(`${base}/chapters/order`, { method: "PUT", token: auth, body: JSON.stringify({ ids }) }),
    });
  }
  const publish = (c: MyChapter) => act(`pub:${c.id}`, { doing: "publicar", done: story?.chapters ? "Capítulo publicado" : "Capítulo publicado: tu historia ya se puede leer", send: post(`/chapters/${c.id}/publish`) });
  const unpublish = (c: MyChapter) => act(`unpub:${c.id}`, { doing: "volver a borrador", done: "Capítulo de vuelta en borrador", send: post(`/chapters/${c.id}/unpublish`) });
  const removeChapter = (c: MyChapter) => act(`del:${c.id}`, {
    doing: "borrar el capítulo", done: "Capítulo borrado",
    now: (s) => { const rest = renumber(s.chapterList.filter((x) => x.id !== c.id)); return { ...s, chapterList: rest, totalChapters: rest.length, chapters: rest.filter((x) => x.state === "publicado").length }; },
    send: (auth) => api(`${base}/chapters/${c.id}`, { method: "DELETE", token: auth }),
  });
  const setVisible = (published: boolean) => act("visible", { doing: "cambiar la visibilidad", done: published ? "La historia vuelve a verse" : "Historia escondida", now: (s) => ({ ...s, published }), send: patch({ published }) });

  async function removeStory() {
    if (busy("historia") || !token) return;
    setPending((p) => [...p, "historia"]);
    try {
      await api(base, { method: "DELETE", token });
      void refreshStory(slug);
      router.push("/escribir");
    } catch (err) {
      setNotice(problem(err, "eliminar la historia"));
      setPending((p) => p.filter((k) => k !== "historia"));
    }
  }
  const hasLive = list.some((c) => c.state !== "borrador");

  return (
    <div className="stack-lg">
      {view === "capitulos" ? (
        <Link href="/escribir" className="textlink"><Icon name="back" size={18} />Mis historias</Link>
      ) : (
        <Link href={`/escribir/${story.slug}`} className="textlink"><Icon name="back" size={18} />Capítulos de {story.title}</Link>
      )}

      {/* Los detalles son una vista propia: sin el resumen encima, se nota de inmediato dónde estás. */}
      {view === "detalles" && <div><h1 className="h-hero">Detalles de la historia</h1></div>}
      {view === "capitulos" && (
      <section className="desk desk--write workhead">
        <Book story={story} size="m" />
        <div className="desk__now">
          <div className="row wrap">
            <Chip tone={seen.tone}>{seen.label}</Chip>
            <Chip tone="white">{story.genre}</Chip>
            {story.subgenres.map((g) => <Chip key={g} tone="white">{g}</Chip>)}
            {story.kind !== "Original" && <Chip tone="white">{story.kind === "Fanfic" ? `Fanfic · ${story.fandom}` : story.kind}</Chip>}
            <Chip tone="white">{story.rating}</Chip>
          </div>
          <h1 className="h-page">{story.title}</h1>
          <p className="workhead__synopsis">{story.synopsis.join(" ") || "Todavía no tiene sinopsis."}</p>
          <span className="meta">
            <span><Icon name="list" size={16} />{story.chapters} {story.chapters === 1 ? "publicado" : "publicados"}{drafts > 0 && ` · ${drafts} en borrador`}</span>
            <span><Icon name="eye" size={16} />{fmt(story.reads)}</span>
            <span><Icon name="heart" size={16} />{fmt(story.votes)}</span>
          </span>
          <div className="statusrow" role="group" aria-label="Estado de la historia">
            <span className="statusrow__label">Estado</span>
            <div className="seg">
              {statuses.map((st) => (
                <button key={st} type="button" aria-pressed={story.status === st} onClick={() => setStatus(st)}>
                  {story.status === st && <Icon name="check" size={16} stroke={2.6} />}{st}
                </button>
              ))}
            </div>
            <span className="muted small" role="status">{busy("estado") ? "Guardando…" : story.status === "Completa" ? "Su ficha la muestra como completa." : "Aparece en la ficha de la historia."}</span>
          </div>
          <div className="row wrap">
            <Btn variant="ghost" icon="settings" href={`/escribir/${story.slug}?vista=detalles`}>Editar detalles</Btn>
            {isVisible(story) && <Btn variant="ghost" href={`/historia/${story.slug}`}>Ver su ficha</Btn>}
          </div>
        </div>
      </section>
      )}

      {story.removedAt && (
        <p className="notice notice--error" role="status">
          Moderación retiró esta historia y no se ve en Inkwell{story.removedReason ? `. Motivo: ${story.removedReason}` : ""}. La sigues viendo y editando aquí.
        </p>
      )}
      {notice && <p className="notice notice--error" role="alert">{notice}</p>}

      {view === "capitulos" && (
        <>
          <section className="stack" aria-labelledby="sm-capitulos">
            <div className="row between wrap">
              <h2 className="h-sec" id="sm-capitulos">Capítulos · {list.length}</h2>
              <NewChapterButton slug={story.slug} icon="plus">{list.length ? "Nuevo capítulo" : "Escribir el primer capítulo"}</NewChapterButton>
            </div>
            {list.length === 0 ? (
              <div className="empty">
                <h3 className="h-card">Ya existe el libro. Ahora, el contenido</h3>
                <p className="muted">Escribe el primer capítulo aquí mismo o trae lo que ya tienes en Word. Nadie ve la historia hasta que publiques un capítulo.</p>
              </div>
            ) : (
              <ol className="stack-sm" aria-label="Capítulos">
                {list.map((c, i) => (
                  <li key={c.id} className="chaprow">
                    <div className="chaprow__order">
                      <button type="button" className="iconbtn" aria-label={`Subir "${c.title}"`} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="up" size={18} /></button>
                      <button type="button" className="iconbtn" aria-label={`Bajar "${c.title}"`} disabled={i === list.length - 1} onClick={() => move(i, 1)}><Icon name="down" size={18} /></button>
                    </div>
                    <b className="chaprow__n">{c.n}</b>
                    <div className="chaprow__main">
                      <Link href={`/editor/${story.slug}?cap=${c.id}`} className="h-card">{c.title}</Link>
                      <span className="muted small">{c.words.toLocaleString("es")} {c.words === 1 ? "palabra" : "palabras"} · {when(c)}</span>
                    </div>
                    <Chip tone={c.state === "publicado" ? "tint" : c.state === "programado" ? "sand" : "lilac"}>{stateLabel[c.state]}</Chip>
                    <div className="chaprow__actions">
                      <Btn variant="ghost" size="sm" icon="pen" href={`/editor/${story.slug}?cap=${c.id}`}>Editar</Btn>
                      {c.state === "borrador"
                        ? <Btn size="sm" disabled={busy(`pub:${c.id}`)} onClick={() => void publish(c)}>{busy(`pub:${c.id}`) ? "Publicando…" : "Publicar"}</Btn>
                        : <Btn variant="ghost" size="sm" disabled={busy(`unpub:${c.id}`)} onClick={() => void unpublish(c)}>{busy(`unpub:${c.id}`) ? "Guardando…" : c.state === "programado" ? "Cancelar fecha" : "Despublicar"}</Btn>}
                      {confirming === c.id ? (
                        <>
                          <Btn variant="ink" size="sm" onClick={() => void removeChapter(c)}>Sí, borrar</Btn>
                          <button type="button" className="linkbtn" onClick={() => setConfirming(null)}>Cancelar</button>
                        </>
                      ) : (
                        <button type="button" className="iconbtn" aria-label={`Borrar "${c.title}"`} onClick={() => setConfirming(c.id)}><Icon name="trash" /></button>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {list.length > 0 && <p className="muted small">La historia queda publicada en cuanto publicas un capítulo. Quien lee solo ve los publicados, numerados en este orden; despublicar uno lo devuelve a borrador sin borrar nada.</p>}
          </section>

          <ImportPanel />

          <section className="card" aria-labelledby="sm-cuidado">
            <h2 className="h-sec" id="sm-cuidado">Con cuidado</h2>
            {(story.published || hasLive) && hasLive && (
              <div className="switchrow">
                <span><strong>{story.published ? "Esconder la historia" : "Volver a mostrarla"}</strong>
                  <span className="muted small">{story.published ? "Deja de verse para todo el mundo. No se borra nada: capítulos, votos y lecturas siguen ahí." : "Vuelve a aparecer con todos sus capítulos publicados."}</span></span>
                <Btn variant="ghost" size="sm" onClick={() => void setVisible(!story.published)}>{story.published ? "Esconder" : "Mostrar"}</Btn>
              </div>
            )}
            <div className="switchrow">
              <span><strong>Eliminar la historia</strong><span className="muted small">Se borra con todos sus capítulos, votos y comentarios. No se puede deshacer.</span></span>
              {confirming === "historia" ? (
                <span className="row wrap" style={{ flexDirection: "row" }}>
                  <Btn variant="ink" size="sm" disabled={busy("historia")} onClick={() => void removeStory()}>{busy("historia") ? "Eliminando…" : "Sí, eliminar para siempre"}</Btn>
                  <button type="button" className="linkbtn" onClick={() => setConfirming(null)}>Cancelar</button>
                </span>
              ) : (
                <Btn variant="ghost" size="sm" icon="trash" onClick={() => setConfirming("historia")}>Eliminar</Btn>
              )}
            </div>
          </section>
        </>
      )}

      {view === "detalles" && <StoryForm key={story.slug} story={story} onSaved={setStory} />}
      <div className="toast" role="status" key={toast?.id ?? 0}>
        {toast && <span className="toast__pill"><Icon name="check" size={16} stroke={2.6} />{toast.text}</span>}
      </div>
    </div>
  );
}
