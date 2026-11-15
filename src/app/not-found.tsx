import Image from "next/image";
import { Btn } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="center">
      <div className="authcard" style={{ alignItems: "center", textAlign: "center" }}>
        <Image src="/inkwell-mark.svg" alt="" width={120} height={120} />
        <h1 className="h-page">Este libro no está en la repisa</h1>
        <p className="muted lead">Puede que lo hayan movido o que el enlace tenga un error.</p>
        <Btn href="/" icon="home">Volver a tu escritorio</Btn>
      </div>
    </main>
  );
}
