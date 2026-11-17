// sitemap.xml con las 5 páginas públicas indexables: la landing principal y las 4 de país.
import type { MetadataRoute } from "next";
import { PAISES } from "@/modules/convocatoria/content/contenido";
import { urlSitio } from "@/shared/config/sitio";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlSitio();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...Object.values(PAISES).map((p) => ({ url: `${base}${p.ruta}`, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
