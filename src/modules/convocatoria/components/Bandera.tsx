// Banderas en SVG (no emoji: Windows muestra los emojis de bandera como letras "CO", "UY"...).
// Dibujo simplificado pero fiel a cada bandera, proporción 3:2. El ondeo y el brillo son CSS (.bandera en el módulo)
// y se apagan con prefers-reduced-motion.
import type { PaisSlug } from "@/modules/convocatoria/content/acciones";
import s from "./Convocatoria.module.css";

/** Estrella de 5 puntas centrada en (cx, cy) con radio r. */
function estrella(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.4;
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(2)},${(cy + rad * Math.sin(ang)).toFixed(2)}`);
  }
  return pts.join(" ");
}

/** Sol de Mayo simplificado (Uruguay): círculo y 16 rayos. */
function Sol({ cx, cy }: { cx: number; cy: number }) {
  const rayos = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI) / 8;
    const r1 = 2.3, r2 = i % 2 ? 3.6 : 4.3;
    return <line key={i} x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)} stroke="#FCD116" strokeWidth={0.75} strokeLinecap="round" />;
  });
  return <g>{rayos}<circle cx={cx} cy={cy} r={2.1} fill="#FCD116" stroke="#7B3F00" strokeWidth={0.25} /></g>;
}

const DIBUJOS: Record<PaisSlug, React.ReactNode> = {
  col: (
    <>
      <rect width="30" height="10" fill="#FCD116" />
      <rect y="10" width="30" height="5" fill="#003893" />
      <rect y="15" width="30" height="5" fill="#CE1126" />
    </>
  ),
  ecu: (
    <>
      <rect width="30" height="10" fill="#FFDD00" />
      <rect y="10" width="30" height="5" fill="#034EA2" />
      <rect y="15" width="30" height="5" fill="#ED1C24" />
      {/* escudo simplificado: óvalo con cielo, montaña y el cóndor insinuado */}
      <ellipse cx="15" cy="10" rx="3.1" ry="3.8" fill="#6CB4EE" stroke="#8B5A2B" strokeWidth="0.5" />
      <path d="M12.6 12.2 L15 9.2 L17.4 12.2 Z" fill="#3E8E41" />
      <path d="M12.4 6.6 Q15 5 17.6 6.6 Q15 7.4 12.4 6.6 Z" fill="#4A3B2A" />
    </>
  ),
  pan: (
    <>
      <rect width="30" height="20" fill="#FFFFFF" />
      <rect x="15" width="15" height="10" fill="#DA121A" />
      <rect y="10" width="15" height="10" fill="#072357" />
      <polygon points={estrella(7.5, 5, 2.6)} fill="#072357" />
      <polygon points={estrella(22.5, 15, 2.6)} fill="#DA121A" />
    </>
  ),
  uy: (
    <>
      <rect width="30" height="20" fill="#FFFFFF" />
      {[1, 3, 5, 7].map((i) => <rect key={i} y={(i * 20) / 9} width="30" height={20 / 9} fill="#0038A8" />)}
      <rect width="11.1" height="11.1" fill="#FFFFFF" />
      <Sol cx={5.55} cy={5.55} />
    </>
  ),
};

export default function Bandera({ pais, tamano = "s", className }: { pais: PaisSlug; tamano?: "s" | "m" | "l"; className?: string }) {
  return (
    <span className={`${s.bandera} ${s[`bandera_${tamano}`]} ${className ?? ""}`} aria-hidden>
      <svg viewBox="0 0 30 20" preserveAspectRatio="none">{DIBUJOS[pais]}</svg>
    </span>
  );
}
