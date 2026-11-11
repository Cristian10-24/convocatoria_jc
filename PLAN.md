# Plan · App de inscripción Convocatoria Jóvenes creaTIvos 2027

> Estado: **plan aprobado (v2, con los ajustes del equipo)**. Fases 0, 1 y 2 terminadas; sigue la fase 3 (autenticación del panel).
> El modelo de datos vigente de la inscripción está en `src/modules/inscripcion/repository.ts` (tipo `Inscripcion`) y `schema.ts` (`DatosInscripcion`).
> Referencias de solo lectura: `_design-ref/front/` (código del front extraído del zip) y `C:\ROFÉ\PAGINAS\validation-jc`. Ningún otro proyecto se modifica.

---

## 0. Decisiones aprobadas

| # | Tema | Decisión |
|---|---|---|
| 1 | Campos | Se aprueba el formulario propuesto (sección 4), **sin etnia ni discapacidad por ahora**. Todas las preguntas, opciones y textos viven en archivos de configuración (`src/modules/inscripcion/config/`), no en la lógica. |
| 2 | Ubicación | En todos los países: **primero la sede, luego la ciudad de residencia** (lista editable + "Otra" con texto). Si el país tiene una sola sede, se asigna sola. Uruguay: Paysandú (Paysandú, Guichón, Quebracho, Salto, Fray Bentos, Young, Colón y Concepción del Uruguay [Argentina]) y Colonia (Colonia del Sacramento, Carmelo, Nueva Palmira, Juan Lacaze, Rosario, Nueva Helvecia, Tarariras, Colonia Valdense, Ombúes de Lavalle). El panel muestra inscritos por **país, sede y ciudad**. |
| 3 | Requisitos no cumplidos | Se deja inscribir. Se guardan `alertas[]` con código y motivo (sin computador, sin internet, sin 8 h, edad o año de grado fuera de rango) y el panel tiene filtro por alerta. |
| 4 | Duplicados | Índice único `{ convocatoria, pais, tipoDocumento, documento }`. El correo repetido **no** se bloquea: se marca `posibleDuplicado` (alerta). |
| 5 | Textos legales | Provisionales, marcados con `[PROVISIONAL]`, en archivos fáciles de reemplazar (`config/legal/<pais>.ts`, `acudiente.ts`). Se guarda la versión aceptada. |
| 6 | Dominio y rutas | Subdominio de `tocaunavida.org` (p. ej. `convocatoria.tocaunavida.org`). `/` = selector de país. Landings en `/col`, `/panama`, `/ecu`, `/uy`; `/conv_*` redirigen (308). **Landings indexables**; formulario, confirmación y panel con `noindex`. |
| 7 | Correo | Sin correo por ahora (solo pantalla de confirmación). La estructura queda lista: interfaz `Notificador` con implementación vacía que se puede reemplazar. **Resend sale de la fase 5.** |

**Decisiones del formulario (fase 2, sobre el formulario oficial de Uruguay 2026)**

| # | Tema | Decisión |
|---|---|---|
| F1 | Contenido | Las preguntas son las del formulario oficial (las mismas para los 4 países). La organización, las condiciones y las validaciones son las de la sección 4. |
| F2 | Países | Se implementa completo **Uruguay**. Colombia, Panamá y Ecuador quedan listos en configuración (tipos de documento, grados, escala de notas, trato) con "Inscripciones muy pronto" hasta confirmar sus datos. |
| F3 | Edad | Menos de 14 años **bloquea** (lo exige el texto legal). Más de 30 años se marca como alerta. Menores de 18 llenan el paso del acudiente. |
| F4 | "¿Vives en Uruguay?" | Se quita: sede y ciudad lo resuelven (incluye Colón y Concepción del Uruguay). |
| F5 | Identificación | Cédula (con dígito verificador), Pasaporte, Carné de residencia, DNI argentino, Otro (con texto). |
| F6 | Número alterno | Obligatorio y distinto del WhatsApp. |
| F7 | Promedio | Con decimales, en la escala del país (Uruguay 1–12), obligatorio para todos. |
| F8 | Alertas | Sin internet · sin acceso a computadora · menos de 5 horas o entre 5 y 10 horas · más de 30 años · egresó hace más de 3 años · correo repetido. |
| F9 | Condicionales | "¿Fuiste seleccionado?" solo si aplicó antes · embajador solo si el canal es "Embajador" · año de egreso solo si ya es bachiller · "Otro" pide texto. |
| F10 | Tallas | XS, S, M, L, XL, XXL; obligatoria para todos. |
| F11 | Poblaciones | Selección múltiple; "Ninguna de las anteriores" es excluyente. |
| F12 | Legal | Texto adaptado a cada país (Uruguay: Ley 18.331 y URCDP) marcado `[PROVISIONAL]`; aceptar es obligatorio. |
| F13 | Trato | El del país (Uruguay en voseo) en todo el formulario. |
| F14 | Datos sensibles | Poblaciones, ingresos y género: solo el rol **admin** ve el detalle individual; los demás roles ven gráficas agregadas y esos campos se excluyen de su exportación. |

