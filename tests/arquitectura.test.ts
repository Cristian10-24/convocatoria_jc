// Regla de módulos (CLAUDE.md): un módulo importa solo de src/shared/ y de sí mismo, nunca de otro módulo.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MODULOS = path.resolve(__dirname, "../src/modules");

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = path.join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : /\.(ts|tsx)$/.test(nombre) ? [ruta] : [];
  });
}

describe("regla de módulos", () => {
  it("ningún módulo importa de otro módulo", () => {
    const violaciones: string[] = [];
    for (const modulo of readdirSync(MODULOS)) {
      const raiz = path.join(MODULOS, modulo);
      if (!statSync(raiz).isDirectory()) continue;
      for (const archivo of archivos(raiz)) {
        const codigo = readFileSync(archivo, "utf8");
        for (const [, destino] of codigo.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
          if (!destino) continue;
          let otro: string | undefined;
          if (destino.startsWith("@/modules/")) otro = destino.split("/")[2];
          else if (destino.startsWith(".")) {
            const resuelto = path.relative(MODULOS, path.resolve(path.dirname(archivo), destino));
            otro = resuelto.startsWith("..") ? undefined : resuelto.split(path.sep)[0];
          }
          if (otro && otro !== modulo) violaciones.push(`${path.relative(MODULOS, archivo)} → ${destino}`);
        }
      }
    }
    expect(violaciones).toEqual([]);
  });
});
