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