**Ajustes técnicos aprobados**
- Rate limit de **60 envíos / 15 min por IP** (los colegios comparten IP). Cloudflare **Turnstile activo en producción** desde el lanzamiento (en producción, sin `TURNSTILE_SECRET_KEY` el envío falla cerrado).
- **Radicado** único: derivado del `_id` (`JC27-COL-XXXXXX`) con índice único y reintento con un `_id` nuevo si choca.
- Se **borra el borrador de `sessionStorage`** al confirmar la inscripción.
- La exportación **sanitiza celdas** que empiecen con `=`, `+`, `-` o `@` (inyección de fórmulas).
- Prueba de carga contra un **preview de Vercel** con una **base de pruebas en Atlas**. El README documenta: Atlas en la **misma región** que Vercel y **al menos M10** durante la apertura.

---

## 1. Qué encontré

### 1.1 El zip trae el front ya programado
`entrega-convocatoria-jc.zip` es un parche de git (88 archivos) hecho para `validacion_jc`; está extraído en `_design-ref/front/`.

| Pieza | Contenido |
|---|---|
| Rutas | selector + 4 landings estáticas |
| Componentes | `ConvocatoriaPagina` (server), `Efectos` (framer-motion con `LazyMotion` + `m.*`), `Interactivos` (ruta, galería con visor, checklist con confeti, cuenta regresiva, FAQ), `Bandera` (SVG), `EncabezadoPegajoso`, `BotonAccion`, `VideoTestimonio` (YouTube diferido), `Convocatoria.module.css` |
| Contenido | `contenido.ts`: cohorte 2027 (marzo–noviembre, 8 meses, 8 h/semana), tuteo/voseo, grados por país, sedes, fotos, testimonios, FAQ |
| Botones | `acciones.ts`: `CONVOCATORIA_CONFIG` (zod) con `enlace`, `ruta`, `ancla`, `evento`, `pendiente` |
| Fotos | 32 webp (8 por país, 1600 y 800 px) |

**No revertir** (del propio doc del front): no animar los `path` del SVG, sin `mix-blend-mode` ni `backdrop-filter`, usar `m.` y no `motion.`.
**Diseño:** Outfit, durazno `#fdf8f4`, naranja `#e9531f`, marino `#1c2a7a`, sol `#ffc845`, azules `#1f6fb5`/`#4fa3e3`, tinta `#1d1b2c`.
**Dependencias externas del front:** `/logo-jc.png` y la fuente Outfit (de validation-jc; se copian).

### 1.2 validation-jc: qué se reutiliza
| Reutilizo | Origen |
|---|---|
| Singleton de Mongo en `globalThis`, índices por módulo, colecciones con prefijo | `lib/db.ts`, `clausura/db.ts` |
| Rate limit con ventana fija y TTL | `lib/rateLimit.ts` |
| `sameOrigin`, `leerCuerpo` (tope 64 KB + zod), errores `{ error, errores }` | `lib/auth.ts`, `clausura/rutas.ts` |
| Normalizadores y validadores (nombre, documento, correo con sugerencia, texto con sentido, teléfono) | `lib/validation/*`, `clausura/formulario/textos.ts`, `clausura/contacto.ts`, `testimonios/celular.ts` |
| Login admin: bcrypt, hash señuelo, cookie HMAC con `tokenVersion`, roles | `lib/auth.ts`, `permisos.ts`, `usuarios.ts` |
| Flujo por pasos con el mismo esquema en cliente y servidor, bloqueo de doble envío | `ClausuraFlujo.tsx`, `motor.ts` |
| Exportación exceljs, refresco cada 30 s con la pestaña visible, encabezados de seguridad | `exportar.ts`, `ClausuraPanel.tsx`, `next.config.ts` |
| Pruebas con vitest + mongodb-memory-server | `tests/clausura-*.ts` |

**No aplica:** ingreso con estudiantes precargados, borradores/edición, motor de formularios dinámico, filtrado en el cliente sin paginación, gráficas solo con barras CSS (aquí: Recharts, cargado solo en `/admin`).
**Cuidado con Next 16:** `proxy.ts` reemplaza a `middleware.ts`; `cookies()`, `params` y `searchParams` son asíncronos; zod v4. Se consulta la documentación vigente antes de cada fase.

---

## 2. Arquitectura

