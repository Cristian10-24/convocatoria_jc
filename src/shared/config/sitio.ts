// URL pública del sitio. Se usa en metadatos (og:image, canonical), robots.txt y sitemap.xml.
// No usa env.ts porque también la necesitan archivos que corren en el build sin variables de servidor.

export const URL_POR_DEFECTO = "https://convocatoria.tocaunavida.org";

/** APP_URL sin barra final; si falta o no es válida, el subdominio por defecto. */
export function urlSitio(): string {
  const valor = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (!valor) return URL_POR_DEFECTO;
  try {
    return new URL(valor).origin;
  } catch {
    return URL_POR_DEFECTO;
  }
}

/** Canal único de contacto de todo el sitio (dudas y derechos sobre los datos): pie, legales, confirmación y errores. */
export const CONTACTO = { correo: "jovenescreativos@tocaunavida.org" } as const;
