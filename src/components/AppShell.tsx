"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { colorFor } from "@/lib/data";
import { atLeast } from "@/lib/profile";
import { useAuthHref } from "@/lib/useAuthHref";
import { Icon, type IconName } from "./Icon";
import { useSession } from "./SessionProvider";
import { Avatar, Btn, IconBtn } from "./ui";
import { WriteMenu } from "./WriteMenu";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/explorar", label: "Explorar", icon: "search" },
  { href: "/biblioteca", label: "Biblioteca", icon: "library" },
  { href: "/escribir", label: "Escribir", icon: "pen" },
  { href: "/novedades", label: "Novedades", icon: "bell" },
];

/** Los enlaces de la barra. `path` es null mientras no se conoce la ruta: se pintan sin marcar ninguno. */
function SideLinks({ path }: { path: string | null }) {
  const isOn = (href: string) => path !== null && (href === "/" ? path === "/" : path.startsWith(href));
  // Moderación y administración ven su panel; el resto no sabe que existe.
  const staff = atLeast(useSession().profile?.role, "moderador");
  return (
    <>
      <div className="side__nav">
        {NAV.map((n) => n.href === "/escribir" ? (
          // Escribir no es una página sino dos caminos: ver tus historias o empezar una.
          <WriteMenu key={n.href} variant="side" active={isOn(n.href)} />
        ) : (
          <Link key={n.href} href={n.href} className={`side__link${isOn(n.href) ? " is-on" : ""}`} aria-current={isOn(n.href) ? "page" : undefined}>
            <Icon name={n.icon} size={22} stroke={isOn(n.href) ? 2.2 : 1.8} />
            <span>{n.label}</span>
          </Link>
        ))}
      </div>
      {staff && (
        <Link href="/admin" className={`side__link side__admin${isOn("/admin") ? " is-on" : ""}`} aria-current={isOn("/admin") ? "page" : undefined}>
          <Icon name="idcard" size={22} stroke={isOn("/admin") ? 2.2 : 1.8} />
          <span>Admin</span>
        </Link>
      )}
      <Link href="/ajustes" className={`side__link side__settings${isOn("/ajustes") ? " is-on" : ""}`} aria-current={isOn("/ajustes") ? "page" : undefined}>
        <Icon name="settings" size={22} />
        <span>Ajustes</span>
      </Link>
    </>
  );
}
function CurrentSideLinks() {
  return <SideLinks path={usePathname()} />;
}
/** "Entrar" que devuelve a la página actual después de iniciar sesión. */
function EnterBtn() {
  return <Btn href={useAuthHref().entrar}>Entrar</Btn>;
}
function EnterLink() {
  return <Link href={useAuthHref().entrar}>Entrar</Link>;
}

// Lo que depende de la ruta va dentro de <Suspense>: en las páginas cuya dirección solo se conoce al
// abrirlas (como /escribir/<historia>), el resto del marco igual se puede adelantar ya pintado.
export function AppShell({ children }: { children: ReactNode }) {
  const { ready, session, profile, signOut } = useSession();
  return (
    <div className="shell">
      <nav className="side" aria-label="Principal">
        <Link href="/" aria-label="Inkwell, inicio" className="side__logo">
          <Image src="/inkwell-mark.svg" alt="" width={52} height={52} priority />
        </Link>
        <Suspense fallback={<SideLinks path={null} />}><CurrentSideLinks /></Suspense>
      </nav>
      <div className="shell__main">
        <header className="topbar">
          <form className="searchpill" action="/explorar" role="search" data-anim>
            <Icon name="search" />
            <input name="q" type="search" placeholder="Busca historias, autores o etiquetas" aria-label="Buscar" />
          </form>
          <div className="topbar__right">
            <span className="only-desktop"><WriteMenu variant="top" /></span>
            <span className="only-desktop"><IconBtn icon="bell" label="Novedades" href="/novedades" /></span>
            {profile ? (
              <Link href={`/perfil/${profile.handle}`} aria-label="Tu perfil" style={{ display: "flex" }}>
                <Avatar letter={profile.name[0].toUpperCase()} color={colorFor(profile.handle)} src={profile.avatarUrl} />
              </Link>
            ) : session ? (
              // Sesión abierta pero el perfil no llegó (o todavía no): igual se muestra tu cuenta.
              <Link href="/ajustes" aria-label="Tu cuenta" style={{ display: "flex" }}>
                <Avatar letter={(session.user.email?.[0] ?? "?").toUpperCase()} color={colorFor(session.user.id)} />
              </Link>
            ) : !ready ? (
              <span className="sk" style={{ width: 44, height: 44, borderRadius: "50%" }} aria-hidden="true" />
            ) : (
              <Suspense fallback={<Btn href="/entrar">Entrar</Btn>}><EnterBtn /></Suspense>
            )}
          </div>
        </header>
        {profile?.suspendedAt && (
          <p className="notice notice--error suspended" role="status">
            Tu cuenta está suspendida{profile.suspendedReason ? `: ${profile.suspendedReason}` : ""}. Puedes seguir leyendo, pero no escribir ni publicar, y tu perfil no se ve. Desde <Link href="/ajustes">Ajustes</Link> puedes descargar tus datos o borrar tu cuenta.
          </p>
        )}
        <main className="content">{children}</main>
        <footer className="foot">
          <span>Inkwell · by Koral Studio</span>
          {session ? <button type="button" className="linkbtn" onClick={signOut}>Cerrar sesión</button> : <Suspense fallback={<Link href="/entrar">Entrar</Link>}><EnterLink /></Suspense>}
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/terminos">Términos</Link>
        </footer>
      </div>
    </div>
  );
}
