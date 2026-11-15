"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleSignIn } from "./GoogleSignIn";
import { useSession } from "./SessionProvider";
import { Btn } from "./ui";

type Mode = "entrar" | "registro" | "recuperar";

const COPY: Record<Mode, { title: string; lead: string; submit: string }> = {
  entrar: { title: "Hola otra vez", lead: "Entra para seguir donde lo dejaste.", submit: "Entrar" },
  registro: { title: "Crea tu cuenta", lead: "Leer no pide cuenta. La necesitas para comentar, votar, guardar historias y publicar las tuyas.", submit: "Crear cuenta" },
  recuperar: { title: "Recupera tu contraseña", lead: "Escribe tu correo y te mandamos un enlace para crear una nueva.", submit: "Enviar enlace" },
};
const NEW_PASSWORD = { title: "Crea tu contraseña nueva", lead: "Escríbela una vez y queda cambiada.", submit: "Guardar contraseña" };

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="muted small">{hint}</span>}
    </label>
  );
}

/** La "G" de Google con sus cuatro colores oficiales; no se recolorea. */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.570-4.22-13.470-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/** Los mensajes de Supabase llegan en inglés; estos son los que una persona puede provocar. */
function explain(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Todavía no confirmas tu correo. Busca el mensaje de Inkwell y abre el enlace.";
  if (m.includes("already registered")) return "Ese correo ya tiene cuenta. Prueba entrar.";
  if (m.includes("rate limit") || m.includes("security purposes")) return "Demasiados intentos seguidos. Espera unos minutos y prueba de nuevo.";
  if (m.includes("different from the old password")) return "La contraseña nueva tiene que ser distinta de la anterior.";
  if (m.includes("password")) return "Esa contraseña no sirve: usa al menos 8 caracteres.";
  if (m.includes("failed to fetch") || m.includes("network")) return "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.";
  return `No se pudo completar: ${message}`;
}

/** ¿Está Google activado como proveedor en el proyecto de Supabase? */
async function googleEnabled(): Promise<boolean> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
  });
  const settings = await res.json();
  return Boolean(settings?.external?.google);
}

