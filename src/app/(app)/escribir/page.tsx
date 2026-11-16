import type { Metadata } from "next";
import { MyWorks } from "@/components/MyWorks";
import { Btn } from "@/components/ui";

export const metadata: Metadata = { title: "Mis historias" };

export default function MisHistorias() {
  return (
    <div className="stack-lg">
      <div className="row between wrap end">
        <h1 className="h-hero">Mis historias</h1>
        <Btn href="/escribir/nueva" icon="plus">Nueva historia</Btn>
      </div>
      <MyWorks />
    </div>
  );
}
