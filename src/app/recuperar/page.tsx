import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function Page() {
  return <AuthForm mode="recuperar" />;
}
