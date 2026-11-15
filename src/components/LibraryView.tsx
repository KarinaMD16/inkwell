"use client";

import Link from "next/link";
import { useState } from "react";
import { pct, type Story } from "@/lib/data";
import { Book } from "./Book";
import { Icon } from "./Icon";
import { Board, ShelfLabel, Spine } from "./Shelf";
import { Btn, Chip, Progress, Vial } from "./ui";

export interface LibItem { story: Story; chapter: number; offline: boolean }

export function LibraryView({ tabs, listName, listStories }: {
  tabs: { name: string; items: LibItem[] }[]; listName: string; listStories: Story[];
}) {
  const [tab, setTab] = useState(0);
  const [grid, setGrid] = useState(false);
  const items = tabs[tab].items;
  const [picked, setPicked] = useState<string | null>(items[0]?.story.slug ?? null);
  const current = items.find((i) => i.story.slug === picked) ?? null;

  return (
    <div className="stack-lg">
      <div className="row between wrap end">
        <div>
          <h1 className="h-hero">Tu librero</h1>
          <p className="muted">{grid ? "Tus historias con su progreso." : "Toca un lomo para sacarlo de la repisa."}</p>
        </div>
        <div className="seg" role="group" aria-label="Vista">
          <button type="button" aria-pressed={!grid} onClick={() => setGrid(false)}><Icon name="shelf" size={18} />Repisa</button>
          <button type="button" aria-pressed={grid} onClick={() => setGrid(true)}><Icon name="grid" size={18} />Cuadrícula</button>
        </div>
      </div>

      <div className="tabs" role="group" aria-label="Sección">
        {tabs.map((t, i) => (
          <button key={t.name} type="button" aria-pressed={tab === i} onClick={() => { setTab(i); setPicked(tabs[i].items[0]?.story.slug ?? null); }}>
            {t.name} · {t.items.length}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="empty"><h2 className="h-sec">Aquí todavía no hay nada</h2><p className="muted">Guarda una historia y aparecerá en esta repisa.</p><Btn href="/explorar" icon="search">Explorar historias</Btn></div>
      ) : grid ? (
        <div className="libgrid">
          {items.map(({ story, chapter, offline }) => (
            <Link key={story.slug} href={`/historia/${story.slug}`} className="libcard">
              <Book story={story} size="n" />
              <span className="row" style={{ gap: 8 }}>
                <span style={{ flex: 1 }}><Progress pct={pct(chapter, story.chapters)} track="var(--line)" /></span>
                {offline && <span role="img" aria-label="Disponible sin conexión" className="deep"><Icon name="download" size={16} stroke={2.2} /></span>}
              </span>
              <span className="h-card">{story.title}</span>
              <span className="muted small">Cap. {chapter} de {story.chapters}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="libsplit">
          <div className="stack-lg" style={{ flex: "999 1 420px", minWidth: 0 }}>
            <section className="shelf">
              <ShelfLabel>{tabs[tab].name} · {items.length}</ShelfLabel>
              <div>
                <div className="shelf__row">
                  {items.map(({ story }) => (
                    <Spine key={story.slug} story={story} lifted={picked === story.slug} onClick={() => setPicked(story.slug)} />
                  ))}
                </div>
                <Board />
              </div>
            </section>
            <section className="shelf">
              <ShelfLabel>Lista: {listName}</ShelfLabel>
              <div>
                <div className="shelf__row">{listStories.map((s, i) => <Spine key={s.slug} story={s} lean={i === listStories.length - 1} />)}</div>
                <Board />
              </div>
            </section>
          </div>
          {current && (
            <aside className="pulled" aria-label="Historia seleccionada" aria-live="polite">
              <Book story={current.story} />
              <Chip tone="white">Acabas de sacarla</Chip>
              <h2 className="h-sec">{current.story.title}</h2>
              <span className="muted small">@{current.story.author}</span>
              <Vial pct={pct(current.chapter, current.story.chapters)} label={`Capítulo ${current.chapter} de ${current.story.chapters}`} />
              <div className="row wrap">
                <Btn href={`/leer/${current.story.slug}/${current.chapter}`} icon="arrow">Continuar</Btn>
                <Btn variant="ghost" href={`/historia/${current.story.slug}`}>Ver ficha</Btn>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
