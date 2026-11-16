import { z } from "zod";

/** Edad mínima para crear una cuenta. Es una decisión de producto: cámbiala aquí. */
export const MIN_AGE = 13;

/** Años cumplidos a partir de una fecha "AAAA-MM-DD". Devuelve null si la fecha no existe. */
export function ageFrom(iso: string, today = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  // new Date(2025, 1, 30) "corrige" a marzo: si cambió algo, la fecha no existe.
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  let age = today.getFullYear() - y;
  if (today.getMonth() < mo - 1 || (today.getMonth() === mo - 1 && today.getDate() < d)) age--;
  return age;
}

const correo = z.string().trim().min(1, "Escribe tu correo.").pipe(z.email("Ese correo no parece válido."));
const claveNueva = z.string().min(8, "Usa al menos 8 caracteres.").max(72, "Usa 72 caracteres como máximo.");

export const entrarSchema = z.object({
  correo,
  clave: z.string().min(1, "Escribe tu contraseña."),
});

const usuario = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Usa al menos 3 caracteres.")
  .max(24, "Usa 24 caracteres como máximo.")
  .regex(/^[a-z0-9._]+$/, "Solo letras, números, punto y guion bajo, sin espacios.");

const nacimiento = z
  .string()
  .min(1, "Elige tu fecha de nacimiento.")
  .refine((v) => ageFrom(v) !== null, "Esa fecha no existe.")
  .refine((v) => (ageFrom(v) ?? 0) >= 0, "Esa fecha todavía no llega.")
  .refine((v) => { const a = ageFrom(v); return a === null || a < 0 || a >= MIN_AGE; }, `Necesitas tener al menos ${MIN_AGE} años para crear una cuenta.`);

export const registroSchema = z.object({
  usuario,
  correo,
  clave: claveNueva,
  nacimiento,
  acepta: z.literal("on", "Tienes que aceptar los términos para crear la cuenta."),
});

export const recuperarSchema = z.object({ correo });

export const claveNuevaSchema = z
  .object({ clave: claveNueva, repetir: z.string().min(1, "Repite la contraseña.") })
  .refine((v) => v.clave === v.repetir, { path: ["repetir"], message: "Las dos contraseñas no coinciden." });

/** "instagram.com/ana" → "https://instagram.com/ana". Vacío → "". Igual que hace la API. */
export function normalizeLink(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
}

/** Formulario "Tu perfil" de Ajustes. Los nombres de campo son los de la API. */
export const perfilSchema = z.object({
  name: z.string().trim().min(1, "Escribe tu nombre.").max(60, "Usa 60 caracteres como máximo."),
  handle: usuario,
  bio: z.string().trim().max(300, "La descripción admite hasta 300 caracteres."),
  link: z
    .string()
    .transform(normalizeLink)
    .refine((v) => {
      if (!v) return true;
      if (!URL.canParse(v)) return false;
      const u = new URL(v);
      return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".");
    }, "Escribe una dirección web, por ejemplo instagram.com/tu.nombre.")
    .refine((v) => v.length <= 200, "El enlace es demasiado largo.")
    .transform((v) => v || null),
  // Opcional: las cuentas creadas con Google no la piden al registrarse.
  birthdate: z.union([z.literal("").transform(() => null), nacimiento]),
});

export const correoSchema = z.object({ correo });

export type FieldErrors = Record<string, string>;

/** Valida y devuelve o los datos ya limpios o un mensaje por campo (el primero de cada uno). */
export function validate<T>(schema: z.ZodType<T>, values: unknown): { ok: true; data: T } | { ok: false; errors: FieldErrors } {
  const parsed = schema.safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}
