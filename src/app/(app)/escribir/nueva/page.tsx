import type { Metadata } from "next";
import { NewStoryForm } from "@/components/NewStoryForm";
import { Scribble } from "@/components/ui";

export const metadata: Metadata = { title: "Nueva historia" };

export default function Nueva() {
  return (
    <div className="stack-lg">
      <div><h1 className="h-hero">Nueva historia</h1><Scribble width={240} /></div>
      <NewStoryForm />
    </div>
  );
}
