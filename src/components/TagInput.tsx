"use client";

import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { api } from "@/lib/api";
import { Icon } from "./Icon";

export type TagKind = "fandom" | "personaje" | "relacion" | "tropo" | "advertencia" | "libre";
interface Suggestion { name: string; uses: number }

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Campo de etiquetas de una categoría. Mientras escribes sugiere las que ya usan otras historias,
 * para que todas caigan en la misma y los filtros funcionen; si ninguna sirve, Enter crea la tuya.
 * Con `max={1}` sirve para campos de un solo valor, como el fandom.
 */
export function TagInput({
  label, kind, value, onChange, max = 12, maxLength = 40, placeholder, hint, picks = [], error,
}: {
  label: string; kind: TagKind; value: string[]; onChange: (next: string[]) => void; max?: number; maxLength?: number;
  placeholder?: string; hint?: string; /** Opciones frecuentes para elegir con un toque. */ picks?: string[]; error?: string;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [found, setFound] = useState<{ for: string; list: Suggestion[] }>({ for: "", list: [] });
  const [active, setActive] = useState(-1);
  const [focused, setFocused] = useState(false);
  const full = value.length >= max;
  const query = text.trim();

  // Pide sugerencias poco después de dejar de escribir.
  useEffect(() => {
    if (query.length < 2) return;
    let alive = true;
    const timer = setTimeout(() => {
      api<Suggestion[]>(`/tags?kind=${kind}&limit=6&q=${encodeURIComponent(query)}`)
        .then((list) => { if (alive) { setFound({ for: query, list }); setActive(-1); } })
        .catch(() => { /* sin sugerencias: igual se puede escribir la etiqueta */ });
    }, 180);
    return () => { alive = false; clearTimeout(timer); };
  }, [query, kind]);

  const options = found.for === query && query.length >= 2 ? found.list.filter((s) => !value.some((v) => same(v, s.name))) : [];
  const open = focused && options.length > 0;

  function add(raw: string) {
    const name = raw.trim().replace(/\s+/g, " ").slice(0, maxLength);
    setText("");
    if (!name || full || value.some((v) => same(v, name))) return;
    onChange([...value, name]);
  }
  const remove = (name: string) => onChange(value.filter((v) => v !== name));

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      // Enter aquí agrega la etiqueta; no envía el formulario.
      e.preventDefault();
      add(open && active >= 0 ? options[active].name : text);
    } else if (e.key === "Backspace" && !text && value.length) {
      remove(value[value.length - 1]);
    } else if (open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      // -1 es "ninguna": desde ahí, Enter agrega lo escrito tal cual.
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => ((a + 1 + step + options.length + 1) % (options.length + 1)) - 1);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setFound({ for: "", list: [] });
    }
  }

  const rest = picks.filter((p) => !value.some((v) => same(v, p)));
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className={`tagbox${error ? " is-invalid" : ""}`}>
        {value.map((v) => (
          <span key={v} className="tagbox__tag">
            {v}
            <button type="button" aria-label={`Quitar ${v}`} onClick={() => remove(v)}><Icon name="x" size={14} stroke={2.4} /></button>
          </span>
        ))}
        {!full && (
          <input
            id={id} value={text} maxLength={maxLength} placeholder={value.length ? "" : placeholder} autoComplete="off"
            role="combobox" aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined} aria-describedby={hint ? `${id}-hint` : undefined}
            onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); add(text); }}
          />
        )}
        {open && (
          <ul id={`${id}-list`} role="listbox" aria-label={`Sugerencias de ${label.toLowerCase()}`} className="sel__list">
            {options.map((s, i) => (
              <li
                key={s.name} id={`${id}-${i}`} role="option" aria-selected={i === active} className={`sel__opt${i === active ? " is-active" : ""}`}
                onPointerEnter={() => setActive(i)} onPointerDown={(e) => { e.preventDefault(); add(s.name); }}
              >
                <span>{s.name}</span><span className="muted small">{s.uses} {s.uses === 1 ? "historia" : "historias"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {rest.length > 0 && !full && (
        <div className="chips">{rest.map((p) => <button key={p} type="button" className="tag tag--small" onClick={() => add(p)}><Icon name="plus" size={14} stroke={2.2} />{p}</button>)}</div>
      )}
      {error ? <span className="field__error" role="alert">{error}</span> : hint && <span id={`${id}-hint`} className="muted small">{hint}</span>}
    </div>
  );
}
