"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { Icon } from "./Icon";
import { Btn } from "./ui";

/**
 * Confirmación en un <dialog> nativo: atrapa el foco, se cierra con Escape y devuelve el foco
 * al botón que la abrió. Con `input`, pide un texto antes de confirmar: un motivo, o escribir
 * algo exacto (`mustEqual`) cuando la acción no tiene vuelta atrás.
 */
export function ConfirmDialog({ title, children, confirmLabel, danger = false, input, onConfirm, onClose }: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  input?: { label: string; placeholder?: string; minLength?: number; maxLength?: number; multiline?: boolean; mustEqual?: string };
  /** Recibe el texto escrito. Si lanza un error, se muestra y el diálogo sigue abierto. */
  onConfirm: (value: string) => Promise<void> | void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);

  const clean = value.trim();
  const ready = !input
    || (input.mustEqual !== undefined
      ? clean.replace(/^@/, "").toLowerCase() === input.mustEqual.toLowerCase()
      : clean.length >= (input.minLength ?? 1));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    try {
      await onConfirm(clean);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "No se pudo completar.");
      setBusy(false);
    }
  }

  const field = input && (input.multiline ? (
    <textarea
      id={`${id}-in`} className="input input--area" rows={3} value={value} onChange={(e) => setValue(e.target.value)}
      placeholder={input.placeholder} maxLength={input.maxLength} autoFocus disabled={busy}
    />
  ) : (
    <input
      id={`${id}-in`} className="input" value={value} onChange={(e) => setValue(e.target.value)}
      placeholder={input.placeholder} maxLength={input.maxLength} autoFocus disabled={busy} autoComplete="off" spellCheck={false}
    />
  ));

  return (
    <dialog
      ref={dialog} className="cropper confirm" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`} data-lenis-prevent
      onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }}
    >
      <form className="stack" onSubmit={submit}>
        <div className="cropper__head">
          <h2 className="h-sec" id={`${id}-t`}>{title}</h2>
          <button type="button" className="iconbtn" aria-label="Cerrar" onClick={onClose} disabled={busy}><Icon name="x" /></button>
        </div>
        <div id={`${id}-d`} className="stack-sm">{children}</div>
        {input && (
          <label className="field" htmlFor={`${id}-in`}>
            <span className="field__label">{input.label}</span>
            {field}
          </label>
        )}
        {error && <p className="notice notice--error" role="alert">{error}</p>}
        <div className="row wrap" style={{ justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onClose} disabled={busy}>Cancelar</Btn>
          <Btn type="submit" variant={danger ? "ink" : "primary"} disabled={!ready || busy}>{busy ? "Un momento…" : confirmLabel}</Btn>
        </div>
      </form>
    </dialog>
  );
}
