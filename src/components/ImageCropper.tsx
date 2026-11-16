"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { cropImage } from "@/lib/crop";
import { Icon } from "./Icon";
import { Btn } from "./ui";

export interface CropSpec {
  title: string;
  /** Ancho / alto del recorte: 1 para la foto, 3 para la portada. */
  aspect: number;
  shape: "round" | "rect";
  /** Medida final en píxeles. */
  width: number;
  height: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Ventana para encuadrar una imagen antes de subirla: se arrastra para moverla y se acerca con
 * la barra, la rueda del ratón o pellizcando. Con teclado, las flechas mueven la imagen (sobre
 * el área de recorte) y la barra de zoom responde a las flechas también.
 */
export function ImageCropper({ src, spec, onCancel, onDone }: {
  src: string; spec: CropSpec; onCancel: () => void; onDone: (file: File) => Promise<void> | void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // <dialog> nativo: atrapa el foco, se cierra con Escape y devuelve el foco al botón que lo abrió.
  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);

  async function confirm() {
    if (!area || busy) return;
    setBusy(true);
    setError("");
    try {
      await onDone(await cropImage(src, area, spec.width, spec.height));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo recortar la imagen.");
      setBusy(false);
    }
  }

  const step = (delta: number) => setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((z + delta).toFixed(2)))));
  return (
    <dialog
      ref={dialog} className="cropper" aria-labelledby="cropper-title" data-lenis-prevent
      onCancel={(e) => { e.preventDefault(); if (!busy) onCancel(); }}
    >
      <div className="cropper__head">
        <h2 className="h-sec" id="cropper-title">{spec.title}</h2>
        <button type="button" className="iconbtn" aria-label="Cerrar sin guardar" onClick={onCancel} disabled={busy}><Icon name="x" /></button>
      </div>
      <div className={`cropper__stage cropper__stage--${spec.shape}`}>
        <Cropper
          image={src} crop={crop} zoom={zoom} aspect={spec.aspect} cropShape={spec.shape}
          minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} zoomSpeed={0.4} showGrid={spec.shape === "rect"} objectFit="cover"
          onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, pixels) => setArea(pixels)}
          onMediaLoaded={() => {
            setError("");
            // El foco va al área de recorte: así las flechas mueven la imagen de inmediato.
            // (el área aparece un instante después de cargar la imagen)
            requestAnimationFrame(() => dialog.current?.querySelector<HTMLElement>(".cropper__area")?.focus({ preventScroll: true }));
          }}
          mediaProps={{ alt: "", onError: () => setError("Este formato no se puede recortar en el navegador. Usa una imagen JPG, PNG o WebP.") } as React.ImgHTMLAttributes<HTMLElement>}
          cropperProps={{ "aria-label": "Área de recorte. Usa las flechas para mover la imagen." } as React.HTMLAttributes<HTMLDivElement>}
          classes={{ containerClassName: "cropper__container", cropAreaClassName: "cropper__area" }}
        />
      </div>
      <p className="muted small cropper__hint">Arrastra para encuadrar. Acerca con la barra, la rueda o pellizcando.</p>
      <div className="cropper__zoom">
        <button type="button" className="iconbtn" aria-label="Alejar" onClick={() => step(-0.2)} disabled={zoom <= MIN_ZOOM}><Icon name="minus" size={18} /></button>
        <input
          type="range" className="range" min={MIN_ZOOM} max={MAX_ZOOM} step={0.01} value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom" aria-valuetext={`${Math.round(zoom * 100)} %`}
          style={{ "--fill": `${((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%` } as React.CSSProperties}
        />
        <button type="button" className="iconbtn" aria-label="Acercar" onClick={() => step(0.2)} disabled={zoom >= MAX_ZOOM}><Icon name="plus" size={18} /></button>
      </div>
      {error && <p className="notice notice--error" role="alert">{error}</p>}
      <div className="row between wrap cropper__foot">
        <button type="button" className="linkbtn" onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); }} disabled={busy}>Restablecer</button>
        <div className="row wrap">
          <Btn variant="ghost" onClick={onCancel} disabled={busy}>Cancelar</Btn>
          <Btn icon="check" onClick={confirm} disabled={busy || !area || Boolean(error)}>{busy ? "Subiendo…" : "Usar imagen"}</Btn>
        </div>
      </div>
    </dialog>
  );
}
