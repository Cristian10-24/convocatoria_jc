// Mapa de calor día de la semana × hora: cuándo se inscribe la gente (útil para programar la difusión).
import s from "./Panel.module.css";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function MapaCalor({ datos }: { datos: { dia: number; hora: number; n: number }[] }) {
  const mapa = new Map(datos.map((d) => [`${d.dia}-${d.hora}`, d.n]));
  const max = Math.max(1, ...datos.map((d) => d.n));
  return (
    <section className={`${s.tarjeta} ${s.tarjetaAncha}`}>
      <h2>
        ¿Cuándo se inscriben?
        <small>día de la semana × hora</small>
      </h2>
      <div className={s.desplazable}>
        <div className={s.calor} role="img" aria-label="Inscripciones por día de la semana y hora">
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h}>{h % 3 === 0 ? h : ""}</span>
          ))}
          {DIAS.map((nombre, i) => (
            <Fila key={nombre} nombre={nombre} dia={i + 1} mapa={mapa} max={max} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Fila({ nombre, dia, mapa, max }: { nombre: string; dia: number; mapa: Map<string, number>; max: number }) {
  return (
    <>
      <span style={{ textAlign: "left" }}>{nombre}</span>
      {Array.from({ length: 24 }, (_, h) => {
        const n = mapa.get(`${dia}-${h}`) ?? 0;
        return (
          <i
            key={h}
            className={n === 0 ? s.calorVacio : undefined}
            style={n ? { opacity: 0.15 + 0.85 * (n / max) } : undefined}
            title={`${nombre} ${h}:00 – ${n} inscripciones`}
          />
        );
      })}
    </>
  );
}
