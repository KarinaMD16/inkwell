// Ida y vuelta entre el formato de un capítulo (bloques, lo que guarda la API) y el documento
// del editor (TipTap). Son funciones puras: no tocan el navegador.
import type { JSONContent } from "@tiptap/core";
import type { Align, Block, Mark, MarkKind } from "./data";

export type Template = "chat" | "post" | "ficha" | "interludio";
const KINDS: MarkKind[] = ["b", "i", "u"];
const MARK_NAME: Record<MarkKind, string> = { b: "bold", i: "italic", u: "underline" };
const MARK_KIND: Record<string, MarkKind> = { bold: "b", italic: "i", underline: "u" };

/** Corta un párrafo en tramos seguidos que comparten el mismo formato. */
export function runs(text: string, marks: Mark[] = []): { text: string; kinds: MarkKind[] }[] {
  const clamp = (n: number) => Math.max(0, Math.min(text.length, n));
  const cuts = new Set([0, text.length]);
  for (const [start, end] of marks) { cuts.add(clamp(start)); cuts.add(clamp(end)); }
  const points = [...cuts].sort((a, b) => a - b);
  const out: { text: string; kinds: MarkKind[] }[] = [];
  for (let i = 0; i + 1 < points.length; i++) {
    const [a, b] = [points[i], points[i + 1]];
    out.push({ text: text.slice(a, b), kinds: KINDS.filter((k) => marks.some(([s, e, kind]) => kind === k && s <= a && e >= b)) });
  }
  return out;
}

/** Una plantilla se edita como texto simple; aquí se pasa al bloque que entiende el lector. */
function templateBlock(kind: Template, name: string, raw: string): Block | null {
  const text = raw.trim();
  if (kind === "ficha") return name.trim() || text ? { type: "ficha", name: name.trim() || "Sin nombre", tags: [], text } : null;
  if (!text) return null;
  if (kind === "chat") {
    // Un mensaje por línea, "Quién: texto".
    const messages = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => {
      const cut = line.indexOf(":");
      return cut > 0 ? { who: line.slice(0, cut).trim(), text: line.slice(cut + 1).trim() } : { who: "", text: line };
    });
    return { type: "chat", title: "Chat", messages };
  }
  if (kind === "post") {
    const m = /^@?([^:\s]+):\s*([\s\S]*)$/.exec(text);
    return m ? { type: "post", author: m[1], text: m[2] } : { type: "post", author: "", text };
  }
  return { type: "interludio", text };
}

function templateAttrs(b: Exclude<Block, { type: "p" }>): { kind: Template; name: string; text: string } {
  if (b.type === "chat") return { kind: "chat", name: "", text: b.messages.map((m) => (m.who ? `${m.who}: ${m.text}` : m.text)).join("\n") };
  if (b.type === "post") return { kind: "post", name: "", text: b.author ? `@${b.author}: ${b.text}` : b.text };
  if (b.type === "ficha") return { kind: "ficha", name: b.name, text: b.text };
  return { kind: "interludio", name: "", text: b.text };
}

/** Bloques guardados -> documento del editor. */
export function docFromBlocks(blocks: Block[]): JSONContent {
  const content = blocks.map((b): JSONContent => {
    if (b.type !== "p") return { type: "plantilla", attrs: templateAttrs(b) };
    const inline: JSONContent[] = [];
    for (const run of runs(b.text, b.marks)) {
      const marks = run.kinds.map((k) => ({ type: MARK_NAME[k] }));
      // Un salto de línea dentro del párrafo (Mayús+Enter) viaja como "\n".
      run.text.split("\n").forEach((piece, i) => {
        if (i > 0) inline.push({ type: "hardBreak" });
        if (piece) inline.push({ type: "text", text: piece, ...(marks.length ? { marks } : {}) });
      });
    }
    return { type: "paragraph", ...(b.align ? { attrs: { textAlign: b.align } } : {}), ...(inline.length ? { content: inline } : {}) };
  });
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

/** Documento del editor -> bloques para guardar. Los párrafos vacíos del principio y del final no se guardan. */
export function blocksFromDoc(doc: JSONContent): Block[] {
  const out: Block[] = [];
  for (const node of doc.content ?? []) {
    if (node.type === "plantilla") {
      const a = node.attrs ?? {};
      const block = templateBlock(a.kind as Template, String(a.name ?? ""), String(a.text ?? ""));
      if (block) out.push(block);
      continue;
    }
    if (node.type !== "paragraph") continue;
    let text = "";
    const marks: Mark[] = [];
    for (const child of node.content ?? []) {
      if (child.type === "hardBreak") { text += "\n"; continue; }
      if (child.type !== "text" || !child.text) continue;
      const start = text.length;
      text += child.text;
      for (const mark of child.marks ?? []) {
        const kind = MARK_KIND[mark.type];
        if (!kind) continue;
        // Si el tramo anterior tenía el mismo formato, se alarga en vez de abrir otro.
        const open = marks.find((m) => m[2] === kind && m[1] === start);
        if (open) open[1] = text.length;
        else marks.push([start, text.length, kind]);
      }
    }
    const align = node.attrs?.textAlign as Align | null | undefined;
    out.push({ type: "p", text, ...(align && align !== "left" ? { align } : {}), ...(marks.length ? { marks } : {}) });
  }
  const blank = (b: Block | undefined) => b?.type === "p" && !b.text.trim();
  while (blank(out[0])) out.shift();
  while (blank(out[out.length - 1])) out.pop();
  return out;
}

export function countWords(blocks: Block[]): number {
  const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  return blocks.reduce((n, b) => n + (b.type === "chat" ? b.messages.reduce((m, msg) => m + words(msg.text), 0) : words(b.text)), 0);
}
