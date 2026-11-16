"use server";

import { updateTag } from "next/cache";
import { profileTag } from "@/lib/profile";
import { storyTag } from "@/lib/story";

/**
 * Vence la caché del perfil público después de editarlo, para que quien lo visite vea los
 * cambios de inmediato y no hasta dentro de unos minutos. No toca datos: lo peor que puede
 * hacer alguien al llamarla es que la próxima visita se lea otra vez desde la API.
 */
export async function refreshProfile(...handles: string[]) {
  for (const handle of handles) {
    if (/^[a-z0-9._]{3,24}$/.test(handle)) updateTag(profileTag(handle));
  }
}

/** Lo mismo para una historia: su ficha, su índice y sus capítulos se vuelven a leer de la API. */
export async function refreshStory(slug: string) {
  if (/^[a-z0-9-]{1,80}$/.test(slug)) updateTag(storyTag(slug));
}
