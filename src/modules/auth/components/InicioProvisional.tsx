// Inicio del panel mientras llega la fase 4: muestra quién entró, su rol y su alcance, y permite salir.
import { NOMBRE_PAIS } from "@/shared/config/paises";
import { NOMBRE_ROL } from "../config/roles";
import { TEXTOS_AUTH as T } from "../config/textos";
import { alcanceDe } from "../permisos";
import type { UsuarioSesion } from "../service";
import BotonSalir from "./BotonSalir";
import s from "./Auth.module.css";

export default function InicioProvisional({ usuario }: { usuario: UsuarioSesion }) {
  const alcance = alcanceDe(usuario);
  const paises =
    usuario.rol !== "coordinador"
      ? T.todosLosPaises
      : alcance.paises.length === 0
        ? T.sinPaises
        : alcance.paises.map((p) => NOMBRE_PAIS[p]).join(", ");

  return (
    <main className={s.raiz}>
      <section className={`${s.tarjeta} ${s.tarjetaAncha}`}>
        <div className={s.encabezadoPanel}>
          <h1 className={s.titulo}>{T.bienvenida.replace("{nombre}", usuario.nombre)}</h1>
          <BotonSalir />
        </div>
        <dl className={s.datos}>
          <dt>{T.rol}</dt>
          <dd>{NOMBRE_ROL[usuario.rol]}</dd>
          <dt>{T.paises}</dt>
          <dd>{paises}</dd>
        </dl>
        <p className={s.nota}>{T.panelPendiente}</p>
      </section>
    </main>
  );
}
