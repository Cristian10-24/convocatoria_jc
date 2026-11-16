// Layout raíz: fuente Outfit (next/font, servida desde el propio dominio, sin pedir a Google en cada visita),
// metadatos por defecto y URL base para las imágenes al compartir (og:image absoluta).
// Por defecto nada se indexa; las landings y el selector lo habilitan en sus propios metadatos.
import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { urlSitio } from "@/shared/config/sitio";
import "./globals.css";

// Pesos 400 a 800, como el diseño de las landings (reforma 2026-11-12): lo que pide 900 se dibuja en 800.
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap", variable: "--font-outfit" });

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio()),
  title: { default: "Convocatoria Jóvenes creaTIvos", template: "%s" },
  description: "Becas del 100 % para aprender desarrollo de software desde cero. Fundación ROFÉ · Toca una Vida.",
  robots: { index: false, follow: false },
  icons: { icon: "/logo-jc.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#e9531f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
