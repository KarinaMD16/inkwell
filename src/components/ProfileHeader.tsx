"use client";

import Link from "next/link";
import type { Author } from "@/lib/data";
import { useEffect, useState } from "react";
import { joinedOn, prettyLink, SAVED_FLAG } from "@/lib/profile";
import { Icon } from "./Icon";
import { ProfileButtons } from "./ProfileButtons";
import { useSession } from "./SessionProvider";
import { Avatar } from "./ui";

/**
 * Cabecera del perfil: portada, foto, nombre, descripción y enlace.
 * La página llega del servidor (y queda en caché unos minutos); si es tu propio perfil,
 * se muestran tus datos recién guardados en Ajustes sin esperar a que venza esa caché.
 */
export function ProfileHeader({ author, works }: { author: Author; works: number }) {
  const { profile } = useSession();
  const [justSaved, setJustSaved] = useState(false);
  // Si llegaste aquí desde "Guardar cambios", un aviso breve lo confirma.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SAVED_FLAG)) {
        sessionStorage.removeItem(SAVED_FLAG);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una vez al llegar
        setJustSaved(true);
      }
    } catch { /* sin almacenamiento */ }
  }, []);
  const mine = profile && profile.handle === author.handle ? profile : null;
  const a = mine
    ? { ...author, name: mine.name, bio: mine.bio, link: mine.link, avatarUrl: mine.avatarUrl, bannerUrl: mine.bannerUrl }
    : author;

  return (
    <section className="profile">
      <div className="profile__banner" style={a.bannerUrl ? { backgroundImage: `url("${a.bannerUrl}")` } : { background: a.color }} />
      <div className="profile__body">
        <div className="profile__avatar"><Avatar letter={a.name[0] ?? "?"} color={a.color} size={128} src={a.avatarUrl} /></div>
        <div className="stack-sm" style={{ flex: "1 1 300px", minWidth: 0 }}>
          <h1 className="h-hero">{a.name}</h1>
          <strong className="muted">@{a.handle}</strong>
          {a.bio ? <p className="prose profile__bio">{a.bio}</p> : mine
            ? <p className="muted">Todavía no escribiste tu descripción. <Link href="/ajustes/perfil" className="textlink" style={{ minHeight: 0 }}>Agrégala</Link></p>
            : <p className="muted">Todavía no escribió su presentación.</p>}
          <div className="row wrap profile__meta">
            {a.link && (
              <a href={a.link} target="_blank" rel="noopener noreferrer nofollow ugc" className="textlink row" style={{ gap: 6 }}>
                <Icon name="link" size={16} stroke={2} />{prettyLink(a.link)}
              </a>
            )}
            {a.joined && <span className="muted small row" style={{ gap: 6 }}><Icon name="calendar" size={16} />Se unió en {joinedOn(a.joined)}</span>}
          </div>
          {/* Seguidores y siguiendo vuelven cuando la API tenga "seguir". */}
          <div className="stats"><span><b>{works}</b>Historias</span></div>
        </div>
        <ProfileButtons handle={a.handle} />
      </div>
      <div className="toast" role="status">
        {justSaved && <span className="toast__pill"><Icon name="check" size={16} stroke={2.6} />Cambios guardados</span>}
      </div>
    </section>
  );
}
