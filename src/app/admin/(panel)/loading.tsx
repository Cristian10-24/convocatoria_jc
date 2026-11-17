// Mientras carga una página del panel (diseño 2027: AdminEstados): bloques grises en lugar de los datos.
export default function CargandoPanel() {
  return (
    <div className="carga" role="status" aria-live="polite">
      <span className="solo-lector">Cargando…</span>
      <span className="sk" style={{ width: "220px", height: "36px" }} aria-hidden="true" />
      <span className="sk alto" aria-hidden="true" />
      <div className="carga-kpis" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className="sk alto" />)}
      </div>
      <span className="sk grafica" aria-hidden="true" />
      <span className="sk" style={{ width: "60%" }} aria-hidden="true" />
      <span className="sk" style={{ width: "75%" }} aria-hidden="true" />
    </div>
  );
}
