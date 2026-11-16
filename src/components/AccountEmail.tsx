"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { correoSchema, validate } from "@/lib/validation";
import { Icon } from "./Icon";
import { useSession } from "./SessionProvider";
import { Btn, Leader } from "./ui";

/**
 * El correo de la cuenta. Lo guarda Supabase Auth (no nuestra base): para cambiarlo, Supabase
 * manda un enlace de confirmación y el cambio se aplica cuando la persona lo abre.
 */
export function AccountEmail() {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  if (!session) return null;
  const current = session.user.email ?? "";
  const pending = session.user.new_email;
  const viaGoogle = session.user.app_metadata?.provider === "google";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    const checked = validate(correoSchema, Object.fromEntries(new FormData(e.currentTarget)));
    if (!checked.ok) return setFieldError(checked.errors.correo);
    const email = checked.data.correo.toLowerCase();
    if (email === current.toLowerCase()) return setFieldError("Ese ya es tu correo.");
    setFieldError("");
    setBusy(true);
    try {
      const { error } = await supabase().auth.updateUser({ email }, { emailRedirectTo: `${location.origin}/ajustes` });
      if (error) throw error;
      setSentTo(email);
      setOpen(false);
    } catch (err) {
      const m = err instanceof Error ? err.message.toLowerCase() : "";
      setError(
        m.includes("already") ? "Ese correo ya está en otra cuenta."
          : m.includes("rate limit") || m.includes("security purposes") ? "Demasiados intentos seguidos. Espera unos minutos."
          : "No se pudo cambiar el correo. Intenta de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack-sm">
      <Leader k="Correo">{current || "—"}</Leader>
      {viaGoogle && <span className="muted small">Entras con Google.</span>}
      {(sentTo || pending) && (
        <p className="notice" role="status">
          Te mandamos un enlace a {sentTo || pending}. El correo cambia cuando lo abras; según la configuración, también puede llegar uno a {current} para confirmar.
        </p>
      )}
      {open ? (
        <form className="stack-sm" onSubmit={submit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="nuevo-correo">Correo nuevo</label>
            <input id="nuevo-correo" name="correo" type="email" inputMode="email" autoComplete="email" className={`input${fieldError ? " is-invalid" : ""}`} aria-invalid={fieldError ? true : undefined} aria-describedby="nuevo-correo-msg" onChange={() => setFieldError("")} />
            {fieldError && <span className="field__error" id="nuevo-correo-msg" role="alert"><Icon name="alert" size={16} stroke={2.2} />{fieldError}</span>}
          </div>
          {error && <p className="notice notice--error" role="alert">{error}</p>}
          <div className="row wrap">
            <Btn type="submit" size="sm" disabled={busy}>{busy ? "Enviando…" : "Enviar enlace"}</Btn>
            <Btn variant="ghost" size="sm" onClick={() => { setOpen(false); setFieldError(""); setError(""); }}>Cancelar</Btn>
          </div>
        </form>
      ) : (
        <div><button type="button" className="linkbtn" onClick={() => setOpen(true)}>Cambiar correo</button></div>
      )}
    </div>
  );
}
