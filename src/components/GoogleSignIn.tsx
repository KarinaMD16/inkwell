"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface GoogleId {
  initialize(options: { client_id: string; callback: (response: { credential: string }) => void; nonce: string; ux_mode: "popup"; itp_support: boolean }): void;
  renderButton(parent: HTMLElement, options: { type: "icon"; shape: "circle"; theme: "outline"; size: "large" }): void;
  cancel(): void;
}
declare global {
  interface Window { google?: { accounts: { id: GoogleId } } }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCRIPT = "https://accounts.google.com/gsi/client";

let loading: Promise<GoogleId> | null = null;

/** Carga una sola vez la librería de Google Identity Services. */
function loadGoogle(): Promise<GoogleId> {
  loading ??= new Promise<GoogleId>((resolve, reject) => {
    const done = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error("Google no cargó")));
    if (window.google) return done();
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = done;
    script.onerror = () => reject(new Error("Google no cargó"));
    document.head.appendChild(script);
  }).catch((err) => {
    loading = null; // permite reintentar en la próxima visita
    throw err;
  });
  return loading;
}

/** El nonce va en claro a Supabase y con hash SHA-256 (hexadecimal) a Google. */
async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}

/**
 * Botón oficial de Google (redondo, solo la G). Google entrega un token al navegador y ese
 * token abre la sesión en Supabase: la persona nunca pasa por una página de supabase.co.
 * Si falta NEXT_PUBLIC_GOOGLE_CLIENT_ID o la librería no carga, se muestra `fallback`.
 */
export function GoogleSignIn({ onSignedIn, onError, fallback }: { onSignedIn: () => void; onError: (err: unknown) => void; fallback: ReactNode }) {
  const slot = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onSignedIn, onError });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    handlers.current = { onSignedIn, onError };
  });

  useEffect(() => {
    if (!CLIENT_ID) return;
    let alive = true;
    Promise.all([loadGoogle(), makeNonce()])
      .then(([google, nonce]) => {
        if (!alive || !slot.current) return;
        google.initialize({
          client_id: CLIENT_ID,
          nonce: nonce.hashed,
          ux_mode: "popup",
          itp_support: true,
          callback: async ({ credential }) => {
            const { error } = await supabase().auth.signInWithIdToken({ provider: "google", token: credential, nonce: nonce.raw });
            if (error) handlers.current.onError(error);
            else handlers.current.onSignedIn();
          },
        });
        google.renderButton(slot.current, { type: "icon", shape: "circle", theme: "outline", size: "large" });
      })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  if (!CLIENT_ID || failed) return <>{fallback}</>;
  return <div ref={slot} className="googleslot" aria-label="Continuar con Google" />;
}
