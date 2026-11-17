// Mapa de calor día de la semana × hora: cuándo se inscribe la gente (útil para programar la difusión).
// Cinco niveles de color (diseño 2027); cada celda dice su valor al pasar el puntero.
import { Caja } from "./Graficas";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function MapaCalor({ datos }: { datos: { dia: number; hora: number; n: number }[] }) {
  const mapa = new Map(datos.map((d) => [`${d.dia}-${d.hora}`, d.n]));
  const max = Math.max(1, ...datos.map((d) => d.n));
  const nivel = (n: number) => (n === 0 ? 0 : Math.min(5, Math.ceil((n / max) * 5)));
  const pico = datos.reduce((a, d) => (d.n > a.n ? d : a), { dia: 1, hora: 0, n: 0 });
  return (
    <Caja titulo="¿Cuándo se inscriben?" nota="día de la semana × hora">
      <div className="calor-marco">
        <div className="calor" role="img" aria-label={pico.n ? `Inscripciones por día de la semana y hora. El momento con más inscripciones es ${DIAS[pico.dia - 1]} a las ${pico.hora}:00.` : "Sin inscripciones con estos filtros."}>
          <div className="calor-fila horas" aria-hidden="true">
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h}>{h % 3 === 0 ? h : ""}</span>
            ))}
          </div>
          {DIAS.map((nombre, i) => (
            <div key={nombre} className="calor-fila" aria-hidden="true">
              <b>{nombre}</b>
              {Array.from({ length: 24 }, (_, h) => {
                const n = mapa.get(`${i + 1}-${h}`) ?? 0;
                const v = nivel(n);
                return <i key={h} className={v ? `n${v}` : undefined} title={`${nombre} ${h}:00 · ${n} inscripciones`} />;
              })}
            </div>
          ))}
        </div>
      </div>
      <span className="calor-ley" aria-hidden="true">
        Menos <i className="n1" /><i className="n2" /><i className="n3" /><i className="n4" /><i className="n5" /> Más
      </span>
    </Caja>
  );
}
