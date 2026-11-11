// robots.txt: se indexan el selector y las landings; el formulario, el panel y la API no.
import type { MetadataRoute } from "next";
import { urlSitio } from "@/shared/config/sitio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/inscripcion", "/admin", "/api"] }],
    sitemap: `${urlSitio()}/sitemap.xml`,
  };
}
