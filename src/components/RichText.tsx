import type { ReactNode } from "react";
import type { Mark } from "@/lib/data";
import { runs } from "@/lib/richtext";

/** El texto de un párrafo con su negrita, cursiva y subrayado. */
export function RichText({ text, marks }: { text: string; marks?: Mark[] }) {
  if (!marks?.length) return text;
  return runs(text, marks).map((run, i) => {
    let node: ReactNode = run.text;
    if (run.kinds.includes("u")) node = <u>{node}</u>;
    if (run.kinds.includes("i")) node = <em>{node}</em>;
    if (run.kinds.includes("b")) node = <strong>{node}</strong>;
    return <span key={i}>{node}</span>;
  });
}
