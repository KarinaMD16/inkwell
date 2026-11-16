import type { CSSProperties, ReactNode } from "react";

/**
 * Esqueletos de carga: la forma de la pantalla aparece al instante, en lugar de un texto
 * "Cargando…", y el contenido real ocupa después el mismo lugar sin saltos.
 * Son solo decoración para la vista; a los lectores de pantalla se les anuncia "Cargando…".
 */

/** Un bloque gris con brillo. */
export function Sk({ w = "100%", h = 14, r = 8, style, className = "" }: { w?: number | string; h?: number | string; r?: number | string; style?: CSSProperties; className?: string }) {
  return <span className={`sk ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/** Varias líneas de texto; la última más corta, como un párrafo real. */
export function SkLines({ n = 3, h = 14, gap = 10, last = "60%" }: { n?: number; h?: number; gap?: number; last?: string }) {
  return (
    <span className="sk-lines" style={{ gap }}>
      {Array.from({ length: n }, (_, i) => <Sk key={i} h={h} w={i === n - 1 && n > 1 ? last : "100%"} />)}
    </span>
  );
}

/** Contenedor accesible de un esqueleto. */
export function Loading({ label = "Cargando…", children, className = "" }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`skwrap ${className}`} role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="skwrap__in">{children}</div>
    </div>
  );
}

/** Un libro de pie (portada 2:3) con su tabla de repisa. */
export function SkBook({ w = 104 }: { w?: number }) {
  return <Sk w={w} h={w * 1.5} r="3px 8px 8px 3px" />;
}

/** Igual que ShelfCard: libro, tabla y datos. */
export function SkShelfCard() {
  return (
    <div className="shelfcard">
      <span className="shelfcard__book"><SkBook /></span>
      <span className="board board--flat sk-board" />
      <span className="shelfcard__info">
        <Sk h={16} w="80%" />
        <Sk h={12} w="50%" />
        <Sk h={12} w="40%" />
        <Sk h={26} w={78} r={999} />
      </span>
    </div>
  );
}

export function SkShelf({ n = 6, label = true }: { n?: number; label?: boolean }) {
  return (
    <section className="shelf">
      {label && <div className="shelf__head"><Sk w={180} h={26} r={4} /></div>}
      <div className="shelfgrid">{Array.from({ length: n }, (_, i) => <SkShelfCard key={i} />)}</div>
    </section>
  );
}

export function SkRow() {
  return (
    <div className="storyrow">
      <Sk w={64} h={96} r={6} />
      <span className="storyrow__info" style={{ flex: 1 }}><Sk h={16} w="60%" /><Sk h={12} w="40%" /><span className="row"><Sk h={26} w={70} r={999} /><Sk h={26} w={90} r={999} /></span></span>
    </div>
  );
}

/** "Tu escritorio" del inicio. */
export function SkDesk() {
  return (
    <section className="desk sk-desk">
      <SkBook w={150} />
      <div className="desk__now">
        <Sk w={120} h={14} />
        <Sk w="70%" h={34} />
        <Sk w="45%" h={14} />
        <Sk w={150} h={48} r={999} />
      </div>
    </section>
  );
}

export function SkHeading({ w = 260, sub = false }: { w?: number | string; sub?: boolean }) {
  return <div className="stack-sm"><Sk w={w} h={44} r={10} />{sub && <Sk w="40%" h={16} />}</div>;
}

// ---------- pantallas completas ----------

export function HomeSkeleton() {
  return (
    <Loading label="Cargando tu escritorio…" className="stack-lg">
      <SkHeading w={300} />
      <SkDesk />
      <SkShelf />
    </Loading>
  );
}

export function ExploreSkeleton() {
  return (
    <Loading label="Cargando historias…" className="stack-lg">
      <SkHeading w={220} sub />
      <div className="row wrap" style={{ gap: 10 }}>{Array.from({ length: 6 }, (_, i) => <Sk key={i} w={88} h={124} r="3px 6px 6px 3px" />)}</div>
      <div className="explore">
        <div className="filters sk-panel">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="stack-sm"><Sk w="50%" h={14} /><div className="row wrap" style={{ gap: 6 }}><Sk w={64} h={30} r={999} /><Sk w={84} h={30} r={999} /><Sk w={56} h={30} r={999} /></div></div>)}
        </div>
        <section className="stack">
          <Sk h={52} r={999} />
          <SkShelf n={6} label={false} />
        </section>
      </div>
    </Loading>
  );
}

export function StorySkeleton() {
  return (
    <Loading label="Abriendo la historia…" className="stack-lg">
      <section className="hero">
        <div className="hero__shelf" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="row" style={{ alignItems: "flex-end", gap: 8 }}>
            <Sk w={30} h={200} r={4} /><Sk w={26} h={180} r={4} />
            <SkBook w={180} />
            <Sk w={28} h={190} r={4} /><Sk w={24} h={170} r={4} />
          </div>
          <span className="board sk-board" style={{ width: "100%" }} />
        </div>
        <div className="ficha">
          <div className="row between"><Sk w={140} h={14} /><Sk w={90} h={28} r={4} /></div>
          <Sk w="80%" h={46} r={10} />
          <Sk w="60%" h={18} />
          {Array.from({ length: 5 }, (_, i) => <Sk key={i} h={16} />)}
          <div className="row wrap"><Sk w={150} h={48} r={999} /><Sk w={130} h={48} r={999} /></div>
        </div>
      </section>
      <div className="twocol">
        <div className="stack-lg"><div className="stack-sm"><Sk w={120} h={24} /><SkLines n={5} h={16} /></div></div>
        <div className="stack-sm"><Sk w={170} h={24} />{Array.from({ length: 6 }, (_, i) => <Sk key={i} h={44} r={14} />)}</div>
      </div>
    </Loading>
  );
}

export function ProfileSkeleton() {
  return (
    <Loading label="Cargando el perfil…" className="stack-lg">
      <section className="profile">
        <span className="sk profile__banner" />
        <div className="profile__body">
          <div className="profile__avatar"><Sk w={128} h={128} r="50%" /></div>
          <div className="stack-sm" style={{ flex: "1 1 300px", minWidth: 0 }}>
            <Sk w="50%" h={44} r={10} />
            <Sk w={140} h={16} />
            <SkLines n={2} h={16} />
            <Sk w={200} h={14} />
          </div>
          <div className="row wrap"><Sk w={150} h={48} r={999} /><Sk w={48} h={48} r="50%" /></div>
        </div>
      </section>
      <SkShelf n={4} />
    </Loading>
  );
}

export function LibrarySkeleton() {
  return (
    <Loading label="Cargando tu librero…" className="stack-lg">
      <div className="row between wrap end"><SkHeading w={240} sub /><Sk w={240} h={54} r={999} /></div>
      <div className="row" style={{ gap: 8 }}><Sk w={100} h={44} r={999} /><Sk w={110} h={44} r={999} /><Sk w={120} h={44} r={999} /></div>
      <div className="row" style={{ alignItems: "flex-end", gap: 6, flexWrap: "wrap" }}>
        {[200, 180, 210, 170, 195, 185, 205, 175, 190].map((h, i) => <Sk key={i} w={36 + (i % 3) * 6} h={h} r={4} />)}
      </div>
      <span className="board sk-board" style={{ display: "block" }} />
    </Loading>
  );
}

export function WorksSkeleton() {
  return (
    <Loading label="Cargando tus historias…" className="stack-lg">
      <section className="desk desk--write sk-desk">
        <SkBook w={150} />
        <div className="desk__now"><Sk w={140} h={14} /><Sk w="65%" h={34} /><Sk w="50%" h={14} /><Sk w={140} h={48} r={999} /></div>
      </section>
      <div className="tiles">{Array.from({ length: 3 }, (_, i) => <div key={i} className="tile"><Sk w={48} h={48} r={16} /><div className="stack-sm" style={{ flex: 1, gap: 6 }}><Sk w={70} h={24} /><Sk w="60%" h={12} /></div></div>)}</div>
      <div className="stack-sm">{Array.from({ length: 3 }, (_, i) => <SkRow key={i} />)}</div>
    </Loading>
  );
}

export function ReaderSkeleton() {
  return (
    <Loading label="Abriendo el capítulo…" className="reader reader--claro">
      <header className="reader__bar">
        <div className="row" style={{ gap: 12 }}><Sk w={24} h={24} r={6} /><Sk w={42} h={63} r="2px 5px 5px 2px" /><div className="stack-sm" style={{ gap: 6 }}><Sk w={180} h={16} /><Sk w={140} h={12} /></div></div>
        <div className="row"><Sk w={44} h={44} r="50%" /><Sk w={44} h={44} r="50%" /></div>
      </header>
      <div className="reader__page">
        <Sk w={120} h={14} />
        <Sk w="70%" h={40} r={10} />
        {Array.from({ length: 4 }, (_, i) => <SkLines key={i} n={4} h={18} gap={12} last={i % 2 ? "45%" : "75%"} />)}
      </div>
    </Loading>
  );
}

export function EditorSkeleton() {
  return (
    <Loading label="Abriendo tu cuaderno…" className="editor">
      <header className="reader__bar">
        <div className="row" style={{ gap: 12 }}><Sk w={24} h={24} r={6} /><Sk w={42} h={63} r="2px 5px 5px 2px" /><div className="stack-sm" style={{ gap: 6 }}><Sk w={180} h={16} /><Sk w={110} h={12} /></div></div>
        <div className="row"><Sk w={120} h={40} r={999} /><Sk w={110} h={40} r={999} /></div>
      </header>
      <div className="editor__body">
        <div className="editor__chapters">{Array.from({ length: 5 }, (_, i) => <Sk key={i} h={40} r={14} />)}</div>
        <div className="editor__page"><Sk w="60%" h={40} r={10} />{Array.from({ length: 3 }, (_, i) => <SkLines key={i} n={4} h={18} gap={12} />)}</div>
      </div>
    </Loading>
  );
}

/** Página con tarjetas (Ajustes, Editar perfil, Novedades). */
export function CardsSkeleton({ cards = 3, title = 200 }: { cards?: number; title?: number }) {
  return (
    <Loading className="stack-lg narrow">
      <SkHeading w={title} />
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="card"><Sk w={110} h={28} r={4} /><SkLines n={3} h={16} /></div>
      ))}
    </Loading>
  );
}

/** "Tu perfil" en Ajustes mientras llega de la API. */
export function ProfileSummarySkeleton() {
  return (
    <Loading label="Cargando tu perfil…">
      <div className="profilesum">
        <span className="sk profilesum__banner" style={{ display: "block", borderRadius: 0 }} />
        <div className="profilesum__body">
          <span className="profilesum__avatar"><Sk w={72} h={72} r="50%" /></span>
          <div className="stack-sm" style={{ gap: 6, flex: 1 }}><Sk w="40%" h={18} /><Sk w="30%" h={12} /></div>
        </div>
        <div style={{ margin: "12px 16px 16px" }}><SkLines n={2} /></div>
      </div>
    </Loading>
  );
}

/** El formulario de Editar perfil mientras llega de la API. */
export function ProfileEditorSkeleton() {
  return (
    <Loading label="Cargando tu perfil…" className="stack">
      <div className="mediaedit">
        <span className="sk mediaedit__banner" style={{ display: "block" }} />
        <span className="mediaedit__avatar"><Sk w={104} h={104} r="50%" /></span>
      </div>
      <div className="formgrid">
        <div className="stack-sm"><Sk w={80} h={14} /><Sk h={52} r={14} /></div>
        <div className="stack-sm"><Sk w={140} h={14} /><Sk h={52} r={14} /></div>
      </div>
      <div className="stack-sm"><Sk w={100} h={14} /><Sk h={96} r={14} /></div>
      <div className="stack-sm"><Sk w={70} h={14} /><Sk h={52} r={14} /></div>
    </Loading>
  );
}
