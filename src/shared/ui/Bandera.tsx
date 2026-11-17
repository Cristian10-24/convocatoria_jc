// Banderas oficiales (nunca emojis: Windows no los dibuja). Imágenes WebP en public/banderas/, recortadas de los
// archivos oficiales que entregó la Fundación, en 64 y 128 px de ancho (1x y 2x para los tamaños que usa el sitio).
// Se muestran sin deformar (object-fit: contain) en la caja 3:2 del diseño.
import { NOMBRE_PAIS, type PaisSlug } from "@/shared/config/paises";

// Borde fino para las banderas con mucho blanco (Panamá, Uruguay), como en el diseño.
const CON_BORDE: readonly PaisSlug[] = ["pan", "uy"];

export default function Bandera({ pais }: { pais: PaisSlug }) {
  return (
    <img
      src={`/banderas/${pais}-64.webp`}
      srcSet={`/banderas/${pais}-64.webp 1x, /banderas/${pais}-128.webp 2x`}
      alt={`Bandera de ${NOMBRE_PAIS[pais]}`}
      width={30}
      height={20}
      decoding="async"
      className={CON_BORDE.includes(pais) ? "bandera con-borde" : "bandera"}
    />
  );
}
