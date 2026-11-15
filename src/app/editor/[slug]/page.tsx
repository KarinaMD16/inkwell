import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorLoader } from "@/components/EditorLoader";

export const metadata: Metadata = { title: "Editor" };

export default function Editor() {
  return (
    <Suspense fallback={null}>
      <EditorLoader />
    </Suspense>
  );
}
