import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorSkeleton } from "@/components/Skeleton";
import { EditorLoader } from "@/components/EditorLoader";

export const metadata: Metadata = { title: "Editor" };

export default function Editor() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditorLoader />
    </Suspense>
  );
}
