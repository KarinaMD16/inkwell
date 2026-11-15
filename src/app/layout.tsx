import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/inter";
import "@fontsource-variable/literata";
import "@fontsource-variable/literata/wght-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Inkwell", template: "%s · Inkwell" },
  description: "Lee y escribe historias sin anuncios en el texto. Fanfics, AU y más.",
};
export const viewport: Viewport = { themeColor: "#0F8B80" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
