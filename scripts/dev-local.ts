// Desarrollo local sin Atlas: arranca un MongoDB en memoria (con datos en .local-db/ para que sobrevivan reinicios)
// y levanta `next dev` con Uruguay abierto. Uso: npm run dev:local
// Variables que se pueden pasar: PORT (3000), CONVOCATORIA_CONFIG (por defecto Uruguay "abierta").
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const dbPath = path.resolve(".local-db");
  mkdirSync(dbPath, { recursive: true });
  const mongo = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: "wiredTiger", port: 27117 } });
  const uri = mongo.getUri();
  console.log(`[dev-local] MongoDB en memoria: ${uri} (datos en ${dbPath})`);

  const env = {
    ...process.env,
    MONGODB_URI: uri,
    MONGODB_DB: process.env.MONGODB_DB ?? "convocatoria_local",
    SESSION_SECRET: process.env.SESSION_SECRET ?? "secreto-local-de-desarrollo-solo-para-pruebas-123456",
    CONVOCATORIA_CONFIG: process.env.CONVOCATORIA_CONFIG ?? JSON.stringify({ uy: { estado: "abierta", cierra: "2027-02-15" } }),
  };
  const next = spawn(process.execPath, [path.resolve("node_modules/next/dist/bin/next"), "dev", "-p", process.env.PORT ?? "3000"], {
    env,
    stdio: "inherit",
  });

  const salir = async () => {
    next.kill();
    await mongo.stop();
    process.exit(0);
  };
  process.on("SIGINT", salir);
  process.on("SIGTERM", salir);
  next.on("exit", salir);
}

main().catch((e) => {
  console.error("[dev-local]", e);
  process.exit(1);
});
