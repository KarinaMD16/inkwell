import type { Metadata } from "next";
import { ImportPanel } from "@/components/ImportPanel";
import { MyWorks } from "@/components/MyWorks";
import { Btn } from "@/components/ui";

export const metadata: Metadata = { title: "Escribir" };

export default function Escribir() {
  return (
    <div className="stack-lg">
      <div className="row between wrap end">
        <h1 className="h-hero">Escribir</h1>
        <Btn href="/escribir/nueva" icon="plus">Nueva historia</Btn>
      </div>
      <MyWorks />
      <ImportPanel />
    </div>
  );
}
