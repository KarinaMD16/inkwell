"use client";

import Link from "next/link";
import { useAuthHref } from "@/lib/useAuthHref";
import { Icon } from "./Icon";
import { ProfileEditor } from "./ProfileEditor";
import { ProfileEditorSkeleton } from "./Skeleton";
import { useSession } from "./SessionProvider";
import { Btn } from "./ui";

/** Página "Editar perfil": todo lo que se ve en tu perfil público, en un solo lugar. */
export function EditProfileView() {
  const { ready, session } = useSession();
  const auth = useAuthHref();
  return (
    <div className="stack-lg narrow">
      <div className="stack-sm">
        <Link href="/ajustes" className="textlink row" style={{ gap: 6, alignSelf: "flex-start" }} data-anim><Icon name="back" size={18} stroke={2} />Ajustes</Link>
        <h1 className="h-hero">Editar perfil</h1>
        <p className="muted lead">Así te ven quienes leen tus historias. Tu correo y tu fecha de nacimiento nunca se muestran.</p>
      </div>
      {session ? (
        <ProfileEditor />
      ) : !ready ? (
        <section className="card"><ProfileEditorSkeleton /></section>
      ) : ready ? (
        <section className="card">
          <p>Entra a tu cuenta para editar tu perfil.</p>
          <div className="row wrap"><Btn href={auth.entrar}>Entrar</Btn><Btn variant="ghost" href={auth.registro}>Crear cuenta</Btn></div>
        </section>
      ) : null}
    </div>
  );
}
