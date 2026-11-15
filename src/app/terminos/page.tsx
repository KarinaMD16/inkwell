import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Términos de uso" };

export default function Page() {
  return (
    <main className="center">
      <div className="authcard">
        <h1 className="h-page">Términos de uso</h1>
        <p className="prose">[PENDIENTE: redactar este texto antes de publicar. Google Play exige que esta página exista en inkwell.koralstudio.online.]</p>
        <Link href="/" className="textlink">Volver al inicio</Link>
      </div>
    </main>
  );
}
