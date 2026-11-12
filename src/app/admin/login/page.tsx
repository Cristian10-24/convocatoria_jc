// /admin/login: ingreso al panel (estática, noindex).
import PaginaLogin, { metadataLogin } from "@/modules/auth/components/PaginaLogin";

export const metadata = metadataLogin;

export default function Page() {
  return <PaginaLogin />;
}
