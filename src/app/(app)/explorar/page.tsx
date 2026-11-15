import type { Metadata } from "next";
import { Suspense } from "react";
import { Explorer } from "@/components/Explorer";
import { getStories } from "@/lib/queries";

export const metadata: Metadata = { title: "Explorar" };

export default async function Explorar() {
  const stories = await getStories();
  return (
    <Suspense fallback={<p className="muted">Acomodando los estantes…</p>}>
      <Explorer stories={stories} />
    </Suspense>
  );
}