/**
 * Formularios de acceso, conectados a Supabase Auth (correo y Google). La sesión queda
 * en el navegador y SessionProvider se entera sola del cambio.
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { session, profile, signOut } = useSession();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  // Con sesión abierta (enlace del correo o "cambiar contraseña" en ajustes), /recuperar pide la contraseña nueva.
  const newPassword = mode === "recuperar" && Boolean(session);
  const already = Boolean(session) && mode !== "recuperar";
  const copy = newPassword ? NEW_PASSWORD : COPY[mode];

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget);
    const email = String(form.get("correo") ?? "").trim();
    const password = String(form.get("clave") ?? "");
    const auth = supabase().auth;
    setBusy(true);
    setError("");
    setDone("");
    try {
      if (newPassword) {
        const { error } = await auth.updateUser({ password });
        if (error) throw error;
        setDone("Contraseña cambiada.");
      } else if (mode === "entrar") {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      } else if (mode === "registro") {
        const handle = String(form.get("usuario") ?? "").trim().toLowerCase();
        const { data, error } = await auth.signUp({
          email,
          password,
          // El nombre de usuario se aplica al perfil la primera vez que la persona entra (ver SessionProvider).
          options: { data: { handle, birthdate: String(form.get("nacimiento") ?? "") }, emailRedirectTo: `${location.origin}/bienvenida` },
        });
        if (error) throw error;
        // Con confirmación por correo, un correo ya registrado no da error: devuelve un usuario sin identidades.
        if (data.user && data.user.identities?.length === 0) throw new Error("User already registered");
        if (data.session) router.push("/bienvenida");
        else setDone(`Te mandamos un correo a ${email}. Abre el enlace para confirmar tu cuenta y después entra.`);
      } else {
        const { error } = await auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/recuperar` });
        if (error) throw error;
        setDone(`Si ${email} tiene cuenta, le llegará un enlace para crear una contraseña nueva.`);
      }
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
  }

  /**
   * Respaldo por redirección, para cuando el botón propio de Google no carga (ver GoogleSignIn).
   * Sale a Google pasando por supabase.co y vuelve con la sesión abierta.
   */
  async function google() {
    if (busy) return;
    setBusy(true);
    setError("");
    setDone("");
    try {
      // Si el proveedor no está activado en Supabase, el salto termina en una página de error: mejor avisar aquí.
      if (!(await googleEnabled())) {
        setError("Entrar con Google todavía no está activado en el servidor. Usa tu correo por ahora.");
        return;
      }
      const { error } = await supabase().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}${mode === "registro" ? "/bienvenida" : "/"}`, queryParams: { prompt: "select_account" } },
      });
      if (error) throw error;
      // Sin error, el navegador ya está saliendo hacia Google.
    } catch (err) {
      setError(explain(err));
    } finally {
      setBusy(false);
    }
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
        {already ? (
          <div className="authcard">
            <div className="stack-sm">
              <h1 className="h-hero">Ya entraste</h1>
              <p className="muted lead">Estás en tu cuenta{profile ? ` como @${profile.handle}` : ""}.</p>
            </div>
            <Btn href="/" wide size="lg">Ir al inicio</Btn>
            <Btn variant="ghost" wide onClick={signOut}>Cerrar sesión</Btn>
          </div>
        ) : (
          <form className="authcard" onSubmit={submit}>
            <div className="stack-sm">
              <h1 className="h-hero">{copy.title}</h1>
              <p className="muted lead">{copy.lead}</p>
            </div>

            {mode !== "recuperar" && (
              <>
                <GoogleSignIn
                  onSignedIn={() => router.push(mode === "registro" ? "/bienvenida" : "/")}
                  onError={(err) => setError(explain(err))}
                  fallback={(
                    <button type="button" className="googlebtn" onClick={google} disabled={busy} aria-label="Continuar con Google" title="Continuar con Google">
                      <GoogleLogo />
                    </button>
                  )}
                />
                <div className="or"><span>o con tu correo</span></div>
              </>
            )}

            {mode === "registro" && (
              <Field label="Nombre de usuario" hint="Letras, números, punto y guion bajo. Así te verán: @tu.nombre">
                <input className="input" name="usuario" required minLength={3} maxLength={24} pattern="[A-Za-z0-9._]+" autoComplete="username" />
              </Field>
            )}
            {!newPassword && (
              <Field label="Correo">
                <input className="input" type="email" name="correo" required autoComplete="email" />
              </Field>
            )}
            {(mode !== "recuperar" || newPassword) && (
              <Field label={newPassword ? "Contraseña nueva" : "Contraseña"} hint={mode === "entrar" ? undefined : "Mínimo 8 caracteres."}>
                <span className="input input--with">
                  <input type={show ? "text" : "password"} name="clave" required minLength={8} autoComplete={mode === "entrar" ? "current-password" : "new-password"} />
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

            {error && <p className="notice" role="alert">{error}</p>}
            {done && <p className="notice" role="status">{done}{newPassword && <> <Link href="/">Ir al inicio</Link></>}</p>}
            <Btn type="submit" wide size="lg" disabled={busy}>{busy ? "Un momento…" : copy.submit}</Btn>

            <div className="row between wrap">
              {mode === "entrar" && (<><Link href="/recuperar" className="textlink">Olvidé mi contraseña</Link><Link href="/registro" className="textlink">Crear cuenta</Link></>)}
              {mode === "registro" && (<><Link href="/" className="textlink">Ahora no, seguir leyendo</Link><Link href="/entrar" className="textlink">Ya tengo cuenta</Link></>)}
              {mode === "recuperar" && !newPassword && <Link href="/entrar" className="textlink">Volver a entrar</Link>}
              {newPassword && <Link href="/ajustes" className="textlink">Volver a ajustes</Link>}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
