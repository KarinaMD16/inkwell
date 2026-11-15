import Link from "next/link";
import type { ReactNode } from "react";
import type { Story } from "@/lib/data";

function hash(text: string): number {
  let h = 0;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return h;
}

/** El grosor del lomo sale de la cantidad de capítulos; la altura varía un poco por historia. */
export function spineSize(story: Story, scale = 1): { w: number; h: number } {
  const w = Math.round((30 + Math.min(story.chapters, 45) * 0.8) * scale);
  const h = Math.round((212 + (hash(story.slug) % 52)) * scale);
  return { w, h };
}

export function Spine({
  story, scale = 1, lifted = false, lean = false, href, onClick,
}: { story: Story; scale?: number; lifted?: boolean; lean?: boolean; href?: string; onClick?: () => void }) {
  const { w, h } = spineSize(story, scale);
  const style = { width: w, height: h, background: story.color, color: story.ink };
  const cls = `spine${lifted ? " spine--on" : ""}${lean ? " spine--lean" : ""}`;
  const label = (
    <span className="spine__title" style={{ fontSize: w >= 44 ? 15 : 13, maxHeight: h - 32 }}>{story.title}</span>
  );
  if (onClick) {
    return (
      <button type="button" className={cls} style={style} onClick={onClick} aria-pressed={lifted} aria-label={`${story.title}, de @${story.author}`}>
        {label}
      </button>
    );
  }
  return (
    <Link className={cls} style={style} href={href ?? `/historia/${story.slug}`} aria-label={`${story.title}, de @${story.author}`}>
      {label}
    </Link>
  );
}

export function Board() {
  return <div className="board" aria-hidden="true" />;
}

/** Etiqueta de estante, como las de una biblioteca. */
export function ShelfLabel({ children }: { children: ReactNode }) {
  return <div className="shelflabel">{children}</div>;
}

/** Una repisa: fila de lomos (o libros) apoyada sobre su tabla. */
export function Shelf({ label, action, children, faces = false }: { label: ReactNode; action?: ReactNode; children: ReactNode; faces?: boolean }) {
  return (
    <section className="shelf">
      <div className="shelf__head">
        <ShelfLabel>{label}</ShelfLabel>
        {action}
      </div>
      <div>
        <div className={faces ? "shelf__row shelf__row--faces" : "shelf__row"}>{children}</div>
        <Board />
      </div>
    </section>
  );
}
