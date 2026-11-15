import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Crea tu cuenta" };

export default function Page() {
  return <AuthForm mode="registro" />;
}
