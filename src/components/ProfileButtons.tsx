"use client";

import { useSession } from "./SessionProvider";
import { Btn, IconBtn } from "./ui";

/** Botones del perfil: si es el tuyo, atajos a escribir y ajustes. Seguir llega con la API de seguidores. */
export function ProfileButtons({ handle }: { handle: string }) {
  const { profile } = useSession();
  const isMe = profile?.handle === handle;
  return (
    <div className="row wrap">
      {isMe
        ? (<><Btn variant="ghost" href="/escribir" icon="pen">Tus historias</Btn><Btn variant="ghost" href="/ajustes" icon="settings">Ajustes</Btn></>)
        : <Btn icon="plus" disabled>Seguir</Btn>}
      <IconBtn icon="share" label="Compartir perfil" onClick={() => navigator.share?.({ url: location.href }).catch(() => {})} />
    </div>
  );
}
