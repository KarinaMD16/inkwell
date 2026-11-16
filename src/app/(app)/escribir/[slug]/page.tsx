import type { Metadata } from "next";
import { Suspense } from "react";
import { WorksSkeleton } from "@/components/Skeleton";
import { StoryManager } from "@/components/StoryManager";

export const metadata: Metadata = { title: "Trabajar en la historia" };

export default function Gestionar() {
  return (
    <Suspense fallback={<WorksSkeleton />}>
      <StoryManager />
    </Suspense>
  );
}
