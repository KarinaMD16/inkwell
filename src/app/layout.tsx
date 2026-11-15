import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/inter";
import "@fontsource-variable/literata";
import "@fontsource-variable/literata/wght-italic.css";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: { default: "Inkwell", template: "%s · Inkwell" },
  description: "Lee y escribe historias sin anuncios en el texto. Fanfics, AU y más.",
  icons: { icon: "/inkwell-inverse.svg", shortcut: "/inkwell-inverse.svg", apple: "/inkwell-inverse.svg" },
};
export const viewport: Viewport = { themeColor: "#0F8B80" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body><SessionProvider>{children}</SessionProvider></body>
    </html>
  );
}
