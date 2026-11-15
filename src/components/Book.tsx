import type { CSSProperties, ReactNode } from "react";
import type { Story } from "@/lib/data";
import { Icon, type IconName } from "./Icon";

/** ancho y grosor de cada tamaño, en px */
const SIZES = { xs: [42, 8], s: [58, 14], n: [104, 20], m: [150, 30], l: [290, 50] } as const;
export type BookSize = keyof typeof SIZES;

function CoverArt({ story, k }: { story: Story; k: number }) {
  const base: CSSProperties = { position: "absolute", opacity: 0.28, background: story.ink };
  const px = (n: number) => `${Math.round(n * k)}px`;
  switch (story.art) {
    case "sun":
      return <span style={{ ...base, width: px(110), height: px(110), borderRadius: "50%", right: px(-28), bottom: px(-28) }} />;
    case "moon":
      return <span style={{ ...base, width: px(46), height: px(46), borderRadius: "50%", right: px(16), bottom: px(20) }} />;
    case "wave":
      return <>{[-22, 6].map((b) => <span key={b} style={{ ...base, left: "-10%", width: "120%", height: px(40), borderRadius: "50%", bottom: px(b) }} />)}</>;
    case "stripes":
      return <>{[14, 30, 46].map((b) => <span key={b} style={{ ...base, left: 0, right: 0, height: px(8), bottom: px(b) }} />)}</>;
    case "dots":
      return <>{[[18, 16], [48, 34], [82, 14], [112, 40]].map(([x, y]) => <span key={x} style={{ ...base, width: px(18), height: px(18), borderRadius: "50%", left: px(x), bottom: px(y) }} />)}</>;
    case "chat":
      return (
        <>
          <span style={{ ...base, width: px(70), height: px(22), borderRadius: `${px(11)} ${px(11)} ${px(11)} 2px`, left: px(16), bottom: px(46) }} />
          <span style={{ ...base, width: px(54), height: px(22), borderRadius: `${px(11)} ${px(11)} 2px ${px(11)}`, right: px(14), bottom: px(16) }} />
        </>
      );
  }
}

function Shell({ size, color, children }: { size: BookSize; color: string; children: ReactNode }) {
  const [w, d] = SIZES[size];
  return (
    <span className="book" style={{ "--w": `${w}px`, "--d": `${d}px` } as CSSProperties}>
      <span className="book__in">
        <span className="book__back" style={{ background: color }} />
        <span className="book__pages" />
        <span className="book__front" style={{ background: color }}>{children}</span>
      </span>
    </span>
  );
}

/**
 * El librito 3D. Si la historia trae portada subida, la imagen se acomoda a la tapa;
 * si no, se genera una portada tipográfica con su color.
 */
export function Book({ story, size = "m" }: { story: Story; size?: BookSize }) {
  const k = SIZES[size][0] / 150;
  const withText = size === "n" || size === "m" || size === "l";
  return (
    <Shell size={size} color={story.color}>
      {story.cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- portadas de usuarios, de cualquier origen
        <img src={story.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <>
          <CoverArt story={story} k={k} />
          {withText && (
            <span className="book__text" style={{ padding: `${18 * k}px ${12 * k}px 0 ${20 * k}px`, gap: 6 * k, color: story.ink }}>
              <span className="book__title" style={{ fontSize: 21 * k }}>{story.title}</span>
              <span style={{ fontSize: Math.max(11, 8 * k), fontWeight: 600 }}>@{story.author}</span>
            </span>
          )}
        </>
      )}
    </Shell>
  );
}

/** Librito pequeño con un ícono en la tapa: los estantes-filtro. */
export function MiniBook({ color, ink, icon }: { color: string; ink: string; icon: IconName }) {
  return (
    <Shell size="s" color={color}>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: ink }}>
        <Icon name={icon} size={24} stroke={2} />
      </span>
    </Shell>
  );
}

/** Portada plana para listas densas. */
export function FlatCover({ story }: { story: Story }) {
  return (
    <span aria-hidden="true" className="flatcover" style={{ background: story.color, color: story.ink }}>
      <CoverArt story={story} k={0.5} />
      <span style={{ position: "relative" }}>{story.title[0]}</span>
    </span>
  );
}
