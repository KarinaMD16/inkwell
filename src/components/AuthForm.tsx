"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { api } from "@/lib/api";
import { isNewAccount } from "@/lib/newAccount";
import { authHref, safeNext } from "@/lib/next";
import { supabase } from "@/lib/supabase";
import { claveNuevaSchema, entrarSchema, recuperarSchema, registroSchema, validate, type FieldErrors } from "@/lib/validation";
import { Checkbox } from "./Checkbox";
import { DateField } from "./DateField";
import { GoogleSignIn } from "./GoogleSignIn";
import { Icon } from "./Icon";
import { useSession } from "./SessionProvider";
import { Btn } from "./ui";

type Mode = "entrar" | "registro" | "recuperar";

const COPY: Record<Mode, { title: string; lead: string; submit: string }> = {
  entrar: { title: "Hola otra vez", lead: "Entra para seguir donde lo dejaste.", submit: "Entrar" },
  registro: { title: "Crea tu cuenta", lead: "Leer no pide cuenta. La necesitas para comentar, votar, guardar historias y publicar las tuyas.", submit: "Crear cuenta" },
  recuperar: { title: "Recupera tu contraseña", lead: "Escribe tu correo y te mandamos un enlace para crear una nueva.", submit: "Enviar enlace" },
};
const NEW_PASSWORD = { title: "Crea tu contraseña nueva", lead: "Escríbela dos veces y queda cambiada.", submit: "Guardar contraseña" };

