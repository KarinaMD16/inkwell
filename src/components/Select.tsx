"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "./Icon";

export interface Option { value: string; label: string }

/**
 * Lista desplegable con diseño propio (reemplaza al <select> nativo). Se maneja con ratón,
 * toque o teclado: flechas, Inicio/Fin, Enter, Escape y escribir para saltar a una opción.
 */
export function Select({
  value, onChange, options, label, name, placeholder = "Elegir", invalid = false, disabled = false, compact = false, describedBy,
}: {
  value: string; onChange: (value: string) => void; options: Option[]; label: string; name?: string;
  placeholder?: string; invalid?: boolean; disabled?: boolean; compact?: boolean; describedBy?: string;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const [open, setOpen] = useState(false);
  const selected = options.findIndex((o) => o.value === value);
  const [active, setActive] = useState(Math.max(0, selected));

  function show() {
    if (disabled || !options.length) return;
    setActive(Math.max(0, selected));
    setOpen(true);
  }
  function pick(i: number) {
    const option = options[i];
    if (option) onChange(option.value);
    setOpen(false);
  }

  // Se cierra al tocar fuera.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  // La opción activa siempre queda a la vista.
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const last = options.length - 1;
    const move = (i: number) => { e.preventDefault(); if (!open) show(); setActive(Math.max(0, Math.min(last, i))); };
    switch (e.key) {
      case "ArrowDown": return move(open ? active + 1 : Math.max(0, selected));
      case "ArrowUp": return move(open ? active - 1 : Math.max(0, selected));
      case "Home": return move(0);
      case "End": return move(last);
      case "Enter":
      case " ":
        e.preventDefault();
        return open ? pick(active) : show();
      case "Escape":
        if (open) { e.preventDefault(); setOpen(false); }
        return;
      case "Tab":
        return setOpen(false);
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now();
      typed.current = { text: now - typed.current.at > 700 ? e.key : typed.current.text + e.key, at: now };
      const needle = typed.current.text.toLowerCase();
      const found = options.findIndex((o) => o.label.toLowerCase().startsWith(needle));
      if (found >= 0) { if (open) setActive(found); else onChange(options[found].value); }
    }
  }

  const current = options[selected];
  return (
    <div ref={root} className={`sel${compact ? " sel--compact" : ""}${open ? " is-open" : ""}`}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button" className={`sel__btn${invalid ? " is-invalid" : ""}`} role="combobox" aria-haspopup="listbox" aria-expanded={open}
        aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-${active}` : undefined} aria-invalid={invalid || undefined} aria-describedby={describedBy}
        aria-label={`${label}: ${current?.label ?? placeholder}`} disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())} onKeyDown={onKeyDown}
      >
        <span className={current ? undefined : "sel__placeholder"}>{current?.label ?? placeholder}</span>
        <Icon name="chevron" size={18} stroke={2.2} />
      </button>
      {open && (
        <ul ref={list} id={`${id}-list`} role="listbox" aria-label={label} className="sel__list">
          {options.map((o, i) => (
            <li
              key={o.value} id={`${id}-${i}`} role="option" aria-selected={i === selected}
              className={`sel__opt${i === active ? " is-active" : ""}`}
              onPointerEnter={() => setActive(i)} onPointerDown={(e) => e.preventDefault()} onClick={() => pick(i)}
            >
              <span>{o.label}</span>
              {i === selected && <Icon name="check" size={16} stroke={2.4} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
