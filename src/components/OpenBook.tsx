import type { CSSProperties } from "react";

const L1 = [100, 92, 96, 70, 100, 88, 94, 60];
const L2 = [96, 100, 84, 100, 90, 40];

/** El libro abierto sobre el escritorio: marca dónde quedó la lectura. */
export function OpenBook({ chapter, color, scale = 1 }: { chapter: number; color: string; scale?: number }) {
  return (
    <div className="openbook" aria-hidden="true" style={{ "--k": scale } as CSSProperties}>
      <div className="openbook__cover" style={{ background: color }} />
      <div className="openbook__pages">
        <div className="openbook__page openbook__page--l">
          <span className="openbook__cap">Capítulo {chapter}</span>
          {L1.map((w, i) => <span key={i} className="openbook__line" style={{ width: `${w}%` }} />)}
        </div>
        <div className="openbook__page openbook__page--r">
          {L2.map((w, i) => <span key={i} className="openbook__line" style={{ width: `${w}%` }} />)}
          <span className="openbook__ribbon" />
        </div>
      </div>
    </div>
  );
}
