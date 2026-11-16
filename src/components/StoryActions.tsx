"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Story } from "@/lib/data";
import { useLibrary } from "@/lib/useLibrary";
import { useAuthHref } from "@/lib/useAuthHref";
import { Icon } from "./Icon";
import { IconBtn } from "./ui";

/**
 * Acciones de la ficha. "Abrir el libro" es el gesto firma: la tapa gira,
 * la página crece y recién entonces se navega al lector.
 */
export function StoryActions({ story }: { story: Story }) {
  const router = useRouter();
  const auth = useAuthHref();
  const library = useLibrary();
  const [opening, setOpening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const entry = library.entries.find((e) => e.slug === story.slug);
  const saved = Boolean(entry);
  const chapter = Math.max(1, Math.min(entry?.chapter ?? 1, story.chapters || 1));
  const href = `/leer/${story.slug}/${chapter}`;

  async function toggleShelf() {
    if (!library.signedIn) return router.push(auth.entrar);
    if (busy) return;
    setBusy(true);
    try {
      if (saved) { await library.remove(story.slug); setToast("La quitaste de tu repisa"); }
      else { await library.save(story.slug, 1); setToast("Guardada en tu repisa"); }
    } catch {
      setToast("No se pudo guardar; intenta de nuevo");
    } finally {
      setBusy(false);
      window.setTimeout(() => setToast(null), 2400);
    }
  }

  function open() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return router.push(href);
    router.prefetch(href);
    setOpening(true);
  }

  // La animación dura lo que tarda en abrirse el libro y recién entonces se navega. Al salir de la
  // ficha el libro se vuelve a cerrar: Next conserva esta pantalla para el botón "atrás", y si
  // `opening` quedara encendido se volvería a una pantalla tapada por la animación ya terminada
  // (y el siguiente "Abrir el libro" no animaría nada).
  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => router.push(href), 1150);
    return () => {
      window.clearTimeout(timer);
      setOpening(false);
    };
  }, [opening, href, router]);

  // Lo mismo cuando el navegador restaura la página entera desde su caché de "atrás/adelante".
  useEffect(() => {
    const close = (e: PageTransitionEvent) => { if (e.persisted) setOpening(false); };
    window.addEventListener("pageshow", close);
    return () => window.removeEventListener("pageshow", close);
  }, []);

  return (
    <>
      <div className="actions">
        <button type="button" className="btn btn--primary btn--lg actions__main" onClick={open}>
          <Icon name="arrow" size={18} stroke={2} />
          {chapter > 1 ? `Seguir en el capítulo ${chapter}` : "Abrir el libro"}
        </button>
        <IconBtn icon="shelf" label={saved ? "Quitar de mi repisa" : "Poner en mi repisa"} active={saved} onClick={toggleShelf} />
        <IconBtn icon="share" label="Compartir" onClick={() => navigator.share?.({ title: story.title, url: location.href }).catch(() => {})} />
        <IconBtn icon="download" label="Descargar para leer sin conexión" />
      </div>
      <div className="toast" role="status" data-show={Boolean(toast)}>
        {toast && <span className="toast__pill"><Icon name="check" size={16} stroke={2.6} />{toast}</span>}
      </div>
      {opening && (
        <div className="opening" aria-hidden="true">
          <div className="opening__book">
            <div className="opening__page" />
            <div className="opening__cover" style={{ background: story.color, color: story.ink }}>{story.title}</div>
          </div>
        </div>
      )}
    </>
  );
}
