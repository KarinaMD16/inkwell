import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "ink" | "paper" | "ghost";

export function Btn({
  children, variant = "primary", href, icon, size = "md", wide = false, onClick, disabled, type = "button", ariaPressed,
}: {
  children: ReactNode; variant?: Variant; href?: string; icon?: IconName; size?: "sm" | "md" | "lg"; wide?: boolean;
  onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; ariaPressed?: boolean;
}) {
  const cls = `btn btn--${variant} btn--${size}${wide ? " btn--wide" : ""}`;
  const inner = (
    <>
      {icon && <Icon name={icon} size={18} stroke={2} />}
      {children}
    </>
  );
  if (href) return <Link className={cls} href={href}>{inner}</Link>;
  return <button type={type} className={cls} onClick={onClick} disabled={disabled} aria-pressed={ariaPressed}>{inner}</button>;
}

export function IconBtn({ icon, label, href, onClick, active = false }: { icon: IconName; label: string; href?: string; onClick?: () => void; active?: boolean }) {
  const cls = `iconbtn${active ? " iconbtn--on" : ""}`;
  if (href) return <Link className={cls} href={href} aria-label={label}><Icon name={icon} /></Link>;
  return <button type="button" className={cls} aria-label={label} aria-pressed={active} onClick={onClick}><Icon name={icon} /></button>;
}

export function Chip({ children, tone = "tint" }: { children: ReactNode; tone?: "tint" | "white" | "sand" | "deep" | "lilac" }) {
  return <span className={`chip chip--${tone}`}>{children}</span>;
}

export function Avatar({ letter, color, size = 44 }: { letter: string; color: string; size?: number }) {
  return (
    <span aria-hidden="true" className="avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}>
      {letter.toUpperCase()}
    </span>
  );
}

/** Progreso como frasco de tinta que se llena. */
export function Vial({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="vial">
      <div className="vial__glass" role="img" aria-label={label}>
        <div className="vial__ink" style={{ width: `${pct}%` }} />
      </div>
      <div className="vial__label">{label}</div>
    </div>
  );
}

export function Progress({ pct, track }: { pct: number; track?: string }) {
  return (
    <div className="progress" role="img" aria-label={`Progreso ${pct} %`} style={track ? ({ background: track } as CSSProperties) : undefined}>
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Trazo de tinta bajo los títulos. */
export function Scribble({ width = 200 }: { width?: number }) {
  return (
    <svg aria-hidden="true" width={width} height="14" viewBox="0 0 170 14" preserveAspectRatio="none" fill="none">
      <path d="M3 9c22-7 40 4 62-1s38-6 58-2 30 3 44-2" stroke="var(--teal)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/** Fila de ficha: dato, línea punteada, valor. */
export function Leader({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="leader">
      <span className="leader__k">{k}</span>
      <span className="leader__dots" aria-hidden="true" />
      <span className="leader__v">{children}</span>
    </div>
  );
}