```
Visitante ──► CDN de Vercel (HTML estático: landings + formulario)
                 │  POST /api/inscripciones (JSON ~2 KB)
                 ▼
         Route Handler (Node, Fluid Compute)
           sameOrigin → tamaño → honeypot + tiempo mínimo → Turnstile → rate limit (60/15 min/IP)
           → zod (mismo esquema que el cliente) → normaliza → ¿país abierto? → alertas
           → insertOne (índice único; radicado con reintento) ── 11000 → "ya estás inscrito"
                 ▼
            MongoDB Atlas (cliente singleton)
                 ▲
Admin ──► /admin/* (dinámico, sesión) ── agregaciones $facet → KPIs, gráficas, tabla paginada, exportación
```

- **Concurrencia:** el visitante solo descarga estáticos del CDN; en el servidor hay **un** `insertOne` por inscripción, sin lecturas previas (el índice único evita carreras).
- **Route Handler** (no Server Action): contrato JSON explícito, `409`/`429` claros y fácil de probar. La página del formulario sigue siendo 100 % estática.
- **Panel al día:** páginas `force-dynamic` + refresco cada 30 s con la pestaña visible. Sin caché que invalidar.
- **Abrir/cerrar sin redeploy:** `CONVOCATORIA_CONFIG` define el estado por país; **la API lo vuelve a leer en cada envío**, así una convocatoria cerrada rechaza inscripciones aunque el HTML esté en caché.
- **Slugs:** código interno `col | pan | ecu | uy`; segmento de URL `col | panama | ecu | uy` (mapeo en un único archivo).

### Estructura de carpetas
```
src/
  app/                                   # solo enrutamiento
    layout.tsx  globals.css  proxy.ts?   # proxy solo si hace falta
    page.tsx                             # selector de país (indexable)
    col/ panama/ ecu/ uy/page.tsx        # landings (indexables)
    inscripcion/[pais]/page.tsx          # formulario (estático, noindex)
    admin/login · (panel)/ page, inscritos, inscritos/[id], usuarios   # noindex
    api/ inscripciones · auth/* · admin/{inscritos,estadisticas,exportar,usuarios}
  modules/
    convocatoria/   components/  content/{contenido,acciones}.ts
    inscripcion/    components/  config/{preguntas,textos,catalogo,legal/*}.ts
                    schema.ts  service.ts  repository.ts  alertas.ts  radicado.ts  actions.ts
    notificaciones/ tipos.ts (interfaz Notificador)  null.ts      # listo para agregar correo
    auth/           session  password  permisos  service  repository  components
    panel/          components  service  repository (agregaciones)  export.ts  schema.ts
  shared/
    config/ env.ts (validación de variables con zod)  paises.ts (slugs y mapeos)
    db/mongo.ts  http/ (leerCuerpo, sameOrigin, responder, clientIp)
    security/ (rateLimit, honeypot, turnstile)
    validation/ (nombres, documento, correo, telefono, textos)  ui/
scripts/ crear-admin.ts  semilla-demo.ts
tests/
```
**Regla:** un módulo solo importa de `shared/` y de sí mismo, y es dueño de sus colecciones (prefijo propio). Agregar un módulo = `src/modules/<nuevo>/` + rutas + su registro de índices. Una prueba estática lo vigila.

---

## 3. Modelo de datos (MongoDB)

**`insc_inscripciones`**
```ts
{
  _id, radicado: "JC27-COL-8F3K2Q",          // único
  convocatoria: "jc-2027",
  pais: "col"|"pan"|"ecu"|"uy",
  sede: string,                              // clave de sede (auto si hay una sola)
  ciudad: string, ciudadOtra?: string,       // residencia; "otra" + texto libre
  nombres, apellidos, nombreCompleto,
  tipoDocumento, documento,                  // documento normalizado
  fechaNacimiento, edadAlInscribirse, genero,
  correo, correoNorm, celular(E.164), celularNacional, tieneWhatsapp,
  situacion: "estudiando"|"graduado", grado?, anioGrado?, institucion, tipoInstitucion,
  tieneComputador, tieneInternet, disponibilidad8h, comoSeEntero, motivacion,
  acudiente?: { nombre, parentesco, celular, autoriza },
  aceptaDatos: true, versionAutorizacion, aceptadoEn,
  alertas: [{ codigo: "sin_computador"|"sin_internet"|"sin_tiempo"|"edad_fuera_rango"|
                     "grado_fuera_rango"|"correo_repetido", motivo: string }],
  creadoEn, origen: { utm_* }, ipHash, userAgent(200)
}
```
Índices: único `{ convocatoria, pais, tipoDocumento, documento }` · único `{ radicado }` · `{ convocatoria, pais, sede, ciudad, creadoEn:-1 }` · `{ convocatoria, creadoEn:-1 }` · `{ correoNorm }` · `{ convocatoria, "alertas.codigo" }`.

