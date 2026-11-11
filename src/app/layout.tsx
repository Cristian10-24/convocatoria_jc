// Layout raíz. La fuente, los metadatos completos y el diseño de las landings llegan en la fase 1.
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Convocatoria Jóvenes creaTIvos",
  description: "Inscripciones a Jóvenes creaTIvos de la Fundación ROFÉ.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#e9531f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
