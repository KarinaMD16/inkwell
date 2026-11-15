"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { genres, lengthOf, type Story } from "@/lib/data";
import { MiniBook } from "./Book";
import { Icon, type IconName } from "./Icon";
import { ShelfCard, StoryRow } from "./StoryCard";
import { Btn } from "./ui";

type Mode = "in" | "out";
type Selection = Record<string, Mode>; // clave: "Faceta|valor"

interface Facet {
  name: string;
  values: string[];
  /** true si una historia puede tener varios valores (se exigen todos los incluidos) */
  multi: boolean;
  get: (s: Story) => string[];
}

const SHELVES: { label: string; genre: string | null; color: string; ink: string; icon: IconName }[] = [
  { label: "Todo", genre: null, color: "#0F8B80", ink: "#FFFBF8", icon: "library" },
  { label: "Romance", genre: "Romance", color: "#DD5D4F", ink: "#14152B", icon: "heart" },
  { label: "Fantasía", genre: "Fantasía", color: "#4B3B8F", ink: "#FFFBF8", icon: "sword" },
  { label: "Misterio", genre: "Misterio", color: "#14152B", ink: "#FFFBF8", icon: "moon" },
  { label: "Terror", genre: "Terror", color: "#D7F0EC", ink: "#14152B", icon: "ghost" },
  { label: "Sci-fi", genre: "Ciencia ficción", color: "#2EC4B6", ink: "#14152B", icon: "rocket" },
  { label: "Amistad", genre: "Amistad", color: "#F6C453", ink: "#14152B", icon: "chat" },
  { label: "Humor", genre: "Humor", color: "#FFD9A8", ink: "#14152B", icon: "smile" },
  { label: "Drama", genre: "Drama", color: "#B9A5F0", ink: "#14152B", icon: "sparkle" },
  { label: "Deportes", genre: "Deportes", color: "#F28C38", ink: "#14152B", icon: "ball" },
];

const uniq = (xs: string[]) => Array.from(new Set(xs)).sort((a, b) => a.localeCompare(b, "es"));

