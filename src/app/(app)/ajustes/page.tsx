import type { Metadata } from "next";
import { SettingsView } from "@/components/SettingsView";

export const metadata: Metadata = { title: "Ajustes" };

export default function Ajustes() {
  return <SettingsView />;
}
