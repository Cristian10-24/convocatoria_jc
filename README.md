# Convocatoria Jóvenes creaTIvos 2027

App de inscripción de la Fundación ROFÉ: landings por país, formulario de inscripción por pasos y panel de
administración. Next.js 16 (App Router) + React 19 + TypeScript + MongoDB Atlas, desplegada en Vercel.

| Ruta | Qué es | Render |
|---|---|---|
| `/` | Selector de país | estática, indexable |
| `/col`, `/panama`, `/ecu`, `/uy` | Landings por país | estáticas, indexables |
| `/inscripcion/<país>` | Formulario por pasos | estático, `noindex` |
| `/admin/login` | Ingreso al panel | estático, `noindex` |
| `/admin` · `/admin/inscritos` · `/admin/usuarios` | Panel (tablero, lista y detalle, usuarios) | dinámico, con sesión |
| `/api/inscripciones` | Recibe inscripciones | función |
| `/api/auth/*`, `/api/admin/*` | Sesión, exportación y usuarios | función |

## Desarrollo local

```bash
npm install
npm run dev:local     # MongoDB en memoria (.local-db/) + Uruguay abierto → http://localhost:3000
```

Con `dev:local` corriendo, en otra terminal:

```bash
npm run semilla:demo          # 3000 inscripciones FALSAS para ver el panel (--borrar las quita)
```

Para crear tu usuario del panel en la base local (PowerShell):

```powershell
$env:MONGODB_URI="mongodb://127.0.0.1:27117/"; $env:MONGODB_DB="convocatoria_local"; npm run admin:crear
```

> No corras `npm run build` con `dev:local` encendido: el build reescribe `.next` y deja roto al servidor de
> desarrollo (se arregla reiniciándolo).

Comprobaciones (una fase está terminada cuando pasan las cuatro):

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

## Variables de entorno

Se validan en `src/shared/config/env.ts`. En Vercel van en *Settings → Environment Variables* (Production y Preview).

| Variable | Obligatoria | Para qué |
|---|---|---|
| `MONGODB_URI` | sí | Cadena de conexión de Atlas (`mongodb+srv://…`). |
| `MONGODB_DB` | no (`convocatoria_jc`) | Nombre de la base. Usa una distinta para Preview. |
| `SESSION_SECRET` | sí | Firma de la sesión del panel. **Mínimo 32 caracteres** aleatorios. Cambiarlo cierra todas las sesiones. |
| `IP_HASH_SALT` | sí en producción | Sal para guardar la IP solo como hash. Aleatoria, y no la cambies después de abrir. |
| `TURNSTILE_SECRET_KEY` | sí en producción | Clave secreta de Cloudflare Turnstile. Sin ella, en producción **ninguna inscripción entra** (falla cerrado). |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | sí en producción | Clave pública de Turnstile. Se incrusta **en el build**: si la cambias, vuelve a desplegar. |
| `APP_URL` | recomendada | URL pública (p. ej. `https://convocatoria.tocaunavida.org`). Metadatos, sitemap y robots. |
| `CONVOCATORIA_CONFIG` | no | Estado por país en JSON, p. ej. `{"uy":{"estado":"abierta","cierra":"2027-02-15"}}`. Ver abajo. |
| `CONVOCATORIA_ID` | no (`jc-2027`) | Identificador de la cohorte. |
| `RATE_LIMIT_INSCRIPCION` | no (60) | Envíos por IP cada 15 min (los colegios comparten IP). |
| `RATE_LIMIT_LOGIN` | no (10) | Intentos fallidos de login por IP y por usuario cada 15 min. |
| `MONGODB_MAX_POOL` | no (10) | Conexiones por instancia de función. |
| `NEXT_PUBLIC_PRIVACY_URL` | no | Enlace a la política de privacidad en el pie de las landings. |

Genera secretos así (cada uno distinto):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### Abrir y cerrar la convocatoria

`CONVOCATORIA_CONFIG` define el estado de cada país (`proxima`, `abierta`, `cerrada`) y la fecha de cierre.

- **La API lo lee en cada envío**: cerrar un país rechaza inscripciones al instante.
- **Las landings y el formulario son estáticos**: el botón «Postular» y el aviso «Inscripciones muy pronto» se
  arman en el build. Después de cambiar la variable, haz *Redeploy* en Vercel para que las páginas lo reflejen.
- El formulario de cada país también debe estar `habilitado: true` en `src/modules/inscripcion/config/paises.ts`
  (hoy solo Uruguay; Colombia, Panamá y Ecuador esperan la confirmación de sus datos).

