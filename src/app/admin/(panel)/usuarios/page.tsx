// /admin/usuarios: gestión de usuarios del panel (solo admin; para los demás es un 404).
import GestionUsuarios from "@/modules/auth/components/GestionUsuarios";
import { listarUsuarios } from "@/modules/auth/service";
import { exigirPagina } from "@/modules/auth/servidor";

export default async function Page() {
  const u = await exigirPagina("gestionar_usuarios");
  const usuarios = await listarUsuarios();
  return (
    <div className="u-pagina">
      <div className="t-cab">
        <div>
          <h1>Usuarios</h1>
          <p>Quién puede entrar al panel y qué ve cada uno. Solo administración ve esta sección.</p>
        </div>
      </div>
      <GestionUsuarios usuarios={usuarios} yo={u.id} />
    </div>
  );
}
