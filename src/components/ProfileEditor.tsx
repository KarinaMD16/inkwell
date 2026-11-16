"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { refreshProfile } from "@/app/actions";
import { ApiError, api } from "@/lib/api";
import { colorFor } from "@/lib/data";
import { checkImage, IMAGE_ACCEPT, SAVED_FLAG, removeImage, uploadImage, type ImageKind, type Profile } from "@/lib/profile";
import { perfilSchema, validate, type FieldErrors } from "@/lib/validation";
import { DateField } from "./DateField";
import { ProfileLoading } from "./ProfileError";
import { ProfileEditorSkeleton } from "./Skeleton";
import { ImageCropper, type CropSpec } from "./ImageCropper";
import { Icon } from "./Icon";
import { useSession } from "./SessionProvider";
import { Avatar, Btn } from "./ui";

const BIO_MAX = 300;


function FieldMsg({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) return <span className="field__error" id={`${id}-msg`} role="alert"><Icon name="alert" size={16} stroke={2.2} />{error}</span>;
  return hint ? <span className="muted small" id={`${id}-msg`}>{hint}</span> : null;
}

/**
 * "Tu perfil" en Ajustes: portada, foto, nombre, usuario, descripción, enlace y fecha de nacimiento.
 * Las imágenes se suben apenas se eligen (con vista previa inmediata); el resto se guarda con el botón.
 */
export function ProfileEditor() {
  const { token, profile, setProfile } = useSession();
  if (!profile || !token) return <section className="card"><div className="shelflabel">Tu perfil</div><ProfileLoading skeleton={<ProfileEditorSkeleton />} /></section>;
  // key: si cambia la persona, el formulario empieza de cero con sus datos.
  const saved = (next: Profile) => {
    setProfile(next);
    // El perfil público se arma en el servidor y queda en caché: se renueva con lo recién guardado.
    refreshProfile(...new Set([profile.handle, next.handle])).catch(() => {});
  };
  return <Editor key={profile.id} profile={profile} token={token} onSaved={saved} />;
}

