"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { refreshStory } from "@/app/actions";
import { api, ApiError } from "@/lib/api";
import {
  genres, kinds, licenses, ratings, toManaged,
  type ApiManagedStory, type Art, type Kind, type ManagedStory, type Rating, type Story,
} from "@/lib/data";
import { checkImage, IMAGE_ACCEPT } from "@/lib/profile";
import { problem, uploadCover } from "@/lib/story";
import { useAuthHref } from "@/lib/useAuthHref";
import { useSession } from "./SessionProvider";
import { Book } from "./Book";
import { Icon } from "./Icon";
import { Select } from "./Select";
import { Board, Spine } from "./Shelf";
import { TagInput } from "./TagInput";
import { Btn } from "./ui";

const COLORS: { color: string; ink: string }[] = [
  { color: "#0F8B80", ink: "#FFFBF8" }, { color: "#DD5D4F", ink: "#14152B" }, { color: "#F6C453", ink: "#14152B" }, { color: "#B9A5F0", ink: "#14152B" },
  { color: "#FF8FAB", ink: "#14152B" }, { color: "#14152B", ink: "#FFFBF8" }, { color: "#4B3B8F", ink: "#FFFBF8" }, { color: "#2EC4B6", ink: "#14152B" },
];
const ARTS: { id: Art; label: string }[] = [
  { id: "sun", label: "Sol" }, { id: "moon", label: "Luna" }, { id: "wave", label: "Olas" }, { id: "dots", label: "Puntos" }, { id: "stripes", label: "Rayas" }, { id: "chat", label: "Chat" },
];
const KIND_HINT: Record<Kind, string> = {
  Original: "El mundo y los personajes son tuyos.",
  Fanfic: "Parte de algo que ya existe: una serie, un grupo, un libro, un juego.",
  Poesía: "Versos, prosa poética o una colección de poemas.",
  "No ficción": "Experiencias reales, reflexiones, guías o diarios.",
};
const WARNINGS = ["Violencia", "Lenguaje fuerte", "Muerte de personaje", "Contenido sexual", "Salud mental", "Consumo de sustancias"];

/**
 * La ficha de una historia: sirve para crearla y, con `story`, para editar sus detalles.
 * Aquí se define el "cuerpo" del libro; el contenido (capítulos, importar) viene después,
 * en la pantalla de gestión.
 */
