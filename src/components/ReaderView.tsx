"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Block, ChapterMeta, Story } from "@/lib/data";
import { useAuthHref } from "@/lib/useAuthHref";
import { useSession } from "./SessionProvider";
import { Book } from "./Book";
import { Icon } from "./Icon";
import { Btn, IconBtn } from "./ui";

interface Prefs { size: number; serif: boolean; spacing: number; theme: "claro" | "sepia" | "oscuro" }
const DEFAULTS: Prefs = { size: 19, serif: true, spacing: 1.7, theme: "claro" };
const KEY = "inkwell:lector";

function readingMinutes(blocks: Block[]): number {
  const words = blocks.reduce((n, b) => n + (b.type === "p" ? b.text.split(/\s+/).length : b.type === "chat" ? b.messages.length * 8 : 20), 0);
  return Math.max(1, Math.round(words / 200));
}

export function ReaderView({ story, chapter, total, blocks }: { story: Story; chapter: ChapterMeta; total: number; blocks: Block[] }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [panel, setPanel] = useState(false);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const auth = useAuthHref();
  const { token } = useSession();
  const signedIn = Boolean(token);

  // Con sesión, abrir un capítulo lo deja como "por dónde vas" en la repisa.
  useEffect(() => {
    if (!token) return;
    api(`/me/library/${story.slug}`, { method: "PUT", token, body: JSON.stringify({ chapter: chapter.n }) }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- una vez por capítulo y sesión, no por cada token renovado
  }, [signedIn, story.slug, chapter.n]);

  async function vote() {
    if (!token) return router.push(auth.entrar);
    if (voting) return;
    setVoting(true);
    try {
      const res = await api<{ voted: boolean }>(`/stories/${story.slug}/chapters/${chapter.n}/vote`, { method: voted ? "DELETE" : "PUT", token });
      setVoted(res.voted);
    } catch { /* se queda como estaba */ } finally {
      setVoting(false);
    }
  }

  // Las preferencias viven en el navegador hasta que exista la cuenta sincronizada.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una vez al montar
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* sin almacenamiento: se usan los valores por defecto */ }
  }, []);
  function update(patch: Partial<Prefs>) {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* nada */ }
      return next;
    });
  }
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 100);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const minutes = readingMinutes(blocks);
  const left = Math.max(0, Math.round(minutes * (1 - progress / 100)));
  const next = chapter.n < total ? `/leer/${story.slug}/${chapter.n + 1}` : null;

  return (
    <div className={`reader reader--${prefs.theme}`}>
      <header className="reader__bar">
        <Link href={`/historia/${story.slug}`} className="reader__back">
          <Icon name="back" />
          <Book story={story} size="xs" />
          <span>
            <strong>{story.title}</strong>
            <span className="small reader__muted">Capítulo {chapter.n} de {total} · {left > 0 ? `${left} min restantes` : "terminado"}</span>
          </span>
        </Link>
        <div className="row">
          <IconBtn icon="list" label="Índice de capítulos" href={`/historia/${story.slug}#capitulos`} />
          <IconBtn icon="type" label="Ajustes de lectura" active={panel} onClick={() => setPanel((v) => !v)} />
        </div>
      </header>
      <div className="reader__progress" role="img" aria-label={`Progreso del capítulo ${progress} %`}><div style={{ width: `${progress}%` }} /></div>

      {panel && (
        <div className="reader__panel" role="dialog" aria-label="Ajustes de lectura">
          <strong>Ajustes de lectura</strong>
          <div className="facet"><span className="small reader__muted">Tamaño</span>
            <div className="seg seg--fill">
              <button type="button" onClick={() => update({ size: Math.max(15, prefs.size - 1) })} aria-label="Letra más pequeña">A−</button>
              <button type="button" aria-pressed="true">{prefs.size}</button>
              <button type="button" onClick={() => update({ size: Math.min(26, prefs.size + 1) })} aria-label="Letra más grande">A+</button>
            </div>
          </div>
          <div className="facet"><span className="small reader__muted">Letra</span>
            <div className="seg seg--fill">
              <button type="button" aria-pressed={prefs.serif} onClick={() => update({ serif: true })}>Con serifa</button>
              <button type="button" aria-pressed={!prefs.serif} onClick={() => update({ serif: false })}>Sin serifa</button>
            </div>
          </div>
          <div className="facet"><span className="small reader__muted">Interlineado</span>
            <div className="seg seg--fill">
              {([["Justo", 1.45], ["Normal", 1.7], ["Amplio", 2]] as const).map(([t, v]) => (
                <button key={t} type="button" aria-pressed={prefs.spacing === v} onClick={() => update({ spacing: v })}>{t}</button>
              ))}
            </div>
          </div>
          <div className="facet"><span className="small reader__muted">Tema</span>
            <div className="seg seg--fill">
              {(["claro", "sepia", "oscuro"] as const).map((t) => (
                <button key={t} type="button" aria-pressed={prefs.theme === t} onClick={() => update({ theme: t })} style={{ textTransform: "capitalize" }}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <article className="reader__page">
        <div>
          <div className="eyebrow">Capítulo {chapter.n}</div>
          <h1 className="h-hero" style={{ fontSize: "clamp(30px, 6vw, 44px)" }}>{chapter.title}</h1>
        </div>
        <div className="reader__text" style={{ fontSize: prefs.size, lineHeight: prefs.spacing, fontFamily: prefs.serif ? "var(--font-read)" : "var(--font-ui)" }}>
          {blocks.map((b, i) => {
            if (b.type === "p") {
              return (
                <div key={i} className="para">
                  <p>{b.text}</p>
                  {b.comments ? (
                    <Link href={auth.registro} className="para__comments" aria-label={`${b.comments} comentarios en este párrafo`}>
                      <Icon name="chat" size={15} />{b.comments}
                    </Link>
                  ) : null}
                </div>
              );
            }
            if (b.type === "chat") {
              return (
                <figure key={i} className="chatblock">
                  <figcaption><Icon name="chat" size={18} />{b.title}</figcaption>
                  {b.messages.map((m, j) => (
                    <div key={j} className={`msg${m.me ? " msg--me" : ""}`}><span className="msg__who">{m.who}</span><span className="msg__text">{m.text}</span></div>
                  ))}
                </figure>
              );
            }
            if (b.type === "post") {
              return (
                <figure key={i} className="fichablock"><figcaption>@{b.author}</figcaption><p>{b.text}</p></figure>
              );
            }
            if (b.type === "interludio") {
              return <div key={i} className="para"><p><em>{b.text}</em></p></div>;
            }
            return (
              <figure key={i} className="fichablock"><figcaption>{b.name}</figcaption><p>{b.text}</p></figure>
            );
          })}
        </div>
        <footer className="reader__end">
          <div className="row">
            <Btn variant="ghost" icon="heart" ariaPressed={voted} onClick={vote}>{voted ? "Votado" : "Votar"}</Btn>
            <Btn variant="ghost" icon="chat" href={auth.registro}>Comentar</Btn>
          </div>
          {next ? <Btn href={next} icon="arrow">Siguiente capítulo</Btn> : <Btn href={`/historia/${story.slug}`} variant="ink">Volver a la ficha</Btn>}
        </footer>
      </article>
    </div>
  );
}
