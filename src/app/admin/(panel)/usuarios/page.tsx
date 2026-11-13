// /admin/usuarios: gestión de usuarios del panel (solo admin; para los demás es un 404).
import GestionUsuarios from "@/modules/auth/components/GestionUsuarios";
import { listarUsuarios } from "@/modules/auth/service";
import { exigirPagina } from "@/modules/auth/servidor";

export default async function Page() {
  const u = await exigirPagina("gestionar_usuarios");
  const usuarios = await listarUsuarios();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#1c2a7a" }}>Usuarios</h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#4b4a5c" }}>Quién puede entrar al panel y qué ve cada uno.</p>
      </div>
      <GestionUsuarios usuarios={usuarios} yo={u.id} />
    </div>
  );
}
