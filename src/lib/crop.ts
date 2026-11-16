import type { Area } from "react-easy-crop";

/** Carga una imagen en memoria para dibujarla en un canvas. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo abrir la imagen"));
    img.src = src;
  });
}

/**
 * Recorta la zona elegida y la entrega ya a la medida final. Se envía recortada para que la
 * API no tenga que volver a encuadrar (la API igual la valida, la comprime y le quita los metadatos).
 */
export async function cropImage(src: string, area: Area, width: number, height: number): Promise<File> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no pudo recortar la imagen");
  ctx.imageSmoothingQuality = "high";
  // Fondo blanco: un PNG transparente no queda negro al pasar a JPEG en navegadores sin WebP.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.92));
  const out = blob?.type === "image/webp" ? blob : await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!out) throw new Error("Tu navegador no pudo recortar la imagen");
  return new File([out], out.type === "image/webp" ? "recorte.webp" : "recorte.jpg", { type: out.type });
}