function Editor({ profile, token, onSaved }: { profile: Profile; token: string; onSaved: (p: Profile) => void }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bioLength, setBioLength] = useState(profile.bio.length);
  /** Hay cambios escritos que todavía no se guardaron. */
  const [dirty, setDirty] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // Avisa antes de cerrar o recargar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** Vuelve a lo último guardado. */
  function discard() {
    setFormKey((k) => k + 1);
    setErrors({});
    setError("");
    setDirty(false);
    setBioLength(profile.bio.length);
  }

  const invalid = (field: string) => ({ "aria-invalid": errors[field] ? true : undefined, "aria-describedby": `${field}-msg` });
  function clear(field: string) {
    if (errors[field]) setErrors((all) => Object.fromEntries(Object.entries(all).filter(([key]) => key !== field)));
  }
  function fail(found: FieldErrors) {
    setErrors(found);
    const first = Object.keys(found)[0];
    formRef.current?.querySelector<HTMLElement>(`[name="${first}"]:not([type="hidden"]), [data-field="${first}"] button`)?.focus();
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    const checked = validate(perfilSchema, Object.fromEntries(new FormData(e.currentTarget)));
    if (!checked.ok) return fail(checked.errors);
    setErrors({});
    const { birthdate, ...rest } = checked.data;
    // Una fecha a medio elegir no borra la que ya estaba guardada.
    const patch = birthdate ? { ...rest, birthdate } : rest;
    setBusy(true);
    try {
      const next = await api<Profile>("/me", { method: "PATCH", token, body: JSON.stringify(patch) });
      onSaved(next);
      setDirty(false);
      // De vuelta a tu perfil, con un aviso de que se guardó.
      try { sessionStorage.setItem(SAVED_FLAG, "1"); } catch { /* sin almacenamiento: solo no se ve el aviso */ }
      router.push(`/perfil/${next.handle}`);
      return; // el botón queda en "Guardando…" hasta que cambia la página
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) fail({ handle: "Ese nombre de usuario ya está en uso. Prueba con otro." });
      else if (err instanceof ApiError && Object.keys(err.fields).length) fail(err.fields);
      else setError(err instanceof Error ? err.message : "No se pudo guardar. Intenta de nuevo.");
    }
    setBusy(false);
  }

  return (
    <section className="card" aria-labelledby="perfil-titulo">
      <div className="row between wrap">
        <div className="shelflabel" id="perfil-titulo">Tu perfil</div>
        <Btn variant="ghost" size="sm" href={`/perfil/${profile.handle}`} icon="eye">Ver mi perfil</Btn>
      </div>

      <ProfileImages profile={profile} token={token} onSaved={onSaved} />

      <form key={formKey} ref={formRef} className="stack" onSubmit={save} onInput={() => setDirty(true)} noValidate>
        <div className="formgrid">
          <div className="field">
            <label className="field__label" htmlFor="name">Nombre</label>
            <input id="name" name="name" className={`input${errors.name ? " is-invalid" : ""}`} defaultValue={profile.name} maxLength={60} autoComplete="nickname" onChange={() => clear("name")} {...invalid("name")} />
            <FieldMsg id="name" error={errors.name} hint="Así aparece en tu perfil y en tus historias." />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="handle">Nombre de usuario</label>
            <span className={`input input--with${errors.handle ? " is-invalid" : ""}`}>
              <span className="muted" aria-hidden="true">@</span>
              <input id="handle" name="handle" defaultValue={profile.handle} maxLength={24} autoComplete="username" autoCapitalize="none" spellCheck={false} onChange={() => clear("handle")} {...invalid("handle")} />
            </span>
            <FieldMsg id="handle" error={errors.handle} hint="Si lo cambias, cambia también el enlace a tu perfil." />
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="bio">Descripción</label>
          <textarea
            id="bio" name="bio" className={`input input--area${errors.bio ? " is-invalid" : ""}`} defaultValue={profile.bio} rows={3}
            placeholder="Qué escribes, qué lees, tus fandoms…" onChange={(e) => { setBioLength(e.target.value.trim().length); clear("bio"); }} {...invalid("bio")}
          />
          <div className="row between">
            <FieldMsg id="bio" error={errors.bio} />
            <span className={`small ${bioLength > BIO_MAX ? "field__error" : "muted"}`} style={{ marginLeft: "auto" }}>{bioLength}/{BIO_MAX}</span>
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="link">Enlace</label>
          <input id="link" name="link" className={`input${errors.link ? " is-invalid" : ""}`} defaultValue={profile.link ?? ""} inputMode="url" autoComplete="url" autoCapitalize="none" spellCheck={false} placeholder="instagram.com/tu.nombre" onChange={() => clear("link")} {...invalid("link")} />
          <FieldMsg id="link" error={errors.link} hint="Tu Instagram, Ko-fi, un sitio… Aparece en tu perfil." />
        </div>

        <div className="field" data-field="birthdate">
          <span className="field__label" id="birthdate-label">Fecha de nacimiento</span>
          <DateField name="birthdate" label="Fecha de nacimiento" defaultValue={profile.birthdate} invalid={Boolean(errors.birthdate)} describedBy="birthdate-msg" onChange={() => { clear("birthdate"); setDirty(true); }} />
          <FieldMsg id="birthdate" error={errors.birthdate} hint="Privada: no aparece en tu perfil. La usamos para mostrarte contenido apto para tu edad." />
        </div>

        {error && <p className="notice notice--error" role="alert">{error}</p>}
        <div className={`row savebar${dirty ? " is-dirty" : ""}`}>
          <Btn type="submit" disabled={busy || !dirty}>{busy ? "Guardando…" : "Guardar cambios"}</Btn>
          {dirty && !busy && <Btn variant="ghost" onClick={discard}>Descartar</Btn>}
          {dirty && <span className="muted small savebar__note" role="status">Tienes cambios sin guardar.</span>}
        </div>
      </form>
    </section>
  );
}

const CROP: Record<ImageKind, CropSpec> = {
  avatar: { title: "Recorta tu foto de perfil", aspect: 1, shape: "round", width: 800, height: 800 },
  banner: { title: "Recorta tu portada", aspect: 3, shape: "rect", width: 1500, height: 500 },
};

/**
 * Portada y foto. Al elegir una imagen se abre el recorte; al confirmarlo se sube enseguida
 * (con la vista previa puesta mientras tanto). No dependen del botón "Guardar cambios".
 */
