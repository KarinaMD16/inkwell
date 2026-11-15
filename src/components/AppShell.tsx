"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { colorFor } from "@/lib/data";
import { Icon, type IconName } from "./Icon";
import { useSession } from "./SessionProvider";
import { Avatar, Btn, IconBtn } from "./ui";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/explorar", label: "Explorar", icon: "search" },
  { href: "/biblioteca", label: "Biblioteca", icon: "library" },
  { href: "/escribir", label: "Escribir", icon: "pen" },
  { href: "/novedades", label: "Novedades", icon: "bell" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { ready, session, profile, signOut } = useSession();
  const isOn = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <div className="shell">
      <nav className="side" aria-label="Principal">
        <Link href="/" aria-label="Inkwell, inicio" className="side__logo">
          <Image src="/inkwell-mark.svg" alt="" width={52} height={52} priority />
        </Link>
        <div className="side__nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`side__link${isOn(n.href) ? " is-on" : ""}`} aria-current={isOn(n.href) ? "page" : undefined}>
              <Icon name={n.icon} size={22} stroke={isOn(n.href) ? 2.2 : 1.8} />
              <span>{n.label}</span>
            </Link>
          ))}
        </div>
        <Link href="/ajustes" className={`side__link side__settings${isOn("/ajustes") ? " is-on" : ""}`} aria-current={isOn("/ajustes") ? "page" : undefined}>
          <Icon name="settings" size={22} />
          <span>Ajustes</span>
        </Link>
      </nav>
      <div className="shell__main">
        <header className="topbar">
          <form className="searchpill" action="/explorar" role="search">
            <Icon name="search" />
            <input name="q" type="search" placeholder="Busca historias, autores o etiquetas" aria-label="Buscar" />
          </form>
          <div className="topbar__right">
            <span className="only-desktop"><Btn variant="ghost" href="/escribir" icon="pen">Escribir</Btn></span>
            <span className="only-desktop"><IconBtn icon="bell" label="Novedades" href="/novedades" /></span>
            {profile ? (
              <Link href={`/perfil/${profile.handle}`} aria-label="Tu perfil" style={{ display: "flex" }}>
                <Avatar letter={profile.name[0].toUpperCase()} color={colorFor(profile.handle)} />
              </Link>
            ) : ready && !session ? (
              <Btn href="/entrar">Entrar</Btn>
            ) : null}
          </div>
        </header>
        <main className="content">{children}</main>
        <footer className="foot">
          <span>Inkwell · by Koral Studio</span>
          {session ? <button type="button" className="linkbtn" onClick={signOut}>Cerrar sesión</button> : <Link href="/entrar">Entrar</Link>}
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/terminos">Términos</Link>
        </footer>
      </div>
    </div>
  );
}
