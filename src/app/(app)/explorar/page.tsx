import type { Metadata } from "next";
import { Suspense } from "react";
import { Explorer } from "@/components/Explorer";
import { getStories } from "@/lib/data";

export const metadata: Metadata = { title: "Explorar" };

export default function Explorar() {
  return (
    <Suspense fallback={<p className="muted">Acomodando los estantes…</p>}>
      <Explorer stories={getStories()} />
    </Suspense>
  );
}