**`auth_usuarios`** `{ usuario(único), nombre, rol: admin|coordinador|lector, paises[], activo, passwordHash, tokenVersion, creadoEn, ultimoIngreso }`
**`rateLimits`** (TTL) · **`auth_auditoria`** `{ usuario, accion, en, detalle }` (quién exportó datos personales).

---

## 4. Formulario (7 pasos, barra de progreso, validación por paso y en el servidor)

Ruta `/inscripcion/<segmento>` (país fijo, viene de su landing). Borrador en `sessionStorage`, que **se borra al confirmar**. Todo el texto y las opciones salen de `src/modules/inscripcion/config/`.

| Paso | Preguntas (número en el formulario oficial) |
|---|---|
| **1. Dónde vivís** | Sede (automática si es única) → ciudad de residencia (lista de la sede + "Otra") · Dirección (P10) |
| **2. Datos personales** | Nombres · Apellidos · Tipo de identificación · Número · Fecha de nacimiento · Correo · WhatsApp · Número alterno (P2–P8, P11) |
| **3. Acudiente** *(solo menores de 18)* | Nombres · Apellidos · Correo · Teléfono · Relación (P12–P16) |
| **4. Estudios y disponibilidad** | Grado · Año de egreso (si ya es bachiller) · Promedio · Institución · Internet · Computadora · Aprendizaje en línea · Horas semanales (P17–P24) |
| **5. Sobre vos** | Ocupación (varias) · Emprendimiento · Otras postulaciones · Aplicó antes a JC · Fue seleccionado (P25–P27, P34–P35) |
| **6. Datos sociodemográficos** | Género · Poblaciones (varias) · Ingresos del hogar · Talla (P28–P30, P32) |
| **7. Cierre** | Cómo se enteró · Embajador (P31, P33) · Autorización de datos (P36) · Resumen y envío |

Confirmación en pantalla con nombre, país, sede y **radicado**; sin correo (estructura `Notificador` lista).

**Protección:** honeypot + tiempo mínimo · Turnstile (obligatorio en producción) · rate limit 60/15 min/IP · botón bloqueado + clave de idempotencia por intento · índice único · un duplicado responde sin revelar datos.

---

## 5. Panel de administración
- **Login** (`/admin/login`), bcrypt, cookie firmada, límite de intentos. Primer admin con `npm run admin:crear`. Roles `admin` / `coordinador` (por país) / `lector`; alcance aplicado en el servidor.
- **Tablero:** KPIs (total, hoy, 7 días, % menores, % con alertas) · inscripciones por día (línea + acumulado) · por país · **por sede** · por ciudad · mapa de calor día × hora · edad · género · grado/situación educativa · **horas disponibles** · **acceso a computadora e internet** · **ocupación** · **poblaciones** · **ingresos** · **talla** · **canal de difusión** y UTM · **ranking de embajadores** · embudo de requisitos. Filtros: país, sede, ciudad, fechas. Los datos sensibles (F14) solo se muestran agregados a quien no es admin.
- **Inscritos:** tabla paginada en el servidor, búsqueda (nombre, documento, correo, radicado), filtros (país, sede, ciudad, fechas, menor de edad, **alerta**), orden, filtros en la URL.
- **Detalle**, **exportación** Excel/CSV con los filtros activos (hoja de datos + hoja resumen, **celdas sanitizadas**, auditoría), **usuarios** (solo admin).

---

## 6. Fases

| Fase | Entrega | Verificación |
|---|---|---|
| **0. Base** | Next 16 + TS estricto + ESLint + Vitest; `shared/` (env, db, http, seguridad, validaciones) con pruebas; encabezados de seguridad; `.env.example` | tsc + pruebas + build |
| **1. Landings** | Módulo `convocatoria` del zip, logo, `next/font` Outfit, rutas `/`, `/col`, `/panama`, `/ecu`, `/uy`, redirecciones `/conv_*`, indexación | build (rutas `○`), revisión visual a 390 px y escritorio |
| **2. Inscripción** | Config, catálogo, esquemas, formulario, API, repositorio, alertas, radicado, confirmación | pruebas (válido, por paso, duplicado concurrente, cerrado, origen, honeypot, límite, Turnstile, alertas) + envío real en el navegador |
| **3. Autenticación** | Usuarios, login/logout, permisos, `admin:crear` | pruebas de login, bloqueo, revocación, alcance |
| **4. Panel** | Tablero, tabla, detalle, exportación, semilla de demo | pruebas de agregaciones y exportación (incluye sanitización); revisión con miles de registros falsos |
| **5. Producción** | README (instalación, Atlas misma región que Vercel y ≥ M10, Vercel, dominio propio/DNS, Turnstile), prueba de carga contra un **preview de Vercel** con una base de pruebas en Atlas, robots/sitemap | checklist de despliegue |
