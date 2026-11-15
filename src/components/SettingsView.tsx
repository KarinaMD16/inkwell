"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { me } from "@/lib/data";
import { Icon } from "./Icon";
import { Btn, Leader } from "./ui";

interface Settings { mature: boolean; blocked: string[]; nChapters: boolean; nReplies: boolean; nFollowers: boolean }
const DEFAULTS: Settings = { mature: false, blocked: ["Muerte de personaje"], nChapters: true, nReplies: true, nFollowers: false };
const KEY = "inkwell:ajustes";

function Switch({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <div className="switchrow">
      <span>{children}</span>
      <button type="button" role="switch" aria-checked={on} className="switch" onClick={() => onChange(!on)}><span /></button>
    </div>
  );
}

export function SettingsView() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [tag, setTag] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee una vez al montar
      if (raw) setS({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* sin almacenamiento */ }
  }, []);
  function update(patch: Partial<Settings>) {
    setS((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* nada */ }
      return next;
    });
  }
  function addTag() {
    const t = tag.trim();
    if (t && !s.blocked.includes(t)) update({ blocked: [...s.blocked, t] });
    setTag("");
  }

  return (
    <div className="stack-lg narrow">
      <h1 className="h-hero">Ajustes</h1>
      <p className="notice" role="status">Estos ajustes se guardan en este navegador hasta que exista la cuenta en el servidor.</p>

      <section className="card">
        <div className="shelflabel">Cuenta</div>
        <Leader k="Usuario">@{me.handle}</Leader>
        <Leader k="Correo">[TU CORREO]</Leader>
        <div className="row wrap">
          <Btn variant="ghost" size="sm" href={`/perfil/${me.handle}`} icon="eye">Ver mi perfil</Btn>
          <Btn variant="ghost" size="sm" href="/recuperar">Cambiar contraseña</Btn>
        </div>
      </section>

      <section className="card">
        <div className="shelflabel">Lectura</div>
        <Switch on={s.mature} onChange={(v) => update({ mature: v })}>
          <strong>Mostrar historias +16 y +18</strong>
          <span className="muted small">Solo disponible en la web y para mayores de edad.</span>
        </Switch>
        <div className="facet">
          <strong>Etiquetas bloqueadas</strong>
          <span className="muted small">Las historias con estas etiquetas no aparecen en tus resultados.</span>
          <div className="chips">
            {s.blocked.map((t) => (
              <button key={t} type="button" className="tag tag--out" onClick={() => update({ blocked: s.blocked.filter((x) => x !== t) })} aria-label={`Dejar de bloquear ${t}`}>
                <Icon name="x" size={14} stroke={2.4} />{t}
              </button>
            ))}
          </div>
          <div className="row">
            <input className="input" value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Agregar etiqueta" aria-label="Etiqueta a bloquear" />
            <Btn variant="ghost" size="sm" icon="plus" onClick={addTag}>Bloquear</Btn>
          </div>
        </div>
        <p className="muted small">El tamaño de letra y el tema se cambian desde el lector, con el botón «Aa».</p>
      </section>

      <section className="card">
        <div className="shelflabel">Notificaciones</div>
        <Switch on={s.nChapters} onChange={(v) => update({ nChapters: v })}><strong>Capítulos nuevos</strong><span className="muted small">De las historias de tu repisa.</span></Switch>
        <Switch on={s.nReplies} onChange={(v) => update({ nReplies: v })}><strong>Respuestas y comentarios</strong><span className="muted small">Cuando alguien te responde o comenta tu historia.</span></Switch>
        <Switch on={s.nFollowers} onChange={(v) => update({ nFollowers: v })}><strong>Seguidores nuevos</strong></Switch>
      </section>

      <section className="card">
        <div className="shelflabel">Sesión</div>
        <div className="row wrap">
          <Btn variant="ink" href="/entrar">Cerrar sesión</Btn>
          <Link href="/privacidad" className="textlink">Privacidad</Link>
          <Link href="/terminos" className="textlink">Términos</Link>
        </div>
      </section>
    </div>
  );
}