export function Explorer({ stories }: { stories: Story[] }) {
  const q0 = useSearchParams().get("q") ?? "";
  const [q, setQ] = useState(q0);
  const [sel, setSel] = useState<Selection>({});
  const [sort, setSort] = useState("votos");
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);

  const facets: Facet[] = useMemo(() => [
    { name: "Género", values: genres, multi: false, get: (s) => [s.genre] },
    { name: "Fandom", values: uniq(stories.map((s) => s.fandom)), multi: false, get: (s) => [s.fandom] },
    { name: "Tropos", values: uniq(stories.flatMap((s) => s.tropes)), multi: true, get: (s) => s.tropes },
    { name: "Advertencias", values: uniq(stories.flatMap((s) => s.warnings)), multi: true, get: (s) => s.warnings },
    { name: "Clasificación", values: ["Todo público", "+13", "+16", "+18"], multi: false, get: (s) => [s.rating] },
    { name: "Estado", values: ["En curso", "Completa"], multi: false, get: (s) => [s.status] },
    { name: "Formato", values: ["Narrativa", "Redes sociales", "Con fichas"], multi: false, get: (s) => [s.format] },
    { name: "Extensión", values: ["Corta", "Media", "Larga"], multi: false, get: (s) => [lengthOf(s)] },
    { name: "Última actualización", values: ["Esta semana", "Este mes"], multi: false, get: (s) => [s.updatedDays <= 7 ? "Esta semana" : "", s.updatedDays <= 30 ? "Este mes" : ""] },
  ], [stories]);

  /** Un toque incluye, el segundo excluye, el tercero limpia. */
  function cycle(key: string) {
    setSel((prev) => {
      const next = { ...prev };
      if (!prev[key]) next[key] = "in";
      else if (prev[key] === "in") next[key] = "out";
      else delete next[key];
      return next;
    });
  }
  function setGenre(genre: string | null) {
    setSel((prev) => {
      const next = Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith("Género|")));
      if (genre) next[`Género|${genre}`] = "in";
      return next as Selection;
    });
  }

  const results = useMemo(() => {
    const text = q.trim().toLowerCase();
    const list = stories.filter((s) => {
      if (text) {
        const hay = [s.title, s.author, s.genre, s.fandom, ...s.tropes].join(" ").toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return facets.every((f) => {
        const have = f.get(s);
        const inc = f.values.filter((v) => sel[`${f.name}|${v}`] === "in");
        const exc = f.values.filter((v) => sel[`${f.name}|${v}`] === "out");
        if (exc.some((v) => have.includes(v))) return false;
        if (!inc.length) return true;
        return f.multi ? inc.every((v) => have.includes(v)) : inc.some((v) => have.includes(v));
      });
    });
    const by: Record<string, (a: Story, b: Story) => number> = {
      votos: (a, b) => b.votes - a.votes,
      recientes: (a, b) => a.updatedDays - b.updatedDays,
      lecturas: (a, b) => b.reads - a.reads,
    };
    return [...list].sort(by[sort]);
  }, [stories, facets, sel, q, sort]);

  const active = Object.entries(sel);
  const currentGenre = active.find(([k, m]) => k.startsWith("Género|") && m === "in")?.[0].split("|")[1] ?? null;

  return (
    <div className="stack-lg">
      <div className="shelflabel">Estantes</div>
      <div className="minishelf">
        {SHELVES.map((sh) => (
          <button key={sh.label} type="button" className={`minishelf__item${currentGenre === sh.genre ? " is-on" : ""}`} aria-pressed={currentGenre === sh.genre} onClick={() => setGenre(sh.genre)}>
            <MiniBook color={sh.color} ink={sh.ink} icon={sh.icon} />
            <span>{sh.label}</span>
          </button>
        ))}
      </div>

      <div className="explore">
        <aside className={`filters${open ? " is-open" : ""}`} aria-label="Filtros">
          <div className="row between">
            <h2 className="h-sec">Filtros</h2>
            <button type="button" className="linkbtn" onClick={() => setSel({})}>Limpiar</button>
          </div>
          <p className="muted small">Un toque incluye. Dos toques excluyen.</p>
          {facets.map((f) => (
            <fieldset key={f.name} className="facet">
              <legend>{f.name}</legend>
              <div className="chips">
                {f.values.map((v) => {
                  const mode = sel[`${f.name}|${v}`];
                  return (
                    <button key={v} type="button" className={`tag${mode ? ` tag--${mode}` : ""}`} onClick={() => cycle(`${f.name}|${v}`)}
                      aria-label={mode === "in" ? `Incluida: ${v}` : mode === "out" ? `Excluida: ${v}` : v}>
                      {mode === "in" && <Icon name="check" size={14} stroke={2.4} />}
                      {mode === "out" && <Icon name="x" size={14} stroke={2.4} />}
                      {v}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <div className="only-mobile"><Btn wide onClick={() => setOpen(false)}>Ver {results.length} historias</Btn></div>
        </aside>

        <section className="stack">
          <div className="row between wrap">
            <div>
              <h1 className="h-page">{q.trim() ? `«${q.trim()}»` : currentGenre ?? "Todas las historias"}</h1>
              <div className="muted">{results.length} {results.length === 1 ? "historia" : "historias"}</div>
            </div>
            <div className="row wrap">
              <span className="only-mobile"><Btn variant="ghost" icon="filter" size="sm" onClick={() => setOpen(true)}>Filtros{active.length ? ` · ${active.length}` : ""}</Btn></span>
              <div className="seg" role="group" aria-label="Vista">
                <button type="button" aria-pressed={!compact} onClick={() => setCompact(false)}><Icon name="grid" size={18} />Libros</button>
                <button type="button" aria-pressed={compact} onClick={() => setCompact(true)}><Icon name="list" size={18} />Compacta</button>
              </div>
              <label className="select">
                <span className="muted small">Ordenar</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="votos">Más votadas</option>
                  <option value="recientes">Recién actualizadas</option>
                  <option value="lecturas">Más leídas</option>
                </select>
              </label>
            </div>
          </div>

          <label className="searchpill searchpill--inline">
            <Icon name="search" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Título, autor o etiqueta" aria-label="Buscar en los resultados" />
          </label>

          {active.length > 0 && (
            <div className="chips">
              {active.map(([k, mode]) => (
                <button key={k} type="button" className={`tag tag--${mode}`} onClick={() => setSel((p) => { const n = { ...p }; delete n[k]; return n; })} aria-label={`Quitar filtro ${k.split("|")[1]}`}>
                  <Icon name={mode === "in" ? "check" : "x"} size={14} stroke={2.4} />{k.split("|")[1]}
                </button>
              ))}
            </div>
          )}

          {results.length === 0 ? (
            <div className="empty">
              <h2 className="h-sec">Esta repisa está vacía</h2>
              <p className="muted">Ninguna historia cumple todos esos filtros. Prueba a quitar alguno.</p>
              <Btn variant="ghost" onClick={() => { setSel({}); setQ(""); }}>Limpiar filtros</Btn>
            </div>
          ) : compact ? (
            <div className="rowgrid">{results.map((s) => <StoryRow key={s.slug} story={s} />)}</div>
          ) : (
            <div className="shelfgrid">{results.map((s) => <ShelfCard key={s.slug} story={s} />)}</div>
          )}
        </section>
      </div>
    </div>
  );
}
