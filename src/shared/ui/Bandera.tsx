// Banderas en SVG (nunca emojis: Windows no los dibuja). Trazos y colores del lienzo de Claude Design.
// Son decorativas: el nombre del país siempre va escrito al lado.
import type { PaisSlug } from "@/shared/config/paises";

const SOMBRA = "0 0 0 1px hsl(31.8 15.6% 87.5%)"; // borde fino para las banderas con blanco

const PAN_ESTRELLA_1 = "7.50,2.40 8.11,4.16 9.97,4.20 8.49,5.32 9.03,7.10 7.50,6.04 5.97,7.10 6.51,5.32 5.03,4.20 6.89,4.16";
const PAN_ESTRELLA_2 = "22.50,12.40 23.11,14.16 24.97,14.20 23.49,15.32 24.03,17.10 22.50,16.04 20.97,17.10 21.51,15.32 20.03,14.20 21.89,14.16";
const UY_RAYOS: Array<[number, number, number, number]> = [
  [7.85, 5.55, 9.85, 5.55], [7.18, 7.18, 8.59, 8.59], [5.55, 7.85, 5.55, 9.85], [3.92, 7.18, 2.51, 8.59],
  [3.25, 5.55, 1.25, 5.55], [3.92, 3.92, 2.51, 2.51], [5.55, 3.25, 5.55, 1.25], [7.18, 3.92, 8.59, 2.51],
];

export default function Bandera({ pais }: { pais: PaisSlug }) {
  const base = { viewBox: "0 0 30 20", "aria-hidden": true, focusable: false } as const;
  if (pais === "col") {
    return (
      <svg {...base} style={{ borderRadius: 3 }}>
        <rect width="30" height="10" fill="hsl(48.8 97.5% 53.7%)" />
        <rect y="10" width="30" height="5" fill="hsl(217.1 100% 28.8%)" />
        <rect y="15" width="30" height="5" fill="hsl(353.3 84.8% 43.7%)" />
      </svg>
    );
  }
  if (pais === "ecu") {
    return (
      <svg {...base} style={{ borderRadius: 3 }}>
        <rect width="30" height="10" fill="hsl(52 100% 50%)" />
        <rect y="10" width="30" height="5" fill="hsl(211.7 96.4% 32.4%)" />
        <rect y="15" width="30" height="5" fill="hsl(357.7 85.3% 52%)" />
        <ellipse cx="15" cy="10" rx="3.1" ry="3.8" fill="hsl(206.8 79.3% 67.8%)" stroke="hsl(31.8 52.7% 35.7%)" strokeWidth="0.5" />
        <path d="M12.6 12.2 L15 9.2 L17.4 12.2 Z" fill="hsl(122.2 39.2% 40%)" />
        <path d="M12.4 6.6 Q15 5 17.6 6.6 Q15 7.4 12.4 6.6 Z" fill="hsl(31.8 27.6% 22.7%)" />
      </svg>
    );
  }
  if (pais === "pan") {
    return (
      <svg {...base} style={{ borderRadius: 3, boxShadow: SOMBRA }}>
        <rect width="30" height="20" fill="hsl(0 0% 100%)" />
        <rect x="15" width="15" height="10" fill="hsl(357.6 84.7% 46.3%)" />
        <rect y="10" width="15" height="10" fill="hsl(219 85.1% 18.4%)" />
        <polygon points={PAN_ESTRELLA_1} fill="hsl(219 85.1% 18.4%)" />
        <polygon points={PAN_ESTRELLA_2} fill="hsl(357.6 84.7% 46.3%)" />
      </svg>
    );
  }
  return (
    <svg {...base} style={{ borderRadius: 3, boxShadow: SOMBRA }}>
      <rect width="30" height="20" fill="hsl(0 0% 100%)" />
      {[2.22, 6.67, 11.11, 15.56].map((y) => <rect key={y} y={y} width="30" height="2.22" fill="hsl(220 100% 32.9%)" />)}
      <rect width="11.1" height="11.1" fill="hsl(0 0% 100%)" />
      <g stroke="hsl(48.8 97.5% 53.7%)" strokeWidth="0.75" strokeLinecap="round">
        {UY_RAYOS.map(([x1, y1, x2, y2]) => <line key={`${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} />)}
      </g>
      <circle cx="5.55" cy="5.55" r="2.1" fill="hsl(48.8 97.5% 53.7%)" stroke="hsl(31.8 100% 24.1%)" strokeWidth="0.25" />
    </svg>
  );
}