/** Campo con su etiqueta, su ayuda y su error. El error reemplaza a la ayuda y lo anuncian los lectores de pantalla. */
function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      {children}
      {error
        ? <span className="field__error" id={`${id}-msg`} role="alert"><Icon name="alert" size={16} stroke={2.2} />{error}</span>
        : hint && <span className="muted small" id={`${id}-msg`}>{hint}</span>}
    </div>
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
  // Llave pública mal puesta en .env (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY): es un problema de configuración, no de la persona.
  if (m.includes("invalid api key") || m.includes("no api key")) return "El servicio de cuentas no está disponible en este momento. Intenta más tarde.";
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Todavía no confirmas tu correo. Busca el mensaje de Inkwell y abre el enlace.";
  if (m.includes("already registered")) return "Ese correo ya tiene cuenta. Prueba entrar.";
  if (m.includes("rate limit") || m.includes("security purposes")) return "Demasiados intentos seguidos. Espera unos minutos y prueba de nuevo.";
  if (m.includes("different from the old password")) return "La contraseña nueva tiene que ser distinta de la anterior.";
  if (m.includes("expired") || m.includes("invalid") && m.includes("link")) return "Ese enlace ya venció o ya se usó. Pide uno nuevo.";
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
 * Formularios de acceso, conectados a Supabase Auth (correo y Google). Los datos se validan
 * con zod antes de enviarse y cada error aparece junto a su campo. La sesión queda en el
 * navegador y SessionProvider se entera sola del cambio.
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { session, profile, signOut } = useSession();
  const formRef = useRef<HTMLFormElement>(null);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  /** Correo que todavía no confirmó su cuenta: habilita "Reenviar correo". */
  const [pending, setPending] = useState("");
  const [resent, setResent] = useState(false);
  /** Registro enviado: en lugar del formulario se muestra "Revisa tu correo". */
  const [sentTo, setSentTo] = useState<{ email: string; again: boolean } | null>(null);
  /** Página a la que se vuelve después de entrar (?next=/ruta). */
  const [next, setNext] = useState<string | null>(null);
  // Con sesión abierta (enlace del correo o "cambiar contraseña" en ajustes), /recuperar pide la contraseña nueva.
  const newPassword = mode === "recuperar" && Boolean(session);
  const already = Boolean(session) && mode !== "recuperar" && !busy;
  const copy = newPassword ? NEW_PASSWORD : COPY[mode];
  const home = mode === "registro" ? "/bienvenida" : "/";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la dirección solo existe en el navegador
    setNext(safeNext(new URLSearchParams(location.search).get("next")));
    // Un enlace de correo vencido vuelve con el motivo después del "#".
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    const problem = hash.get("error_description") ?? hash.get("error_code");
    if (problem) {
      setError(explain(new Error(problem.replace(/\+/g, " "))));
      history.replaceState(null, "", location.pathname + location.search);
    }
  }, []);

  /** Quita el error de un campo en cuanto la persona lo corrige. */
  function clear(field: string) {
    if (errors[field]) setErrors((all) => Object.fromEntries(Object.entries(all).filter(([key]) => key !== field)));
  }
  function fail(found: FieldErrors) {
    setErrors(found);
    const first = Object.keys(found)[0];
    const target = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]:not([type="hidden"]), [data-field="${first}"] button`);
    target?.focus();
  }
  const invalid = (field: string) => ({ "aria-invalid": errors[field] ? true : undefined, "aria-describedby": `${field}-msg` });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const auth = supabase().auth;
    setError("");
    setDone("");
    setPending("");
    setResent(false);

    const schema = newPassword ? claveNuevaSchema : mode === "entrar" ? entrarSchema : mode === "registro" ? registroSchema : recuperarSchema;
    const checked = validate<Record<string, string>>(schema, values);
    if (!checked.ok) return fail(checked.errors);
    setErrors({});
    const { correo: email, clave: password, usuario: handle, nacimiento } = checked.data;

    setBusy(true);
    let leaving = false; // al cambiar de página el botón se queda en "Un momento…"
    try {
      if (newPassword) {
        const { error } = await auth.updateUser({ password });
        if (error) throw error;
        setDone("Contraseña cambiada.");
        formRef.current?.reset();
      } else if (mode === "entrar") {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) setPending(email);
          throw error;
        }
        leaving = true;
        router.replace(next ?? home);
        return;
      } else if (mode === "registro") {
        // El nombre de usuario se revisa antes de crear la cuenta, para no descubrirlo ocupado después.
        const taken = await api(`/profiles/${encodeURIComponent(handle)}`).then(() => true, () => false);
        if (taken) return fail({ usuario: "Ese nombre de usuario ya está en uso. Prueba con otro." });
        const { data, error } = await auth.signUp({
          email,
          password,
          // El nombre de usuario se aplica al perfil la primera vez que la persona entra (ver SessionProvider).
          options: { data: { handle, birthdate: nacimiento }, emailRedirectTo: `${location.origin}/bienvenida` },
        });
        if (error) throw error;
        // Con confirmación por correo, un correo ya registrado no da error: devuelve un usuario sin identidades.
        if (data.user && data.user.identities?.length === 0) return fail({ correo: "Ese correo ya tiene cuenta. Prueba entrar." });
        // Si el correo ya se había registrado pero falta confirmarlo, Supabase no da error: reenvía el
        // correo y deja la cuenta como estaba (mismo usuario y misma contraseña). Se nota porque la
        // cuenta se creó antes que este envío; las dos fechas vienen del mismo servidor.
        const sent = Date.parse(data.user?.confirmation_sent_at ?? "");
        const created = Date.parse(data.user?.created_at ?? "");
        if (sent - created > 10_000) {
          setSentTo({ email, again: true });
          return;
        }
        if (data.session) {
          leaving = true;
          router.replace(home);
          return;
        }
        setSentTo({ email, again: false });
      } else {
        const { error } = await auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/recuperar` });
        if (error) throw error;
        setDone(`Si ${email} tiene cuenta, le llegará un enlace para crear una contraseña nueva.`);
      }
    } catch (err) {
      setError(explain(err));
    } finally {
      if (!leaving) setBusy(false);
    }
  }

  /** Después de entrar con Google: las cuentas nuevas pasan por el onboarding, las demás siguen de largo. */
  async function afterGoogle() {
    setBusy(true);
    const { data } = await supabase().auth.getSession();
    router.replace(isNewAccount(data.session?.user) ? "/bienvenida" : next ?? "/");
  }

  async function resend() {
    const to = sentTo?.email ?? pending;
    if (!to || busy) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase().auth.resend({ type: "signup", email: to, options: { emailRedirectTo: `${location.origin}/bienvenida` } });
      if (error) throw error;
      setResent(true);
    } catch (err) {
      setError(explain(err));
    }
    setBusy(false);
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
        options: { redirectTo: `${location.origin}${next ?? home}`, queryParams: { prompt: "select_account" } },
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
        {sentTo ? (
          <div className="authcard">
            <div className="stack-sm">
              <h1 className="h-hero">Revisa tu correo</h1>
              <p className="muted lead">
                {sentTo.again
                  ? `Ya habías empezado a crear una cuenta con ${sentTo.email} y falta confirmarla. Te reenviamos el enlace: ábrelo y entra con el usuario y la contraseña que pusiste la primera vez.`
                  : `Te mandamos un enlace a ${sentTo.email}. Ábrelo para confirmar tu cuenta y después entra.`}
              </p>
            </div>
            {error && <p className="notice notice--error" role="alert">{error}</p>}
            <p className="notice" role="status">
              {resent ? "Listo, lo reenviamos. Revisa también la carpeta de spam." : "¿No te llegó?"}{" "}
              {!resent && <button type="button" className="linkbtn" onClick={resend} disabled={busy}>Reenviar correo</button>}
            </p>
            <Btn href={authHref("/entrar", next)} wide size="lg">Ya lo confirmé, entrar</Btn>
            <button type="button" className="linkbtn" onClick={() => { setSentTo(null); setResent(false); setError(""); }}>Usar otro correo</button>
          </div>
        ) : already ? (
          <div className="authcard">
            <div className="stack-sm">
              <h1 className="h-hero">Ya entraste</h1>
              <p className="muted lead">Estás en tu cuenta{profile ? ` como @${profile.handle}` : ""}.</p>
            </div>
            <Btn href={next ?? "/"} wide size="lg">{next ? "Seguir donde estabas" : "Ir al inicio"}</Btn>
            <Btn variant="ghost" wide onClick={signOut}>Cerrar sesión</Btn>
          </div>
        ) : (
          <form ref={formRef} className="authcard" onSubmit={submit} noValidate>
            <div className="stack-sm">
              <h1 className="h-hero">{copy.title}</h1>
              <p className="muted lead">{copy.lead}</p>
            </div>

            {mode !== "recuperar" && (
              <>
                <GoogleSignIn
                  onSignedIn={afterGoogle}
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
              <Field id="usuario" label="Nombre de usuario" error={errors.usuario} hint="Letras, números, punto y guion bajo. Así te verán: @tu.nombre">
                <span className={`input input--with${errors.usuario ? " is-invalid" : ""}`}>
                  <span className="muted" aria-hidden="true">@</span>
                  <input id="usuario" name="usuario" maxLength={24} autoComplete="username" autoCapitalize="none" spellCheck={false} onChange={() => clear("usuario")} {...invalid("usuario")} />
                </span>
              </Field>
            )}
            {!newPassword && (
              <Field id="correo" label="Correo" error={errors.correo}>
                <input id="correo" className={`input${errors.correo ? " is-invalid" : ""}`} type="email" name="correo" autoComplete="email" inputMode="email" onChange={() => clear("correo")} {...invalid("correo")} />
              </Field>
            )}
            {(mode !== "recuperar" || newPassword) && (
              <Field id="clave" label={newPassword ? "Contraseña nueva" : "Contraseña"} error={errors.clave} hint={mode === "entrar" ? undefined : "Mínimo 8 caracteres."}>
                <span className={`input input--with${errors.clave ? " is-invalid" : ""}`}>
                  <input id="clave" type={show ? "text" : "password"} name="clave" autoComplete={mode === "entrar" ? "current-password" : "new-password"} onChange={() => clear("clave")} {...invalid("clave")} />
                  <button type="button" className="linkbtn" onClick={() => setShow((v) => !v)} aria-pressed={show}>{show ? "Ocultar" : "Mostrar"}</button>
                </span>
              </Field>
            )}
            {newPassword && (
              <Field id="repetir" label="Repite la contraseña" error={errors.repetir}>
                <input id="repetir" className={`input${errors.repetir ? " is-invalid" : ""}`} type={show ? "text" : "password"} name="repetir" autoComplete="new-password" onChange={() => clear("repetir")} {...invalid("repetir")} />
              </Field>
            )}
            {mode === "registro" && (
              <>
                <div data-field="nacimiento">
                  <Field id="nacimiento" label="Fecha de nacimiento" error={errors.nacimiento} hint="La usamos solo para mostrarte contenido apto para tu edad.">
                    <DateField name="nacimiento" label="Fecha de nacimiento" invalid={Boolean(errors.nacimiento)} describedBy="nacimiento-msg" onChange={() => clear("nacimiento")} />
                  </Field>
                </div>
                <div className="field">
                  <label className="check">
                    <Checkbox name="acepta" onChange={() => clear("acepta")} {...invalid("acepta")} />
                    <span>Acepto los <Link href="/terminos">términos</Link> y la <Link href="/privacidad">política de privacidad</Link>.</span>
                  </label>
                  {errors.acepta && <span className="field__error" id="acepta-msg" role="alert"><Icon name="alert" size={16} stroke={2.2} />{errors.acepta}</span>}
                </div>
              </>
            )}

            {error && <p className="notice notice--error" role="alert">{error}</p>}
            {done && <p className="notice" role="status">{done}{newPassword && <> <Link href="/">Ir al inicio</Link></>}</p>}
            {pending && (
              <p className="notice" role="status">
                {resent ? `Listo: reenviamos el correo a ${pending}. Revisa también la carpeta de spam.` : "¿No te llegó el correo de confirmación?"}{" "}
                {!resent && <button type="button" className="linkbtn" onClick={resend} disabled={busy}>Reenviar correo</button>}
              </p>
            )}
            <Btn type="submit" wide size="lg" disabled={busy}>{busy ? "Un momento…" : copy.submit}</Btn>

            <div className="row between wrap">
              {mode === "entrar" && (<><Link href="/recuperar" className="textlink">Olvidé mi contraseña</Link><Link href={authHref("/registro", next)} className="textlink">Crear cuenta</Link></>)}
              {mode === "registro" && (<><Link href={next ?? "/"} className="textlink">Ahora no, seguir leyendo</Link><Link href={authHref("/entrar", next)} className="textlink">Ya tengo cuenta</Link></>)}
              {mode === "recuperar" && !newPassword && <Link href="/entrar" className="textlink">Volver a entrar</Link>}
              {newPassword && <Link href="/ajustes" className="textlink">Volver a ajustes</Link>}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
