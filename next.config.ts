import type { NextConfig } from "next";

/** Encabezados de seguridad para toda la app. */
const SEGURIDAD = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

/** Las landings se indexan; el formulario, la API y el panel no. */
const NO_INDEXAR = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Enlaces ya compartidos → rutas definitivas del rediseño 2027, siempre en un solo salto (sin cadenas) y de forma
  // permanente (308). Next conserva la consulta (?utm_source=...), así que los UTM y el fbclid no se pierden.
  async redirects() {
    const landing = { col: "/colombia", pan: "/panama", ecu: "/ecuador", uy: "/uruguay" };
    return [
      // Landings cortas (en producción desde la apertura de Uruguay) y las /conv_* del diseño original.
      { source: "/col", destination: landing.col, permanent: true },
      { source: "/ecu", destination: landing.ecu, permanent: true },
      { source: "/uy", destination: landing.uy, permanent: true },
      { source: "/conv_col", destination: landing.col, permanent: true },
      { source: "/conv_pan", destination: landing.pan, permanent: true },
      { source: "/conv_ecu", destination: landing.ecu, permanent: true },
      { source: "/conv_uy", destination: landing.uy, permanent: true },
      { source: "/convocatoria", destination: "/", permanent: true },
      // Sin términos oficiales todavía: redirección temporal (307) hasta que la Fundación los entregue.
      { source: "/terminos", destination: "/privacidad", permanent: false },
      // Formularios con el segmento corto.
      { source: "/inscripcion/col", destination: "/inscripcion/colombia", permanent: true },
      { source: "/inscripcion/ecu", destination: "/inscripcion/ecuador", permanent: true },
      { source: "/inscripcion/uy", destination: "/inscripcion/uruguay", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: SEGURIDAD },
      { source: "/inscripcion/:path*", headers: NO_INDEXAR },
      { source: "/admin/:path*", headers: NO_INDEXAR },
      { source: "/api/:path*", headers: NO_INDEXAR },
    ];
  },
};

export default config;