function ProfileImages({ profile, token, onSaved }: { profile: Profile; token: string; onSaved: (p: Profile) => void }) {
  const [preview, setPreview] = useState<Partial<Record<ImageKind, string>>>({});
  const [busy, setBusy] = useState<ImageKind | null>(null);
  const [error, setError] = useState("");
  const [cropping, setCropping] = useState<{ kind: ImageKind; src: string } | null>(null);

  // Las vistas previas locales se liberan al salir de la página.
  const created = useRef<string[]>([]);
  useEffect(() => () => created.current.forEach((url) => URL.revokeObjectURL(url)), []);
  useEffect(() => () => { if (cropping) URL.revokeObjectURL(cropping.src); }, [cropping]);

  function pick(kind: ImageKind, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file || busy) return;
    const problem = checkImage(file);
    if (problem) return setError(problem);
    setError("");
    setCropping({ kind, src: URL.createObjectURL(file) });
  }

  /** Sube el recorte. Si falla, el error se muestra dentro de la ventana de recorte. */
  async function upload(kind: ImageKind, file: File) {
    setBusy(kind);
    try {
      const updated = await uploadImage(kind, file, token);
      const local = URL.createObjectURL(file);
      created.current.push(local);
      setPreview((p) => ({ ...p, [kind]: local }));
      onSaved(updated);
      setCropping(null);
    } finally {
      setBusy(null);
    }
  }

  async function remove(kind: ImageKind) {
    if (busy) return;
    setBusy(kind);
    setError("");
    try {
      onSaved(await removeImage(kind, token));
      setPreview((p) => ({ ...p, [kind]: undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar la imagen.");
    } finally {
      setBusy(null);
    }
  }

  // Tras subir, se sigue mostrando la copia local hasta que la del servidor termina de cargar: sin parpadeo.
  const banner = profile.bannerUrl ? preview.banner ?? profile.bannerUrl : null;
  const avatar = profile.avatarUrl ? preview.avatar ?? profile.avatarUrl : null;
  const color = colorFor(profile.handle);
  return (
    <div className="stack-sm">
      <div className="mediaedit">
        <div className={`mediaedit__banner${busy === "banner" ? " is-busy" : ""}`} style={banner ? { backgroundImage: `url("${banner}")` } : { background: color }}>
          <div className="mediaedit__actions">
            <label className="mediabtn" data-anim>
              <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={(e) => pick("banner", e)} disabled={busy !== null} />
              <Icon name="upload" size={16} stroke={2.2} />{profile.bannerUrl ? "Cambiar portada" : "Subir portada"}
            </label>
            {profile.bannerUrl && <button type="button" className="mediabtn" onClick={() => remove("banner")} disabled={busy !== null} aria-label="Quitar portada" title="Quitar portada"><Icon name="x" size={16} stroke={2.2} /></button>}
          </div>
          {busy === "banner" && !cropping && <span className="mediaedit__status">Un momento…</span>}
        </div>
        <div className={`mediaedit__avatar${busy === "avatar" ? " is-busy" : ""}`}>
          <Avatar letter={profile.name[0] ?? "?"} color={color} size={104} src={avatar} />
          <label className="mediabtn mediabtn--round" aria-label={profile.avatarUrl ? "Cambiar foto de perfil" : "Subir foto de perfil"} title="Cambiar foto" data-anim>
            <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={(e) => pick("avatar", e)} disabled={busy !== null} />
            <Icon name="upload" size={16} stroke={2.2} />
          </label>
          {profile.avatarUrl && (
            <button type="button" className="mediabtn mediabtn--round mediabtn--remove" onClick={() => remove("avatar")} disabled={busy !== null} aria-label="Quitar foto de perfil" title="Quitar foto">
              <Icon name="x" size={14} stroke={2.4} />
            </button>
          )}
          {busy === "avatar" && !cropping && <span className="mediaedit__status mediaedit__status--round">Un momento…</span>}
        </div>
      </div>
      <p className="muted small mediaedit__hint">
        <span>La foto queda cuadrada y la portada, horizontal (3 a 1). Al elegir una, la encuadras antes de subirla.</span>
        <span>JPG, PNG, WebP, AVIF o GIF de hasta 8 MB. Un GIF animado queda quieto.</span>
      </p>
      {error && <p className="notice notice--error" role="alert">{error}</p>}
      {cropping && (
        <ImageCropper
          src={cropping.src} spec={CROP[cropping.kind]}
          onCancel={() => setCropping(null)} onDone={(file) => upload(cropping.kind, file)}
        />
      )}
    </div>
  );
}
