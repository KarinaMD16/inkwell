"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import type { MyChapter } from "@/lib/data";
import { problem } from "@/lib/story";
import type { IconName } from "./Icon";
import { useSession } from "./SessionProvider";
import { Btn } from "./ui";

/**
 * Crea un capítulo vacío en borrador y abre el editor sobre él. Así el capítulo existe en la
 * cuenta desde la primera letra y el autoguardado siempre tiene dónde guardar.
 */
export function NewChapterButton({
  slug, children = "Nuevo capítulo", variant = "primary", size = "md", icon = "plus", wide = false, before,
}: {
  slug: string; children?: string; variant?: "primary" | "ghost" | "ink"; size?: "sm" | "md" | "lg"; icon?: IconName; wide?: boolean;
  /** Algo que debe terminar antes de salir de donde estás (por ejemplo, guardar). */
  before?: () => Promise<unknown>;
}) {
  const router = useRouter();
  const { token } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (busy || !token) return;
    setBusy(true);
    setError("");
    try {
      await before?.();
      const chapter = await api<MyChapter>(`/stories/${slug}/chapters`, { method: "POST", token, body: "{}" });
      router.push(`/editor/${slug}?cap=${chapter.id}`);
    } catch (err) {
      setError(problem(err, "crear el capítulo"));
    } finally {
      // Next conserva esta pantalla para el botón "atrás": el botón tiene que quedar listo otra vez.
      setBusy(false);
    }
  }

  return (
    <>
      <Btn variant={variant} size={size} icon={icon} wide={wide} onClick={create} disabled={busy}>{busy ? "Abriendo…" : children}</Btn>
      {error && <span className="field__error" role="alert">{error}</span>}
    </>
  );
}
