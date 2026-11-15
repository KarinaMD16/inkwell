import type { InputHTMLAttributes } from "react";

/** Casilla de Inkwell: el check se dibuja al marcarla y se borra al desmarcarla. */
export function Checkbox(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <span className="checkbox">
      <input type="checkbox" {...props} />
      <svg className="checkbox__mark" viewBox="0 0 24 24" aria-hidden="true">
        <path pathLength={1} d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}
