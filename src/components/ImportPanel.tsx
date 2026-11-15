"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon } from "./Icon";
import { Btn } from "./ui";
import { Checkbox } from "./Checkbox";

const SAMPLE = [
  { title: "Capítulo 1: La mudanza", words: 1840, ok: true }, { title: "Capítulo 2: Reglas del edificio", words: 2105, ok: true },
  { title: "Notas de la autora", words: 96, ok: false }, { title: "Capítulo 3: El 4B", words: 2430, ok: true }, { title: "Interludio", words: 610, ok: true },
];

/** Interfaz de la importación .docx. La detección real de capítulos la hará la API (mammoth). */
export function ImportPanel() {
  const [file, setFile] = useState<string | null>(null);
  const [checked, setChecked] = useState(SAMPLE.map((c) => c.ok));
  return (
    <section className="import" aria-label="Importar manuscrito">
      <div className="row">
        <Image src="/inkwell-mark.svg" alt="" width={64} height={64} />
        <div><h2 className="h-sec">Importar desde Word</h2><span className="muted small">{file ?? "Sube tu .docx y detectamos los capítulos."}</span></div>
      </div>
      <label className="btn btn--ink btn--md btn--wide" style={{ cursor: "pointer" }}>
        <Icon name="upload" size={18} stroke={2} />{file ? "Subir otro archivo" : "Elegir archivo .docx"}
        <input type="file" accept=".docx" className="sr-only" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
      </label>
      {file && (
        <>
          <div className="row deep" style={{ fontWeight: 700 }}><Icon name="sparkle" size={18} />Vista de ejemplo: así se verán tus capítulos</div>
          <div className="stack-sm">
            {SAMPLE.map((c, i) => (
              <label key={c.title} className="detected">
                <Checkbox checked={checked[i]} onChange={() => setChecked((p) => p.map((v, j) => (j === i ? !v : v)))} />
                <b>{i + 1}</b><span style={{ flex: 1 }}>{c.title}</span><span className="muted small">{c.words.toLocaleString("es")} palabras</span>
              </label>
            ))}
          </div>
          <p className="muted small">La detección real se conecta con la API. Por ahora esta lista es de muestra y tu archivo no se sube a ningún lado.</p>
          <Btn icon="arrow" disabled>Revisar y publicar</Btn>
        </>
      )}
    </section>
  );
}
