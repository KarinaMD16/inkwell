"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Story } from "@/lib/data";
import { Icon } from "./Icon";
import { IconBtn } from "./ui";

/**
 * Acciones de la ficha. "Abrir el libro" es el gesto firma: la tapa gira,
 * la página crece y recién entonces se navega al lector.
 */
export function StoryActions({ story, chapter }: { story: Story; chapter: number }) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const [saved, setSaved] = useState(false);
  const href = `/leer/${story.slug}/${chapter}`;

  function open() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return router.push(href);
    setOpening(true);
    router.prefetch(href);
    window.setTimeout(() => router.push(href), 1150);
  }

  return (
    <>
      <div className="actions">
        <button type="button" className="btn btn--primary btn--lg actions__main" onClick={open}>
          <Icon name="arrow" size={18} stroke={2} />
          {chapter > 1 ? `Seguir en el capítulo ${chapter}` : "Abrir el libro"}
        </button>
        <IconBtn icon="shelf" label={saved ? "Quitar de mi repisa" : "Poner en mi repisa"} active={saved} onClick={() => setSaved((v) => !v)} />
        <IconBtn icon="share" label="Compartir" onClick={() => navigator.share?.({ title: story.title, url: location.href }).catch(() => {})} />
        <IconBtn icon="download" label="Descargar para leer sin conexión" />
      </div>
      <div className="toast" role="status" data-show={saved}>
        {saved && <span className="toast__pill"><Icon name="check" size={16} stroke={2.6} />Guardada en tu repisa</span>}
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
