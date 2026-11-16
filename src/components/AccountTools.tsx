"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, API_URL } from "@/lib/api";
import { atLeast } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { ConfirmDialog } from "./ConfirmDialog";
import { useSession } from "./SessionProvider";
import { Btn } from "./ui";

/**
 * Lo que cada persona controla de su propia cuenta: llevarse sus datos, cerrar todas sus
 * sesiones y borrarla. Si tiene rol de moderación, también el atajo al panel (en el teléfono
 * la barra lateral no lo muestra).
 */
export function AccountTools() {
  const router = useRouter();
  const { token, profile } = useSession();
  const [busy, setBusy] = useState<"" | "export" | "global">("");
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [confirm, setConfirm] = useState<"global" | "delete" | null>(null);

  if (!token || !profile) return null;

  async function download() {
    setBusy("export");
    setNotice(null);
    try {
      const res = await fetch(`${API_URL}/me/export`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const a = Object.assign(document.createElement("a"), { href: url, download: `inkwell-${profile!.handle}.json` });
      a.click();
      URL.revokeObjectURL(url);
      setNotice({ text: "Listo: se descargó un archivo con tu perfil, tus historias con todos sus capítulos, tu repisa y tus votos.", error: false });
    } catch {
      setNotice({ text: "No se pudo preparar la descarga. Revisa tu conexión e intenta de nuevo.", error: true });
    } finally {
      setBusy("");
    }
  }

  async function signOutEverywhere() {
    const { error } = await supabase().auth.signOut({ scope: "global" });
    if (error) throw new Error("No se pudieron cerrar las sesiones. Intenta de nuevo.");
    router.push("/");
  }

  async function deleteAccount(typed: string) {
    await api(`/me`, { method: "DELETE", token, body: JSON.stringify({ confirm: typed }) });
    // La cuenta ya no existe: solo queda olvidar la sesión en este navegador.
    await supabase().auth.signOut({ scope: "local" });
    router.push("/");
  }

  return (
    <section className="card">
      <div className="shelflabel">Tu cuenta y tus datos</div>
      {atLeast(profile.role, "moderador") && (
        <div className="row between wrap">
          <span><strong>Panel de administración</strong><span className="muted small" style={{ display: "block" }}>Personas, historias y registro de moderación.</span></span>
          <Btn variant="ghost" size="sm" icon="idcard" href="/admin">Abrir</Btn>
        </div>
      )}
      <div className="row between wrap">
        <span><strong>Descargar mis datos</strong><span className="muted small" style={{ display: "block" }}>Un archivo con todo lo que Inkwell guarda de ti.</span></span>
        <Btn variant="ghost" size="sm" icon="download" onClick={download} disabled={busy === "export"}>{busy === "export" ? "Preparando…" : "Descargar"}</Btn>
      </div>
      <div className="row between wrap">
        <span><strong>Cerrar sesión en todos los dispositivos</strong><span className="muted small" style={{ display: "block" }}>Útil si entraste en un equipo ajeno o perdiste tu teléfono.</span></span>
        <Btn variant="ghost" size="sm" onClick={() => setConfirm("global")}>Cerrar todas</Btn>
      </div>
      <div className="row between wrap">
        <span><strong>Borrar mi cuenta</strong><span className="muted small" style={{ display: "block" }}>Para siempre, con tus historias y todo lo demás.</span></span>
        <Btn variant="ink" size="sm" icon="x" onClick={() => setConfirm("delete")}>Borrar cuenta</Btn>
      </div>
      {notice && <p className={`notice${notice.error ? " notice--error" : ""}`} role="status">{notice.text}</p>}

      {confirm === "global" && (
        <ConfirmDialog title="Cerrar todas las sesiones" confirmLabel="Cerrar todas" onClose={() => setConfirm(null)} onConfirm={signOutEverywhere}>
          <p>Se cierra tu sesión aquí y en cualquier otro navegador o teléfono. Para volver, entra de nuevo.</p>
        </ConfirmDialog>
      )}
      {confirm === "delete" && (
        <ConfirmDialog
          title="Borrar tu cuenta" confirmLabel="Borrar para siempre" danger onClose={() => setConfirm(null)}
          input={{ label: `Escribe ${profile.handle} para confirmar`, placeholder: profile.handle, mustEqual: profile.handle }}
          onConfirm={deleteAccount}
        >
          <p>Se borran tu cuenta, tu perfil, tus historias con todos sus capítulos, tu repisa y tus votos. <strong>No se puede deshacer.</strong></p>
          <p className="muted small">Si quieres conservar una copia, descarga tus datos antes.</p>
        </ConfirmDialog>
      )}
    </section>
  );
}