## Publicar en Vercel (primera vez)

1. **MongoDB Atlas**
   - Crea un cluster en la **misma región que las funciones de Vercel**. Lo más simple: Atlas en AWS `us-east-1`
     (N. Virginia) y Vercel en su región por defecto (`iad1`, Washington). Si prefieres Sudamérica, usa Atlas en
     `sa-east-1` (São Paulo) y fija la región de Vercel en `gru1` (*Settings → Functions → Region*).
   - Tamaño: **M10 o superior durante la apertura**. M0/Flex sirve para previews y pruebas, no para la apertura.
   - *Database Access*: un usuario solo con `readWrite` sobre la base de la app.
   - *Network Access*: Vercel no tiene IPs fijas en los planes comunes; permite `0.0.0.0/0` (la contraseña larga del
     usuario es la protección) o usa la integración de Vercel con Atlas.
   - Crea también una base aparte para Preview y pruebas de carga (otro `MONGODB_DB` u otro cluster).
2. **Cloudflare Turnstile**: crea un *widget* para el dominio (y `localhost` si quieres probar) y copia las dos claves.
3. **Repositorio**: sube este proyecto a GitHub (privado) e impórtalo en Vercel (*Add New → Project*). Framework:
   Next.js, sin cambiar comandos.
4. **Variables**: carga las de la tabla anterior en Production (y Preview con su base de pruebas).
5. **Primer despliegue** y revisa que el build termine con las landings y el formulario como estáticos (`○`/`●`).
6. **Primer administrador**: desde tu equipo, apuntando a Atlas (no se guarda nada en el repositorio):
   ```powershell
   $env:MONGODB_URI="<uri de atlas>"; $env:MONGODB_DB="convocatoria_jc"; npm run admin:crear
   ```
   Luego entra a `/admin/login` y crea al resto del equipo desde **Usuarios** (cada uno recibe una contraseña
   temporal que se muestra una sola vez).
7. **Dominio propio**: en Vercel *Settings → Domains* agrega `convocatoria.tocaunavida.org`; en el DNS de
   `tocaunavida.org` crea el registro `CNAME convocatoria → cname.vercel-dns.com` (o el que indique Vercel).
   Actualiza `APP_URL` y vuelve a desplegar.
8. **Antes de abrir**: reemplaza los textos legales marcados `[PROVISIONAL]` (`src/modules/inscripcion/config/legal.ts`),
   haz una inscripción real de prueba y bórrala desde Atlas, y revisa el checklist de abajo.

### Checklist de apertura

- [ ] Atlas M10+ en la misma región que Vercel; usuario de base solo con `readWrite`.
- [ ] `SESSION_SECRET`, `IP_HASH_SALT`, `TURNSTILE_SECRET_KEY` y `NEXT_PUBLIC_TURNSTILE_SITE_KEY` cargadas en Production.
- [ ] `CONVOCATORIA_CONFIG` con el país en `abierta` y su fecha de cierre; *Redeploy* hecho.
- [ ] Textos legales definitivos (sin `[PROVISIONAL]`).
- [ ] Inscripción de prueba completa desde un celular, con su radicado; aparece en `/admin/inscritos`.
- [ ] Exportación a Excel probada con un usuario de cada rol.
- [ ] Prueba de carga contra un **preview** con la base de pruebas (no contra producción).
- [ ] `robots.txt` y `sitemap.xml` con el dominio definitivo.

## Panel y permisos

| Rol | Países | Detalle sensible (género, poblaciones, ingresos) | Exporta | Gestiona usuarios |
|---|---|---|---|---|
| Administración | todos | sí | sí (con esas columnas) | sí |
| Coordinación de país | solo los asignados (sin países = no ve nada) | no (solo agregado) | sí, sin esas columnas | no |
| Consulta | todos | no (solo agregado) | sí, sin esas columnas | no |

El alcance se aplica en el servidor en cada consulta y cada exportación queda registrada en `auth_auditoria`.

## Arquitectura

```
src/app/            solo rutas: páginas finas que montan módulos
src/modules/        convocatoria (landings) · inscripcion (formulario, API y panel de inscritos) · auth (sesión, usuarios)
src/shared/         config, db, http, seguridad, validación y UI común
```

Un módulo importa solo de `src/shared/` y de sí mismo (`tests/arquitectura.test.ts` lo vigila). Detalles y
decisiones en `PLAN.md` y `CLAUDE.md`.
