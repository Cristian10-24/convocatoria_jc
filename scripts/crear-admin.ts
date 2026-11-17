// Crea un usuario administrador del panel. Uso: npm run admin:crear
// Lee MONGODB_URI y MONGODB_DB de .env.local (o del entorno). Pide usuario, correo, nombre y contraseña por consola; la
// contraseña no se muestra al escribirla y nunca se recibe por argumentos ni variables de entorno (quedaría en el
// historial de la terminal).
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { cerrarDb, hostDb } from "@/shared/db/mongo";
import { CLAVE_MIN } from "@/modules/auth/schema";
import { crearUsuario } from "@/modules/auth/service";

function preguntar(texto: string, oculta = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });
    if (oculta) {
      // Muestra el texto de la pregunta pero no lo que se escribe.
      const rlInterna = rl as unknown as { _writeToOutput: (s: string) => void };
      let preguntaMostrada = false;
      rlInterna._writeToOutput = (s: string) => {
        if (!preguntaMostrada) {
          stdout.write(s);
          preguntaMostrada = true;
        }
      };
    }
    rl.question(texto, (respuesta) => {
      if (oculta) stdout.write("\n");
      rl.close();
      resolve(respuesta);
    });
  });
}

async function main() {
  if (!stdin.isTTY) throw new Error("Ejecuta este script en una terminal interactiva.");
  console.log(`Crear administrador del panel en ${hostDb() || "(MONGODB_URI sin definir)"}\n`);

  const usuario = await preguntar("Usuario (minúsculas, números, punto, guion): ");
  const correo = await preguntar("Correo institucional (con él se ingresa al panel): ");
  const nombre = await preguntar("Nombre completo: ");
  const clave = await preguntar(`Contraseña (mínimo ${CLAVE_MIN} caracteres, con una mayúscula y un número): `, true);
  const repetida = await preguntar("Repite la contraseña: ", true);
  if (clave !== repetida) throw new Error("Las contraseñas no coinciden.");

  const r = await crearUsuario({ usuario, correo, nombre, rol: "admin", paises: [], clave }, "script:admin:crear");
  if (!r.ok) {
    if (r.error === "duplicado") throw new Error(`Ya existe el usuario "${usuario.trim().toLowerCase()}" o el correo "${correo.trim().toLowerCase()}".`);
    throw new Error(Object.values(r.errores).join("\n"));
  }
  console.log(`\nListo: administrador "${usuario.trim().toLowerCase()}" creado.`);
}

main()
  .catch((e) => {
    console.error(`\n[admin:crear] ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  })
  .finally(() => cerrarDb());
