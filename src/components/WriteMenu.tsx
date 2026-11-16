"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon, type IconName } from "./Icon";

const ITEMS: { href: string; label: string; hint: string; icon: IconName }[] = [
  { href: "/escribir", label: "Mis historias", hint: "Sigue con lo que ya empezaste", icon: "library" },
  { href: "/escribir/nueva", label: "Nueva historia", hint: "Empieza un libro desde cero", icon: "plus" },
];

/**
 * "Escribir" en la navegación: un menú con dos caminos claros en lugar de una pantalla mezclada.
 * `side` es el de la barra lateral (en teléfono, la barra de abajo) y `top` el botón de arriba.
 * Con teclado: Enter o flechas lo abren, las flechas recorren las opciones y Escape lo cierra.
 */
export function WriteMenu({ variant, active = false }: { variant: "side" | "top"; active?: boolean }) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" && open) {
      setOpen(false);
      root.current?.querySelector("button")?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      // Espera a que el menú exista si se acaba de abrir.
      requestAnimationFrame(() => {
        const items = Array.from(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
        const at = items.indexOf(document.activeElement as HTMLElement);
        const step = e.key === "ArrowDown" ? 1 : -1;
        items[(at + step + items.length) % items.length]?.focus();
      });
    }
  }

  return (
    <div ref={root} className={`writemenu writemenu--${variant}`} onKeyDown={onKeyDown}>
      <button
        type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen((o) => !o)}
        className={variant === "side" ? `side__link${active || open ? " is-on" : ""}` : "btn btn--ghost btn--md"}
      >
        <Icon name="pen" size={variant === "side" ? 22 : 18} stroke={variant === "side" ? (active ? 2.2 : 1.8) : 2} />
        <span>Escribir</span>
        {variant === "top" && <Icon name="chevron" size={16} stroke={2.2} />}
      </button>
      {open && (
        <div id={id} role="menu" aria-label="Escribir" className="menu">
          {ITEMS.map((item) => (
            <Link key={item.href} href={item.href} role="menuitem" className="menu__item" onClick={() => setOpen(false)}>
              <span className="tile__icon menu__icon"><Icon name={item.icon} size={20} /></span>
              <span><strong>{item.label}</strong><span className="small muted">{item.hint}</span></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