export function StoryForm({ story: saved, onSaved }: { story?: ManagedStory; onSaved?: (story: ManagedStory) => void }) {
  const auth = useAuthHref();
  const router = useRouter();
  const { ready, token, profile } = useSession();
  const editing = Boolean(saved);

  const [title, setTitle] = useState(saved?.title ?? "");
  const [tagline, setTagline] = useState(saved?.tagline ?? "");
  const [synopsis, setSynopsis] = useState(saved?.synopsis.join("\n\n") ?? "");
  const [kind, setKind] = useState<Kind>(saved?.kind ?? "Original");
  const [genre, setGenre] = useState(saved?.genre ?? genres[0]);
  const [subgenres, setSubgenres] = useState<string[]>(saved?.subgenres ?? []);
  const [fandom, setFandom] = useState<string[]>(saved && saved.kind === "Fanfic" ? [saved.fandom] : []);
  const [relation, setRelation] = useState<string[]>(saved?.relation ? [saved.relation] : []);
  const [characters, setCharacters] = useState(saved?.characters ?? []);
  const [tropes, setTropes] = useState(saved?.tropes ?? []);
  const [warnings, setWarnings] = useState(saved?.warnings ?? []);
  const [tags, setTags] = useState(saved?.tags ?? []);
  const [rating, setRating] = useState<Rating>(saved?.rating ?? "+13");
  const [license, setLicense] = useState(saved?.license ?? licenses[0]);
  const [pal, setPal] = useState(() => Math.max(0, COLORS.findIndex((c) => c.color.toLowerCase() === saved?.color.toLowerCase())));
  const [art, setArt] = useState<Art>(saved?.art ?? "sun");
  /** Al crear, la imagen espera aquí hasta que la historia exista; al editar se sube en el momento. */
  const [file, setFile] = useState<{ file: File; url: string } | null>(null);
  const [cover, setCover] = useState(saved?.cover);
  const [busy, setBusy] = useState<"" | "form" | "cover">("");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  // La vista previa local se libera al cambiarla o salir.
  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url); }, [file]);

  const preview: Story = {
    slug: saved?.slug ?? "nueva", title: title.trim() || "Tu título", author: saved?.author ?? profile?.handle ?? "tu.usuario",
    color: COLORS[pal].color, ink: COLORS[pal].ink, art, cover: file?.url ?? cover, kind, genre, subgenres,
    fandom: kind === "Fanfic" ? (fandom[0] ?? "") : "Original", relation: relation[0], characters, tropes, warnings, tags, rating, status: saved?.status ?? "En curso",
    format: saved?.format ?? "Narrativa", license, chapters: saved?.totalChapters || 12, votes: 0, reads: 0, updatedDays: 0, tagline, synopsis: [synopsis],
  };
  const touch = () => { setDone(false); setError(""); };

  function toggleSub(g: string) {
    touch();
    setSubgenres((list) => (list.includes(g) ? list.filter((x) => x !== g) : list.length < 2 ? [...list, g] : list));
  }

  async function pickCover(picked: File | undefined) {
    if (!picked) return;
    const bad = checkImage(picked);
    if (bad) return setError(bad);
    touch();
    if (!saved) return setFile({ file: picked, url: URL.createObjectURL(picked) });
    if (!token) return setError("Tu sesión se cerró. Entra de nuevo para cambiar la portada.");
    setBusy("cover");
    try {
      const url = await uploadCover(saved.slug, picked, token);
      setCover(url);
      onSaved?.({ ...saved, cover: url });
      void refreshStory(saved.slug);
    } catch (err) {
      setError(problem(err, "subir la portada"));
    } finally {
      setBusy("");
    }
  }

  async function dropCover() {
    touch();
    if (!saved) return setFile(null);
    if (!token) return;
    setBusy("cover");
    try {
      await api(`/me/stories/${saved.slug}/cover`, { method: "DELETE", token });
      setCover(undefined);
      onSaved?.({ ...saved, cover: undefined });
      void refreshStory(saved.slug);
    } catch (err) {
      setError(problem(err, "quitar la portada"));
    } finally {
      setBusy("");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!token) return setError("Entra a tu cuenta para guardar la historia.");
    if (kind === "Fanfic" && !fandom.length) return setFields({ fandom: "Dinos de qué fandom es tu fanfic." });
    setBusy("form");
    setError("");
    setFields({});
    const body = JSON.stringify({
      title: title.trim(), tagline: tagline.trim(), synopsis: synopsis.trim(), kind, genre, subgenres: subgenres.filter((g) => g !== genre),
      fandom: kind === "Fanfic" ? fandom[0] : "Original", relation: relation[0] ?? null, characters, tropes, warnings, tags, rating,
      color: COLORS[pal].color, ink: COLORS[pal].ink, art, ...(saved ? { license } : {}),
    });
    try {
      if (saved) {
        const next = toManaged(await api<ApiManagedStory>(`/me/stories/${saved.slug}`, { method: "PATCH", token, body }));
        onSaved?.(next);
        void refreshStory(saved.slug);
        setDone(true);
        setBusy("");
        return;
      }
      // Nace como borrador: se vuelve pública al publicar su primer capítulo.
      const created = await api<{ slug: string }>("/stories", { method: "POST", token, body });
      let warn = "";
      if (file) await uploadCover(created.slug, file.file, token).catch(() => { warn = "?aviso=portada"; });
      // El contenido empieza en la pantalla de gestión: ahí se escribe o se importa.
      router.push(`/escribir/${created.slug}${warn}`);
      // Next conserva esta pantalla para el botón "atrás": el formulario no puede quedar bloqueado.
      setBusy("");
    } catch (err) {
      if (err instanceof ApiError) setFields(err.fields);
      setError(problem(err, saved ? "guardar" : "crear la historia"));
      setBusy("");
    }
  }

  const shown = file?.url ?? cover;
  return (
    <form className="twocol" onSubmit={submit} onChange={touch}>
      <div className="stack-lg">
        <section className="stack" aria-labelledby="sf-basico">
          <h2 className="h-sec" id="sf-basico">Lo básico</h2>
          <label className="field"><span className="field__label">Título</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} />
            <span className="muted small">Escríbelo normal, sin letras especiales: así se puede buscar y leer con lector de pantalla.</span>
          </label>
          <label className="field"><span className="field__label">Frase gancho</span>
            <input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={120} placeholder="Una línea que haga querer abrir el libro" />
          </label>
          <label className="field"><span className="field__label">Sinopsis</span>
            <textarea className="input input--area" rows={5} value={synopsis} onChange={(e) => setSynopsis(e.target.value)} maxLength={2000} spellCheck lang="es" />
          </label>
          <fieldset className="facet"><legend>¿Qué estás escribiendo?</legend>
            <div className="seg seg--fill">{kinds.map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => { touch(); setKind(k); }}>{k}</button>)}</div>
            <span className="muted small">{KIND_HINT[kind]}</span>
          </fieldset>
          {kind === "Fanfic" && (
            <TagInput label="Fandom" kind="fandom" value={fandom} onChange={(v) => { touch(); setFields({}); setFandom(v); }} max={1} maxLength={60}
              placeholder="Escribe y elige el que ya exista" error={fields.fandom} hint="Usa el nombre que ya aparece en la lista si existe: así todas las historias del fandom quedan juntas." />
          )}
          <div className="formgrid">
            <div className="field"><span className="field__label" aria-hidden="true">Género principal</span>
              <Select label="Género principal" value={genre} onChange={(g) => { touch(); setGenre(g); setSubgenres((l) => l.filter((x) => x !== g)); }} options={genres.map((g) => ({ value: g, label: g }))} />
            </div>
            <fieldset className="facet"><legend>Clasificación</legend>
              <div className="seg seg--fill">{ratings.map((r) => <button key={r} type="button" aria-pressed={rating === r} onClick={() => { touch(); setRating(r); }}>{r}</button>)}</div>
            </fieldset>
          </div>
          <fieldset className="facet"><legend>También es de… <span className="muted small">hasta 2, opcional</span></legend>
            <div className="chips">
              {genres.filter((g) => g !== genre).map((g) => (
                <button key={g} type="button" className={`tag${subgenres.includes(g) ? " tag--pick" : ""}`} aria-pressed={subgenres.includes(g)}
                  disabled={!subgenres.includes(g) && subgenres.length >= 2} onClick={() => toggleSub(g)}>{g}</button>
              ))}
            </div>
          </fieldset>
          {rating === "+18" && <p className="notice">El contenido +18 explícito solo se muestra en la web, no en la app.</p>}
        </section>

        <section className="stack" aria-labelledby="sf-etiquetas">
          <div><h2 className="h-sec" id="sf-etiquetas">Para que te encuentren</h2><span className="muted small">Cada casilla es un filtro distinto del buscador. Llena solo las que apliquen; puedes cambiarlas cuando quieras.</span></div>
          <TagInput label="Tropos" kind="tropo" value={tropes} onChange={(v) => { touch(); setTropes(v); }} placeholder="Slow burn, Found family…" hint="Enter o coma para agregar." />
          <div className="formgrid">
            <TagInput label="Personajes" kind="personaje" value={characters} onChange={(v) => { touch(); setCharacters(v); }} maxLength={60} placeholder="Quiénes protagonizan" />
            <TagInput label="Relación principal" kind="relacion" value={relation} onChange={(v) => { touch(); setRelation(v); }} max={1} maxLength={80} placeholder="Irene / Dani" />
          </div>
          <TagInput label="Advertencias" kind="advertencia" value={warnings} onChange={(v) => { touch(); setWarnings(v); }} picks={WARNINGS}
            hint="Lo que alguien querría saber antes de empezar. Quien lee puede excluirlas de su búsqueda." />
          <TagInput label="Otras etiquetas" kind="libre" value={tags} onChange={(v) => { touch(); setTags(v); }} max={20} placeholder="Ambientación, época, tono…" />
        </section>

        {saved && (
          <section className="stack" aria-labelledby="sf-estado">
            <h2 className="h-sec" id="sf-estado">Derechos</h2>
            <div className="field"><span className="field__label" aria-hidden="true">Derechos de autor</span>
              <Select label="Derechos de autor" value={license} onChange={(l) => { touch(); setLicense(l); }} options={licenses.map((l) => ({ value: l, label: l }))} />
              <span className="muted small">{license === licenses[0] ? "Nadie puede usar ni adaptar tu historia sin tu permiso." : license === "Dominio público" ? "Cualquiera puede usarla sin pedir permiso." : "Licencia Creative Commons: permites compartirla con las condiciones de esa licencia."}</span>
            </div>
          </section>
        )}

        <section className="stack" aria-labelledby="sf-portada">
          <h2 className="h-sec" id="sf-portada">Portada</h2>
          <div className="row wrap">
            <label className="btn btn--ghost btn--md" style={{ cursor: "pointer" }} aria-disabled={busy === "cover"}>
              <Icon name="upload" size={18} stroke={2} />{busy === "cover" ? "Subiendo…" : shown ? "Cambiar imagen" : "Subir imagen"}
              <input type="file" accept={IMAGE_ACCEPT} className="sr-only" disabled={busy !== ""} onChange={(e) => { void pickCover(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            {shown && <button type="button" className="linkbtn" disabled={busy !== ""} onClick={dropCover}>Quitar imagen y usar la portada generada</button>}
          </div>
          {!shown && (
            <>
              <span className="muted small">Sin imagen, armamos una portada con tu título. Elige color y motivo:</span>
              <div className="row wrap">
                {COLORS.map((c, i) => (
                  <button key={c.color} type="button" className={`swatch${pal === i ? " is-on" : ""}`} style={{ background: c.color }} aria-label={`Color ${i + 1}`} aria-pressed={pal === i} onClick={() => { touch(); setPal(i); }} />
                ))}
              </div>
              <div className="chips">{ARTS.map((a) => <button key={a.id} type="button" className={`tag${art === a.id ? " tag--pick" : ""}`} aria-pressed={art === a.id} onClick={() => { touch(); setArt(a.id); }}>{a.label}</button>)}</div>
            </>
          )}
          <span className="muted small">La imagen se recorta a formato de libro (2:3). El color elegido sigue siendo el del lomo en la repisa.</span>
        </section>

        {ready && !token && <p className="notice" role="status">Para guardar necesitas tu cuenta. <Link href={auth.entrar}>Entrar</Link></p>}
        {error && <p className="notice notice--error" role="alert">{error}</p>}
        {done && <p className="notice" role="status">Cambios guardados.</p>}
        <div className="row wrap">
          <Btn type="submit" size="lg" icon={saved ? "check" : "arrow"} disabled={busy !== ""}>
            {saved ? (busy === "form" ? "Guardando…" : "Guardar cambios") : busy === "form" ? "Creando…" : "Crear borrador"}
          </Btn>
          {!editing && <Btn variant="ghost" href="/escribir">Cancelar</Btn>}
        </div>
        {!editing && <p className="muted small">Esto es la carcasa del libro: se crea como borrador y nadie la ve todavía. En el siguiente paso escribes el primer capítulo o importas tu manuscrito.</p>}
      </div>

      <aside className="preview" aria-label="Vista previa">
        <div className="shelflabel">Así se verá</div>
        <div className="preview__stage">
          <Book story={preview} size="l" />
        </div>
        <div>
          <div className="shelf__row" style={{ minHeight: 0, paddingTop: 24, overflow: "visible" }}>
            <Spine story={{ ...preview, slug: "vecino-a", title: "Otra historia", color: "#E9E1D9", ink: "#5B5C72" }} href="#" />
            <Spine story={preview} href="#" lifted />
            <Spine story={{ ...preview, slug: "vecino-b", title: "Otra historia", color: "#E9E1D9", ink: "#5B5C72", chapters: 30 }} href="#" />
          </div>
          <Board />
        </div>
      </aside>
    </form>
  );
}
