import type { Metadata } from "next";
import { EditProfileView } from "@/components/EditProfileView";

export const metadata: Metadata = { title: "Editar perfil" };

export default function EditarPerfil() {
  return <EditProfileView />;
}
