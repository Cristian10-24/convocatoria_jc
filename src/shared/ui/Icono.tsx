// Iconos de línea del diseño 2027 (trazo de 1.6 px en el sitio y 1.5 px en el panel; lo fija la clase `i`).
// Son decorativos: van con aria-hidden y el texto que los acompaña es el que se lee.
import type { CSSProperties, ReactNode } from "react";

const TRAZOS = {
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
  "flecha-atras": <path d="M19 12H5M11 6l-6 6 6 6" />,
  anterior: <path d="M15 6l-6 6 6 6" />,
  siguiente: <path d="M9 6l6 6-6 6" />,
  abajo: <path d="M6 9l6 6 6-6" />,
  visto: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  equis: <path d="M7 7l10 10M17 7L7 17" />,
  mas: <path d="M12 5v14M5 12h14" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  alerta: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5.5M12 16.2v.3" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.8v.3" /></>,
  reloj: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  escudo: <><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>,
  candado: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  sobre: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 7l8.5 6 8.5-6" /></>,
  buscar: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  descargar: <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />,
  documento: <><rect x="4" y="3.5" width="16" height="17" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  birrete: <><path d="M2.5 9L12 4.5 21.5 9 12 13.5z" /><path d="M6.5 11v5c1.5 1.5 3.5 2.3 5.5 2.3s4-.8 5.5-2.3v-5M21.5 9v5" /></>,
} satisfies Record<string, ReactNode>;

export type NombreIcono = keyof typeof TRAZOS;

export default function Icono({ nombre, clase, tam, estilo }: { nombre: NombreIcono; clase?: string; tam?: number; estilo?: CSSProperties }) {
  const medida = tam ? { width: tam, height: tam } : undefined;
  return (
    <svg className={clase ? `i ${clase}` : "i"} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ ...medida, ...estilo }}>
      {TRAZOS[nombre]}
    </svg>
  );
}
