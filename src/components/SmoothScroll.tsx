"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/**
 * Scroll suave global con Lenis, igual que en la web de Koral (lerp 0.1).
 * - Se apaga si la persona pidió reducir movimiento en su sistema.
 * - Solo actúa con rueda o trackpad: en el celular el desplazamiento táctil sigue siendo el nativo.
 * - Las listas con su propio scroll (desplegables, panel de filtros, repisas) se mueven solas.
 * - Al cambiar de página se corta cualquier deslizamiento en curso, para que Next pueda
 *   llevar la nueva página arriba sin que Lenis la arrastre hacia la posición anterior.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    let frame = 0;

    const start = () => {
      if (lenis || reduce.matches) return;
      lenis = new Lenis({ lerp: 0.1, allowNestedScroll: true, anchors: true });
      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      lenis?.destroy();
      lenis = null;
    };
    // stop() + start() en Lenis deja el destino igual a la posición actual: frena en seco.
    const halt = () => { lenis?.stop(); lenis?.start(); };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href");
      if (href && !href.startsWith("#")) halt();
    };
    const onMotionChange = () => (reduce.matches ? stop() : start());

    start();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", halt);
    reduce.addEventListener("change", onMotionChange);
    return () => {
      stop();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", halt);
      reduce.removeEventListener("change", onMotionChange);
    };
  }, []);

  return null;
}
