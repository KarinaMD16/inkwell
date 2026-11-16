import type { Metadata } from "next";
import { AdminView } from "@/components/AdminView";

export const metadata: Metadata = { title: "Administración", robots: { index: false } };

export default function Admin() {
  return <AdminView />;
}
