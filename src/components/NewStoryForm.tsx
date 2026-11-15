"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { genres, type Art, type Rating, type Story } from "@/lib/data";
import { useAuthHref } from "@/lib/useAuthHref";
import { useSession } from "./SessionProvider";
import { Book } from "./Book";
import { Icon } from "./Icon";
import { Select } from "./Select";
import { Board, Spine } from "./Shelf";
import { Btn } from "./ui";

const COLORS: { color: string; ink: string }[] = [
  { color: "#0F8B80", ink: "#FFFBF8" }, { color: "#DD5D4F", ink: "#14152B" }, { color: "#F6C453", ink: "#14152B" }, { color: "#B9A5F0", ink: "#14152B" },
  { color: "#FF8FAB", ink: "#14152B" }, { color: "#14152B", ink: "#FFFBF8" }, { color: "#4B3B8F", ink: "#FFFBF8" }, { color: "#2EC4B6", ink: "#14152B" },
];
const ARTS: { id: Art; label: string }[] = [
  { id: "sun", label: "Sol" }, { id: "moon", label: "Luna" }, { id: "wave", label: "Olas" }, { id: "dots", label: "Puntos" }, { id: "stripes", label: "Rayas" }, { id: "chat", label: "Chat" },
];
const RATINGS: Rating[] = ["Todo público", "+13", "+16", "+18"];

/** Crear una historia. La portada subida se acomoda a la tapa del libro en vivo. */
export function NewStoryForm() {
  const auth = useAuthHref();
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState(genres[0]);
  const [fandom, setFandom] = useState("");
  const [tropes, setTropes] = useState("");
  const [rating, setRating] = useState<Rating>("+13");
  const [pal, setPal] = useState(0);
  const [art, setArt] = useState<Art>("sun");
  const [cover, setCover] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { ready, token, profile } = useSession();

  // La imagen vive solo en este navegador; se libera al cambiarla o salir.
  useEffect(() => () => { if (cover) URL.revokeObjectURL(cover); }, [cover]);

  const story: Story = {
    slug: "nueva", title: title.trim() || "Tu título", author: profile?.handle ?? "tu.usuario", color: COLORS[pal].color, ink: COLORS[pal].ink, art, cover,
    genre, fandom: fandom.trim() || "Original", tropes: tropes.split(",").map((t) => t.trim()).filter(Boolean), warnings: [], rating,
    status: "En curso", format: "Narrativa", chapters: 12, votes: 0, reads: 0, updatedDays: 0, tagline, synopsis: [synopsis],
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!token) return setError("Entra a tu cuenta para crear la historia.");
    setBusy(true);
    setError("");
    try {
      // Nace como borrador: se vuelve pública al publicar su primer capítulo.
      const created = await api<{ slug: string }>("/stories", {
        method: "POST", token,
        body: JSON.stringify({
          title: story.title, tagline: tagline.trim(), synopsis: synopsis.trim(), genre, fandom: story.fandom,
          tropes: story.tropes, rating, color: story.color, ink: story.ink, art,
        }),
      });
      router.push(`/editor/${created.slug}`);
    } catch (err) {
      setError(err instanceof ApiError ? `No se pudo crear: ${err.message}` : "No se pudo crear: no hay conexión con la API.");
      setBusy(false);
    }
  }

  return (
    <form className="twocol" onSubmit={submit}>
      <div className="stack">
        <label className="field"><span className="field__label">Título</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} />
        </label>
        <label className="field"><span className="field__label">Frase gancho</span>
          <input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={120} placeholder="Una línea que haga querer abrir el libro" />
        </label>
        <label className="field"><span className="field__label">Sinopsis</span>
          <textarea className="input input--area" rows={5} value={synopsis} onChange={(e) => setSynopsis(e.target.value)} spellCheck lang="es" />
        </label>

        <div className="formgrid">
          <div className="field"><span className="field__label" aria-hidden="true">Género</span>
            <Select label="Género" value={genre} onChange={setGenre} options={genres.map((g) => ({ value: g, label: g }))} />
          </div>
          <label className="field"><span className="field__label">Fandom</span>
            <input className="input" value={fandom} onChange={(e) => setFandom(e.target.value)} placeholder="Original" />
          </label>
        </div>
        <label className="field"><span className="field__label">Tropos</span>
          <input className="input" value={tropes} onChange={(e) => setTropes(e.target.value)} placeholder="Slow burn, Found family" />
          <span className="muted small">Sepáralos con comas. Ayudan a que te encuentren con los filtros.</span>
        </label>
        <fieldset className="facet"><legend>Clasificación</legend>
          <div className="seg seg--fill">{RATINGS.map((r) => <button key={r} type="button" aria-pressed={rating === r} onClick={() => setRating(r)}>{r}</button>)}</div>
        </fieldset>

        <fieldset className="facet"><legend>Portada</legend>
          <label className="btn btn--ghost btn--md" style={{ cursor: "pointer", alignSelf: "flex-start" }}>
            <Icon name="upload" size={18} stroke={2} />{cover ? "Cambiar imagen" : "Subir imagen"}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; setCover(f ? URL.createObjectURL(f) : undefined); }} />
          </label>
          {cover ? (
            <button type="button" className="linkbtn" style={{ alignSelf: "flex-start" }} onClick={() => setCover(undefined)}>Quitar imagen y usar portada generada</button>
          ) : (
            <>
              <span className="muted small">Sin imagen, armamos una portada con tu título. Elige color y motivo:</span>
              <div className="row wrap">
                {COLORS.map((c, i) => (
                  <button key={c.color} type="button" className={`swatch${pal === i ? " is-on" : ""}`} style={{ background: c.color }} aria-label={`Color ${i + 1}`} aria-pressed={pal === i} onClick={() => setPal(i)} />
                ))}
              </div>
              <div className="chips">{ARTS.map((a) => <button key={a.id} type="button" className={`tag${art === a.id ? " tag--pick" : ""}`} aria-pressed={art === a.id} onClick={() => setArt(a.id)}>{a.label}</button>)}</div>
            </>
          )}
        </fieldset>

        {cover && <p className="muted small">La imagen es solo una vista previa: subir portadas todavía no está en la API, así que la historia se crea con la portada generada.</p>}
        {ready && !token && <p className="notice" role="status">Para crear una historia necesitas tu cuenta. <Link href={auth.entrar}>Entrar</Link></p>}
        {error && <p className="notice" role="alert">{error}</p>}
        <div className="row wrap"><Btn type="submit" size="lg" icon="arrow" disabled={busy}>{busy ? "Creando…" : "Crear y escribir el primer capítulo"}</Btn><Btn variant="ghost" href="/escribir">Cancelar</Btn></div>
      </div>

      <aside className="preview" aria-label="Vista previa">
        <div className="shelflabel">Así se verá</div>
        <div className="preview__stage">
          <Book story={story} size="l" />
        </div>
        <div>
          <div className="shelf__row" style={{ minHeight: 0, paddingTop: 24, overflow: "visible" }}>
            <Spine story={{ ...story, slug: "vecino-a", title: "Otra historia", color: "#E9E1D9", ink: "#5B5C72" }} href="#" />
            <Spine story={story} href="#" lifted />
            <Spine story={{ ...story, slug: "vecino-b", title: "Otra historia", color: "#E9E1D9", ink: "#5B5C72", chapters: 30 }} href="#" />
          </div>
          <Board />
        </div>
        <p className="muted small">En la repisa, el color del lomo sale de tu portada. Con imagen subida se calculará de la imagen.</p>
      </aside>
    </form>
  );
}
