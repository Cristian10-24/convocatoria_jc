import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // En Next, "server-only" impide importar módulos de servidor desde el cliente; en las pruebas no aplica.
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // mongodb-memory-server descarga/arranca el binario la primera vez: puede tardar.
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
