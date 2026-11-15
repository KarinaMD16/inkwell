"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { Btn } from "./ui";

type Mode = "entrar" | "registro" | "recuperar";

const COPY: Record<Mode, { title: string; lead: string; submit: string }> = {
  entrar: { title: "Hola otra vez", lead: "Entra para seguir donde lo dejaste.", submit: "Entrar" },
  registro: { title: "Crea tu cuenta", lead: "Leer no pide cuenta. La necesitas para comentar, votar, guardar historias y publicar las tuyas.", submit: "Crear cuenta" },
  recuperar: { title: "Recupera tu contraseña", lead: "Escribe tu correo y te mandamos un enlace para crear una nueva.", submit: "Enviar enlace" },
};

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="muted small">{hint}</span>}
    </label>
  );
}

/**
 * Formularios de acceso. La validación es la del navegador; el envío real
 * se conecta con Supabase Auth, así que por ahora solo avisa que falta.
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const [show, setShow] = useState(false);
  const [sent, setSent] = useState(false);
  const copy = COPY[mode];

  function submit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="welcome">
      <div className="welcome__brand">
        <Link href="/" className="row" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: "#fff", textDecoration: "none" }}>
          <Image src="/inkwell-mark-paper.svg" alt="" width={56} height={56} />Inkwell
        </Link>
        <div className="stack">
          <Image src="/inkwell-mark-paper.svg" alt="" width={200} height={200} className="welcome__mascot" />
          <p className="welcome__claim">Historias sin anuncios en medio del capítulo.</p>
        </div>
        <span className="small">by Koral Studio</span>
      </div>

      <main className="welcome__main">
        <form className="authcard" onSubmit={submit}>
          <div className="stack-sm">
            <h1 className="h-hero">{copy.title}</h1>
            <p className="muted lead">{copy.lead}</p>
          </div>

          {mode !== "recuperar" && (
            <>
              <Btn variant="ink" wide onClick={() => setSent(true)}>Continuar con Google</Btn>
              <div className="or"><span>o con tu correo</span></div>
            </>
          )}

          {mode === "registro" && (
            <Field label="Nombre de usuario" hint="Letras, números, punto y guion bajo. Así te verán: @tu.nombre">
              <input className="input" name="usuario" required minLength={3} maxLength={24} pattern="[A-Za-z0-9._]+" autoComplete="username" />
            </Field>
          )}
          <Field label="Correo">
            <input className="input" type="email" name="correo" required autoComplete="email" />
          </Field>
          {mode !== "recuperar" && (
            <Field label="Contraseña" hint={mode === "registro" ? "Mínimo 8 caracteres." : undefined}>
              <span className="input input--with">
                <input type={show ? "text" : "password"} name="clave" required minLength={8} autoComplete={mode === "registro" ? "new-password" : "current-password"} />
                <button type="button" className="linkbtn" onClick={() => setShow((v) => !v)} aria-pressed={show}>{show ? "Ocultar" : "Mostrar"}</button>
              </span>
            </Field>
          )}
          {mode === "registro" && (
            <>
              <Field label="Fecha de nacimiento" hint="La usamos solo para mostrarte contenido apto para tu edad.">
                <input className="input" type="date" name="nacimiento" required />
              </Field>
              <label className="check">
                <input type="checkbox" required />
                <span>Acepto los <Link href="/terminos">términos</Link> y la <Link href="/privacidad">política de privacidad</Link>.</span>
              </label>
            </>
          )}

          {sent && (
            <p className="notice" role="status">
              El acceso todavía no está conectado al servidor, así que no se creó ni se abrió ninguna cuenta.{" "}
              <Link href={mode === "registro" ? "/bienvenida" : "/"}>Seguir con la cuenta de muestra</Link>
            </p>
          )}
          <Btn type="submit" wide size="lg">{copy.submit}</Btn>

          <div className="row between wrap">
            {mode === "entrar" && (<><Link href="/recuperar" className="textlink">Olvidé mi contraseña</Link><Link href="/registro" className="textlink">Crear cuenta</Link></>)}
            {mode === "registro" && (<><Link href="/" className="textlink">Ahora no, seguir leyendo</Link><Link href="/entrar" className="textlink">Ya tengo cuenta</Link></>)}
            {mode === "recuperar" && <Link href="/entrar" className="textlink">Volver a entrar</Link>}
          </div>
        </form>
      </main>
    </div>
  );
}
