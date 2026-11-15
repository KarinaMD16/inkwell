import type { Metadata } from "next";
import Image from "next/image";
import { OnboardingPicker } from "@/components/OnboardingPicker";

export const metadata: Metadata = { title: "Bienvenida" };

export default function Bienvenida() {
  return (
    <div className="welcome">
      <div className="welcome__brand">
        <div className="row" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26 }}>
          <Image src="/inkwell-mark-paper.svg" alt="" width={56} height={56} />Inkwell
        </div>
        <div className="stack">
          <Image src="/inkwell-mark-paper.svg" alt="" width={220} height={220} className="welcome__mascot" />
          <p className="welcome__claim">Historias sin anuncios en medio del capítulo.</p>
        </div>
        <span className="small">by Koral Studio</span>
      </div>
      <main className="welcome__main">
        <div className="stack-lg" style={{ width: "100%", maxWidth: 720 }}>
          <div className="row"><div className="steps" role="img" aria-label="Paso 2 de 3"><span className="is-on" /><span className="is-on" /><span /></div><span className="muted small">Paso 2 de 3</span></div>
          <div><h1 className="h-hero">¿Qué te gusta leer?</h1><p className="muted lead">Con eso armamos tu escritorio y tus estantes.</p></div>
          <OnboardingPicker />
        </div>
      </main>
    </div>
  );
}
