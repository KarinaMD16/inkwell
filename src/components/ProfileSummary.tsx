"use client";

import { colorFor } from "@/lib/data";
import { prettyLink } from "@/lib/profile";
import { ProfileLoading } from "./ProfileError";
import { ProfileSummarySkeleton } from "./Skeleton";
import { useSession } from "./SessionProvider";
import { Avatar, Btn } from "./ui";

/** Tarjeta de Ajustes con tu perfil tal como se ve, y el acceso a editarlo. */
export function ProfileSummary() {
  const { profile } = useSession();
  return (
    <section className="card" aria-labelledby="resumen-perfil">
      <div className="shelflabel" id="resumen-perfil">Tu perfil</div>
      {profile ? (
        <>
          <div className="profilesum">
            <div className="profilesum__banner" style={profile.bannerUrl ? { backgroundImage: `url("${profile.bannerUrl}")` } : { background: colorFor(profile.handle) }} />
            <div className="profilesum__body">
              <span className="profilesum__avatar"><Avatar letter={profile.name[0] ?? "?"} color={colorFor(profile.handle)} size={72} src={profile.avatarUrl} /></span>
              <div className="stack-sm" style={{ minWidth: 0, gap: 2 }}>
                <strong className="profilesum__name">{profile.name}</strong>
                <span className="muted small">@{profile.handle}{profile.link ? ` · ${prettyLink(profile.link)}` : ""}</span>
              </div>
            </div>
            <p className={profile.bio ? "profilesum__bio" : "profilesum__bio muted"}>{profile.bio || "Todavía no escribiste tu descripción."}</p>
          </div>
          <div className="row wrap">
            <Btn href="/ajustes/perfil" icon="pen">Editar perfil</Btn>
            <Btn variant="ghost" href={`/perfil/${profile.handle}`} icon="eye">Ver mi perfil</Btn>
          </div>
        </>
      ) : (
        <ProfileLoading skeleton={<ProfileSummarySkeleton />} />
      )}
    </section>
  );
}
