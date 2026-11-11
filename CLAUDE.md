# Convocatoria Jóvenes creaTIvos · instrucciones para Claude

@AGENTS.md

App de inscripción a la convocatoria JC 2027 de la Fundación ROFÉ: landings por país, formulario por pasos y
panel de administración. Next.js 16 (App Router) + React 19 + TypeScript estricto + MongoDB Atlas, en Vercel.
El plan y las decisiones aprobadas están en `PLAN.md` (sección 0): no las cambies sin preguntar.

## Comandos

```bash
npm run dev          # http://localhost:3000 (necesita MONGODB_URI para inscribir)
npm run dev:local    # igual, con MongoDB en memoria (.local-db/) y Uruguay abierto: para probar el formulario
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm test             # vitest + mongodb-memory-server (la primera vez descarga el binario de Mongo)
npm run build        # next build: landings y formulario deben salir como ○ (estáticas)
```

Una fase está terminada cuando pasan los cuatro (typecheck, lint, test y build). Entonces se hace **un commit por fase**,
se avisa al usuario y se espera su aprobación. Nunca hagas push ni despliegues sin confirmación.

## Arquitectura (regla de módulos)

```
src/app/                 solo enrutamiento: páginas finas que montan módulos
src/modules/<modulo>/    components/ · config/ · schema.ts · service.ts · repository.ts · actions.ts
src/shared/              config (env, países) · db (Mongo) · http · security · validation · ui
```

- Un módulo importa solo de `src/shared/` y de sí mismo. Nunca de otro módulo.
- Cada módulo es dueño de sus colecciones y les pone un prefijo propio (`insc_`, `auth_`…). Sus índices se declaran con
  `conIndices("<modulo>", crear)` de `src/shared/db/mongo.ts`.
- Lógica de dominio en `service.ts`, acceso a datos en `repository.ts`, zod en `schema.ts`. El mismo esquema valida en
  el navegador y en el servidor, y el servidor siempre revalida.
- Los textos, preguntas y opciones van en `config/` de cada módulo, nunca dentro de los componentes ni de la lógica.
- Las variables de entorno se leen solo con `src/shared/config/env.ts`. Si agregas una, documéntala en `.env.example`.

## Next.js 16: cuidado

- `cookies()`, `headers()`, `params` y `searchParams` son **asíncronos**.
- `middleware.ts` ahora se llama `proxy.ts` y exporta `proxy()`.
- Antes de usar una API de Next, consulta `node_modules/next/dist/docs/` (y Context7 para otras librerías).

## Rendimiento y diseño de las landings (no revertir)

Las landings vienen del diseño entregado (`_design-ref/front/`, solo como referencia, no se versiona). Reglas de su autor:
- No animes los `path` del SVG del fondo. No uses `mix-blend-mode`, `backdrop-filter` ni `background-position` animados
  (dejaban la página a 6 fps).
- En componentes animados usa `m.` dentro de `LazyMotion strict`, nunca `motion.` (lanza un error).
- El contenido vive en `src/modules/convocatoria/content/contenido.ts`. El trato tú / vos sale de `voz` (Uruguay va en voseo).
- Landings, selector y formulario son estáticos (`○`). No leas Mongo ni cookies en esas páginas.
- Respeta `prefers-reduced-motion`. Diseña primero para celular (390 px, sin desborde horizontal).

## Seguridad y datos

- Formularios públicos (de lo más barato a lo más caro): `mismoOrigen` → tamaño y forma (`leerCuerpo`) → antibots →
  `consumir` (rate limit) → Turnstile → reglas del servicio (zod + negocio). Ver `src/app/api/inscripciones/route.ts`.
- El estado por país (abierta, próxima, cerrada) sale de `src/shared/config/convocatoria.ts` (`CONVOCATORIA_CONFIG`); la API
  lo vuelve a leer en cada envío.
- Nunca subas PII ni secretos. Las semillas de demo usan datos falsos.
- Exportaciones: siempre `celdaSegura` / `celdaCsv` (`src/shared/security/exportacion.ts`).
- El panel aplica el alcance por país **en el servidor**, en cada consulta.

## Proyectos relacionados (solo lectura)

`C:\ROFÉ\PAGINAS\validation-jc` es la app de referencia (módulo clausura). Se puede leer y copiar código de ahí, pero
**nunca modificarla**, como tampoco ningún otro proyecto fuera de esta carpeta.

## Estilo

- Código, comentarios, textos de UI y commits en español. Comentarios breves que expliquen el porqué.
- Pruebas en `tests/*.test.ts` con vitest. Para Mongo, `MongoMemoryServer` con `MONGODB_URI` apuntando a él y
  `reiniciarEntorno()`; usa una IP distinta por prueba para no chocar con el rate limit.
