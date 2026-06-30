# Plan de cambios antes de produccion

Fecha: 22 de junio de 2026

Origen: seccion "Auditoria de seguridad e integridad de datos" de
`Branch_Status.md`, apartado "Recomendaciones minimas antes de produccion".

## Alcance

Este plan se enfoca solo en los puntos que siguen pendientes despues de las
decisiones indicadas:

- No incluir punto 1: migraciones ya versionadas en `supabase/migrations`.
- No incluir punto 2: constraints de integridad ya aplicadas en consola.
- No incluir punto 3: unicidad por usuario para tipos ya aplicada en consola.
- No incluir puntos 4 y 5.
- No incluir punto 6: los filtros por `user_id` ya existen en codigo.
- No incluir punto 10: `tipo_id` se queda como esta por ahora.
- No incluir punto 13: pruebas automatizadas quedan para despues.

## Objetivo

Dejar la aplicacion mas lista para produccion cerrando riesgos de seguridad,
contratos de API y operacion administrativa que todavia viven en codigo:

1. Cerrar el redirect abierto en confirmacion de Auth.
2. Validar ids dinamicos antes de llamar Supabase.
3. Alinear tipos TypeScript con el schema real sin cambiar el contrato visible
   `tipo_id` de la UI.
4. Crear una capa de servicio para tipos de producto.
5. Mapear errores esperados de Supabase a respuestas HTTP controladas.
6. Endurecer el seed para evitar borrados accidentales.
7. Revisar la configuracion de Supabase Auth para produccion.

## Fase 1: Redirect seguro en confirmacion de Auth

Recomendacion base: punto 7.

Archivos:

- `app/auth/confirm/route.ts`
- `lib/supabase/proxy.ts`

Cambios:

- Extraer o reutilizar una funcion comun para sanitizar rutas `next`.
- Aceptar solo rutas internas que empiecen con `/`.
- Rechazar valores que empiecen con `//`.
- Evitar redireccionar a rutas guest-only como `/auth/login`,
  `/auth/sign-up`, `/auth/forgot-password`, `/auth/sign-up-success` y `/login`.
- Usar `/` como fallback seguro.
- Aplicar esa regla en `app/auth/confirm/route.ts` antes de llamar
  `redirect(...)`.

Criterio de aceptacion:

- `/auth/confirm?...&next=/` redirige a `/`.
- `/auth/confirm?...&next=/ruta-interna` redirige a la ruta interna.
- `/auth/confirm?...&next=https://dominio-externo.com` redirige a `/`.
- `/auth/confirm?...&next=//dominio-externo.com` redirige a `/`.
- `/auth/confirm?...&next=/auth/login` redirige a `/`.

## Fase 2: Validacion centralizada de ids dinamicos

Recomendacion base: punto 8.

Archivos:

- `app/api/products/[id]/route.ts`
- `app/api/product-types/[id]/route.ts`
- nuevo helper sugerido: `lib/validation/ids.ts`

Cambios:

- Crear un helper para validar ids de tablas Supabase como entero positivo.
- Usar el helper en `GET`, `PUT` y `DELETE` de productos.
- Usar el helper en `DELETE` de tipos.
- Responder `400` cuando el id no sea valido.
- Evitar que strings arbitrarios lleguen a `.eq("id", id)` y terminen como
  errores genericos de infraestructura.

Criterio de aceptacion:

- `/api/products/abc` responde `400`.
- `/api/products/-1` responde `400`.
- `/api/products/0` responde `400`.
- `/api/product-types/abc` responde `400`.
- Un id numerico positivo sigue llegando a la capa de servicio/base de datos.

## Fase 3: Alinear tipos TypeScript con la base de datos

Recomendacion base: punto 9.

Archivos:

- `types/index.ts`
- `database/items.ts`
- `database/productTypes.ts`
- `lib/products.service.ts`

Cambios:

- Separar tipos de fila de base de datos y tipos de UI sin cambiar el contrato
  visible actual de `Product.tipo_id`.
- Ajustar `ProductRow` o crear `ProductRowDb` para reflejar el schema real:
  `id: number`, `tipo_id: number | null`.
- Ajustar `ProductType.id` a `number` si representa una fila real de
  `public.tipo`.
- Mantener `Product.id` como string solo si la UI/API lo necesita serializado,
  o convertir consistentemente los ids al normalizar.
- Hacer que `ProductWriteInput` represente lo que realmente se persiste:
  `user_id` obligatorio y `tipo_id` numerico/null.
- Evitar que los tipos de payload cliente hereden `user_id`.

Criterio de aceptacion:

- Los repositorios `database/*` trabajan con tipos que coinciden con Supabase.
- Los servicios convierten entre tipo DB y tipo UI en un solo lugar.
- El formulario cliente no puede tipar accidentalmente un `user_id` como parte
  del payload normal de creacion/edicion.
- `npm.cmd run lint` y `npm.cmd run build` pasan.

Nota: esta fase no separa `tipo_id` y `tipo_nombre` en el modelo visible. Ese
punto queda fuera por decision actual.

## Fase 4: Servicio de dominio para tipos de producto

Recomendacion base: punto 11.

Archivos:

- nuevo `lib/product-types.service.ts`
- `app/api/product-types/route.ts`
- `app/api/product-types/[id]/route.ts`
- `database/productTypes.ts`

Cambios:

- Crear `ProductTypesServiceError` o reutilizar un error HTTP comun.
- Mover a `lib/product-types.service.ts` las reglas de:
  - obtener usuario autenticado;
  - listar tipos;
  - validar payload de creacion;
  - trim y normalizacion;
  - buscar/reutilizar tipo existente;
  - crear tipo;
  - eliminar tipo del usuario actual;
  - devolver `404` cuando no exista.
- Dejar los Route Handlers como traductores HTTP: parsean request, llaman al
  servicio y devuelven JSON.
- Mantener `database/productTypes.ts` solo como acceso a Supabase.

Criterio de aceptacion:

- `app/api/product-types/route.ts` ya no contiene reglas de negocio de tipos.
- `app/api/product-types/[id]/route.ts` ya no obtiene usuario ni llama directo
  al repositorio.
- La logica de tipos queda reutilizable desde otros puntos server-side.
- `npm.cmd run lint` y `npm.cmd run build` pasan.

## Fase 5: Errores esperados de Supabase como 400/409/404

Recomendacion base: punto 12.

Archivos:

- `lib/api-errors.ts`
- `lib/products.service.ts`
- `lib/product-types.service.ts`
- `database/items.ts`
- `database/productTypes.ts`

Cambios:

- Identificar codigos esperados de Postgres/Supabase:
  - duplicado por constraint unica -> `409`;
  - foreign key en uso o violada -> `409`;
  - id invalido -> `400`;
  - registro no encontrado -> `404`.
- Convertir esos errores a errores de dominio antes de llegar al cliente.
- Mantener mensajes internos de Supabase fuera de la respuesta publica.
- Dar mensajes accionables y consistentes en espanol.

Criterio de aceptacion:

- Crear un tipo duplicado responde `409` o reutiliza el existente de forma
  consistente, segun la decision del servicio.
- Borrar un tipo usado por productos responde `409` con mensaje controlado si
  la base lo impide.
- Id invalido responde `400`.
- Producto/tipo inexistente responde `404`.
- Errores inesperados siguen respondiendo `500` generico.

## Fase 6: Endurecer el seed administrativo

Recomendacion base: punto 14.

Archivo:

- `scripts/seed-products.ts`

Cambios:

- Reemplazar `DELETE_PREVIOUS_DATA = true` fijo por una variable de entorno.
- Exigir `CONFIRM_SEED_DELETE=true` antes de borrar datos existentes.
- Bloquear ejecucion destructiva cuando `NODE_ENV=production`.
- Mostrar claramente el `SEED_USER_ID` objetivo antes de operar.
- Opcional recomendado: permitir modo no destructivo para agregar datos sin
  borrar.
- Documentar variables requeridas en `README.md` si no estan ya explicadas.

Criterio de aceptacion:

- El seed no borra datos si falta `CONFIRM_SEED_DELETE=true`.
- El seed no borra datos con `NODE_ENV=production`.
- Un seed no destructivo puede ejecutarse sin service role fuera de entornos
  controlados, o queda documentado que service role solo se usa local/CI.
- `npm.cmd run lint` y `npm.cmd run build` pasan.

## Fase 7: Checklist de Supabase Auth para produccion

Recomendacion base: punto 15.

No todo vive en el repositorio, asi que esta fase debe cerrar una checklist
operativa en Supabase:

- Confirmacion de email activa.
- Politica minima de contrasena definida.
- Rate limits revisados para Auth.
- Dominios permitidos de redirect configurados para produccion.
- URLs locales separadas de URLs productivas.
- MFA evaluado segun necesidad del producto.
- Plantillas de correo revisadas para no exponer mensajes internos.

Criterio de aceptacion:

- Queda documentado que valores se configuraron en Supabase.
- Los redirect URLs de produccion no aceptan dominios no controlados.
- El flujo login/registro/confirmacion/recuperacion funciona con el dominio
  productivo.

## Orden recomendado de implementacion

1. Fase 1: redirect seguro.
2. Fase 2: validacion de ids.
3. Fase 4: servicio de tipos.
4. Fase 5: mapeo de errores esperados.
5. Fase 3: alineacion de tipos TypeScript.
6. Fase 6: seed seguro.
7. Fase 7: checklist de Supabase Auth.

## Verificacion por cada fase

Ejecutar al cerrar cada fase de codigo:

```bash
npm.cmd run lint
npm.cmd run build
```

Para cambios en Supabase o Auth:

- confirmar manualmente el flujo afectado en Supabase;
- registrar en este documento que cambio se aplico fuera del repositorio;
- evitar guardar llaves o secretos en archivos versionados.

## Reporte Fase [1]

Resumen corto:

- Se reutilizo el sanitizador de rutas `next` del proxy como funcion comun.
- La confirmacion de Auth ahora valida `next` antes de redirigir.
- El fallback seguro queda en `/` para rutas externas, protocol-relative,
  rutas guest-only o valores malformados.

[Estado: Canario Activo]

## Reporte Fase [2]

Resumen corto:

- Se agrego un helper central para validar ids de tablas Supabase como enteros
  positivos seguros.
- `GET`, `PUT` y `DELETE` de productos ahora rechazan ids invalidos con `400`
  antes de llamar al servicio.
- `DELETE` de tipos de producto ahora rechaza ids invalidos con `400` antes de
  llamar al repositorio.

[Estado: Canario Activo]

## Reporte Fase [3]

Resumen corto:

- Se alinearon los tipos de fila de producto con Supabase usando ids numericos,
  `tipo_id` numerico/null y `user_id` obligatorio para escrituras.
- Se separaron los payloads cliente de productos para conservar `tipo_id`
  visible como nombre y evitar heredar `user_id`.
- El servicio de productos centraliza la conversion DB/UI y resuelve tipos por
  id cuando normaliza respuestas despues de actualizar.

[Estado: Canario Activo]

## Reporte Fase [4]

Resumen corto:

- Se creo `lib/product-types.service.ts` para concentrar autenticacion,
  validacion, normalizacion, reutilizacion, creacion y eliminacion de tipos.
- Los Route Handlers de tipos quedaron como traductores HTTP y ya no obtienen
  usuario ni llaman directamente al repositorio.
- `database/productTypes.ts` quedo enfocado en acceso a Supabase, sin reglas de
  negocio de tipos.

[Estado: Canario Activo]

## Reporte Fase [5]

Resumen corto:

- Se agrego un error HTTP comun y un mapeo central para codigos esperados de
  Supabase/Postgres.
- Los repositorios de productos y tipos convierten duplicados, foreign keys,
  ids invalidos y no encontrados en respuestas controladas.
- Los servicios mantienen `400` y `404` de dominio sin exponer mensajes
  internos de Supabase al cliente.

[Estado: Canario Activo]

## Reporte Fase [6]

Resumen corto:

- Se cambio el seed a modo no destructivo por defecto y el borrado ahora exige
  `SEED_DELETE_PREVIOUS_DATA=true` y `CONFIRM_SEED_DELETE=true`.
- El seed destructivo queda bloqueado cuando `NODE_ENV=production` y muestra el
  `SEED_USER_ID` objetivo antes de operar.
- Se documento en README el uso administrativo local/CI de service role y las
  variables del seed seguro.

[Estado: Canario Activo]

## Checklist operativo Supabase Auth para produccion

Registro de Fase 7:

- No hay dominio productivo versionado en el repositorio, por lo que el valor
  final debe aplicarse en Supabase como `https://<dominio-productivo>`.
- Confirmacion de email: activar en Supabase Auth.
- Site URL productiva: `https://<dominio-productivo>`.
- Redirect URLs productivas permitidas: `https://<dominio-productivo>/` y
  `https://<dominio-productivo>/auth/update-password`.
- Redirect URLs locales: mantener separadas en proyecto local/staging, como
  `http://localhost:3000/` y
  `http://localhost:3000/auth/update-password`.
- No usar comodines amplios ni dominios no controlados en redirect URLs
  productivas.
- Politica minima de contrasena: minimo 12 caracteres, minusculas, mayusculas,
  numeros y simbolos; activar proteccion contra contrasenas filtradas si el
  plan lo permite.
- Rate limits de Auth: revisar en Authentication > Rate Limits y mantenerlos
  al menos en valores por defecto; endurecer email/OTP si aparece abuso.
- MFA: evaluado como no obligatorio por ahora porque la app no incluye UI de
  enrollment/challenge; preferir TOTP cuando se implemente.
- Plantillas de correo: revisar confirmacion y recuperacion para usar solo el
  dominio productivo y no exponer mensajes internos.
- Verificacion manual requerida despues de aplicar la configuracion: registro,
  confirmacion, login, recuperacion y actualizacion de contrasena funcionando
  con el dominio productivo.

## Reporte Fase [7]

Resumen corto:

- Se documento la checklist operativa de Supabase Auth para produccion.
- Se definieron los valores seguros esperados para Site URL, redirects,
  contrasenas, rate limits, MFA y plantillas.
- Se agrego en README la guia de validacion manual de los flujos de Auth.

[Estado: Canario Activo]

---

## Auditoria de documentacion vs codigo

Fecha: 29 de junio de 2026

Rama auditada: `deployment-config`

Alcance: contraste estatico entre README.md, Branch_Status.md y Branch_changes.md
contra la codebase actual. No se ejecutaron lint ni build durante la auditoria;
solo lectura de archivos y estructura del proyecto.

### Hallazgo 1 — Landing page nueva sin documentar (CRITICO)

La ruta `/landing` existe en codigo y no aparece en ningun documento.

Archivos nuevos confirmados:

- `app/landing/page.tsx` — pagina de aterrizaje con metadata SEO.
- `components/landing/urgency-bar.tsx`
- `components/landing/site-header.tsx`
- `components/landing/hero-section.tsx`
- `components/landing/stock-states-section.tsx`
- `components/landing/features-section.tsx`
- `components/landing/feature-card.tsx`
- `components/landing/how-it-works-section.tsx`
- `components/landing/final-cta-section.tsx`
- `components/landing/site-footer.tsx`
- `components/landing/beta-modal.tsx`
- `components/landing/countdown-blocks.tsx`
- `components/landing/inventory-showcase.tsx`
- `components/landing/client-ahh-footer.tsx`
- `components/landing/stock-badge.tsx`
- `lib/landing/constants.ts`
- `lib/landing/countdown.ts`
- `lib/landing/use-countdown.ts`
- `lib/landing/showcase-data.ts`
- `lib/landing/features-data.ts`
- `lib/landing/onboarding-data.ts`

Comportamiento verificado:

- `BETA_DEADLINE_ISO = "2026-07-02T23:59:59-06:00"` (deadline de beta: 2 de
  julio de 2026, 3 dias desde la fecha de esta auditoria).
- `BetaModal` muestra una cuenta regresiva y un CTA que redirige a
  `/auth/login` para registro.
- El proxy (`lib/supabase/proxy.ts`) fue actualizado: `/landing` esta en
  `publicPaths` y en `guestOnlyPaths`.
- Un usuario autenticado que visite `/landing` sera redirigido por el proxy
  (si el middleware esta activo; ver Hallazgo 2).
- La landing no esta en la tabla de rutas del README ni en Branch_Status.md.

Accion requerida: actualizar README.md, Branch_Status.md y la tabla de rutas.

### Hallazgo 2 — `proxy.ts` como proxy de Next.js 16 (CORREGIDO)

Durante la auditoria se identifico `proxy.ts` como un posible problema porque
en Next.js 13-15 el archivo de middleware debe llamarse `middleware.ts` y
exportar `middleware`. Al intentar aplicar la correccion se descubrio que
Next.js 16 cambio la convencion:

- El archivo correcto en Next.js 16 es `proxy.ts` con export `proxy`.
- Al crear `middleware.ts` con export `middleware`, Next.js 16 emitio el
  warning: "The middleware file convention is deprecated. Please use proxy
  instead."
- Con `proxy.ts` restaurado, el build compila sin advertencias y Next.js lista
  el proxy activo como `Proxy (Middleware)` en el output.
- `pnpm build` verificado: sin errores ni warnings.

Conclusion: `proxy.ts` estaba correctamente configurado para Next.js 16.
El hallazgo original de la auditoria era incorrecto. No se requiere accion.

### Hallazgo 3 — Dependencias sin version fija

`package.json` usa `"latest"` para tres dependencias criticas:

- `"next": "latest"`
- `"@supabase/ssr": "latest"`
- `"@supabase/supabase-js": "latest"`

Un deploy nuevo puede instalar una version con breaking changes sin aviso.
El lockfile congela las versiones en la maquina actual, pero en CI o un
entorno limpio la instalacion depende de lo que `latest` resuelva en ese
momento.

Accion recomendada: fijar las versiones a las que estan actualmente
resueltas en `pnpm-lock.yaml` para que los builds sean reproducibles.

### Hallazgo 4 — Deudas documentadas confirmadas pendientes

Las siguientes deudas listadas en Branch_Status.md siguen sin resolver:

| Deuda | Ubicacion real | Estado |
| --- | --- | --- |
| Eliminacion de tipos fuera de `useProductTypes` | `TypeDropdownMenu.tsx` llama `deleteProductType` y luego `refetch()` directamente | Pendiente |
| `console.log` en Configuracion | `components/layout/NavbarMenu.tsx:43` | Pendiente |
| Footer links sin destino funcional | `components/layout/Footer.tsx`, tres `href="#"` | Pendiente |
| Componentes heredados sin consumidor | `auth-button.tsx`, `logout-button.tsx`, `env-var-warning.tsx`, `theme-switcher.tsx` | Pendiente |
| Ruta `/login` en proxy sin pagina real | `lib/supabase/proxy.ts:6` | Pendiente |
| No hay pruebas automatizadas | Todo el proyecto | Pendiente |
| `eslint-config-next` en 15.3.1 vs Next.js 16 real | `package.json` | Pendiente |

### Hallazgo 5 — Estado correcto de fases 1–7

Las implementaciones de las siete fases del plan de produccion fueron
verificadas contra el codigo actual y coinciden con lo reportado:

- `lib/supabase/proxy.ts` contiene `getSafeRedirectPath`. (Fase 1)
- `lib/validation/ids.ts` existe y es usado por Route Handlers y servicios. (Fase 2)
- `types/index.ts` tiene `ProductRow.id: number`, `ProductRow.tipo_id: number | null`
  y `ProductUpdateWriteInput` sin `user_id`. (Fase 3)
- `lib/product-types.service.ts` existe; Route Handlers de tipos delegan en el. (Fase 4)
- `lib/api-errors.ts` mapea `23505`, `23503`, `22P02` y `PGRST116`. (Fase 5)
- `scripts/seed-products.ts` requiere `SEED_DELETE_PREVIOUS_DATA` y
  `CONFIRM_SEED_DELETE` antes de borrar datos. (Fase 6)
- Checklist de Auth para produccion documentada en Branch_changes.md y README. (Fase 7)

### Resumen ejecutivo de la auditoria

| Hallazgo | Severidad | Accion |
| --- | --- | --- |
| Landing page `/landing` sin documentar | Alta | Actualizar README y Branch_Status.md |
| `proxy.ts` inactivo como middleware de Next.js | Alta | Renombrar a `middleware.ts`, renombrar export a `middleware` |
| Dependencias con `latest` sin version fija | Media | Fijar versiones en package.json |
| Deudas pendientes de Branch_Status.md | Baja-Media | Ver tabla Hallazgo 4 |
| Fases 1–7 correctas | — | Sin accion |

Finalizado omar

---

## Auditoría medium-depth — 29 de junio de 2026

Rama: `deployment-config`

Alcance: seguridad, conexiones entre módulos, arquitectura general y casos
especiales de render, calidad del código, modularidad-legibilidad,
sincronización de documentación y código basura. Profundidad media sobre el
núcleo del inventario. No se ejecutaron lint ni build durante la auditoría.

Archivos leídos: proxy.ts, lib/supabase/proxy.ts, lib/supabase/server.ts,
lib/api.ts, lib/api-errors.ts, lib/products.service.ts,
lib/product-types.service.ts, lib/products.server.ts, lib/products.search.ts,
lib/products.pagination.ts, lib/products.client-cache.ts,
lib/contentNormalizer.ts, lib/server-utils.ts, lib/utils.ts,
lib/validation/ids.ts, lib/validation/products.ts, lib/validation/productTypes.ts,
database/items.ts, database/productTypes.ts, app/page.tsx,
app/api/products/route.ts, app/api/products/[id]/route.ts,
app/api/product-types/route.ts, app/api/product-types/[id]/route.ts,
app/auth/confirm/route.ts, hooks/useInventory.ts, hooks/useProductTypes.ts,
components/inventory/InventoryDashboardClient.tsx,
components/inventory/TypeDropdownMenu.tsx, components/layout/NavbarMenu.tsx,
components/layout/Footer.tsx, components/ui/StockBadge.tsx,
components/landing/stock-badge.tsx, types/index.ts, package.json.

### 1. Seguridad

Sin hallazgos nuevos críticos. Las capas de protección están en orden:

- `proxy.ts` y `lib/supabase/proxy.ts` interceptan toda solicitud y refrescan
  tokens vía `getClaims()`. Este método extrae claims del JWT sin round-trip a
  Supabase, correcto y eficiente para el proxy. Contrasta deliberadamente con
  `getUser()` en `requireCurrentUser()`, que sí hace la llamada real y valida
  la sesión en cada operación de dominio.
- Todos los servicios y repositorios filtran por `user_id` obtenido del servidor.
- `validateSupabaseTableId` rechaza ids no enteros positivos antes de llegar a
  Supabase.
- Validación Zod en todos los endpoints mutantes de productos y tipos.
- `getSafeRedirectPath` aplicada tanto en el proxy como en `/auth/confirm`.

Observación: `app/api/product-types/route.ts` y `[id]/route.ts` tienen
`console.error` propios además de los que ya tiene `database/productTypes.ts`.
Cada error del repositorio de tipos se loggea dos veces en el servidor. No es
un riesgo de seguridad; sí es ruido en logs de producción.

### 2. Arquitectura y conexiones entre módulos

Los flujos documentados en Branch_Status.md coinciden con el código real.
No se encontraron violaciones de capas en el núcleo del inventario.

**Caso especial de render inicial documentado y correcto:**

`app/page.tsx` usa un Server Component interno (`InventoryDashboardServer`)
envuelto en `<Suspense>`. El Server Component llama `getProductsForDashboard()`
directamente sin HTTP. Si falla con `AuthRequiredError`, redirige a
`/auth/login`. Si falla por otro motivo, pasa `initialError` al cliente.
`useInventory` detecta si hay `initialPage` para evitar un fetch redundante al
montar. Este diseño es correcto y robusto.

**`lib/products.server.ts` es un re-export trivial:**

```ts
export { getProductsForDashboard } from "@/lib/products.service";
```

Una sola línea sin lógica propia. No importa `server-only`; los guards ya
están en `lib/products.service.ts` y `lib/api-errors.ts`. Existe como punto
de importación estable para Server Components, lo cual tiene valor
arquitectónico, pero la documentación lo trata como si fuera un módulo con
más peso del que tiene.

**`TypeDropdownMenu.tsx` exporta `TypeCombobox`:**

El nombre del archivo y el nombre del export son distintos. La deuda
documentada (delete fuera de `useProductTypes`) sigue presente: `confirmDeleteType`
llama `deleteProductType(typeToDelete.id)` de `lib/api` directamente y luego
llama `refetch()`.

### 3. Calidad del código

**`lib/contentNormalizer.ts` — nombre engañoso:**

El archivo define configuración estática (`productFormFields` y
`productTableColumns`), no normaliza contenido en tiempo de ejecución. El
nombre implica una función transformadora que altera datos; en realidad solo
define estructuras de configuración de la UI. Candidato a renombrarse como
`lib/product-ui-config.ts` o `lib/inventory-schema.ts`. No está documentado
en ninguno de los tres archivos.

**`validateSupabaseTableId` devuelve `id: string`:**

En `lib/validation/ids.ts`, el tipo de retorno exitoso es
`{ success: true; id: string }` a pesar de haber validado que el valor es un
entero positivo. Todos los callers inmediatamente hacen `Number(idValidation.id)`.
Sería más directo y correcto devolver `id: number`.

**`ProductSelectRow.tipo` con union de array:**

En `database/items.ts`, `tipo` está tipado como
`object | object[] | null`. `productFromSelect` normaliza con
`Array.isArray(row.tipo) ? row.tipo[0] ?? null : row.tipo`. La relación es
muchos productos a un tipo; el array no debería materializarse en runtime, pero
el tipo refleja cómo Supabase puede retornar joins. Funcionalmente correcto; un
comentario aclararía la intención.

**Doble validación de ID en productos:**

El Route Handler `app/api/products/[id]/route.ts` valida el id con
`validateSupabaseTableId` y el servicio `lib/products.service.ts` también lo
valida internamente con `parseProductId`. Un id inválido es rechazado dos veces.
Funcional pero redundante; en el flujo real nunca llega al servicio con un id
inválido porque el Route Handler ya lo rechaza.

### 4. Modularidad y legibilidad

La estructura de capas es clara y consistente. Hooks bien delimitados, servicios
con responsabilidad única, validación encapsulada en `lib/validation/`. Los
módulos de `lib/` tienen nombres descriptivos con dos excepciones ya mencionadas.

**Dos componentes `StockBadge` con mismo nombre:**

- `components/ui/StockBadge.tsx` — inventario. Recibe `existencia: number`
  y computa el estado internamente.
- `components/landing/stock-badge.tsx` — showcase de landing. Recibe
  `level: StockLevel` y `value: number` ya calculados.

Los propósitos son distintos y la coexistencia es razonable dado que están en
namespaces diferentes (`ui/` vs `landing/`). El nombre idéntico puede generar
confusión al buscar o importar si los paths no están completos en el editor.

**`components/inventory/styles.ts` no documentado:**

Existe un archivo de estilos compartidos para componentes de inventario. Es un
detalle de implementación que no requiere mención en docs de alto nivel, pero
conviene conocerlo como patrón de la codebase.

### 5. Código basura y deudas confirmadas al 29 de junio

| Elemento | Archivo | Estado |
| --- | --- | --- |
| `console.log("-> ir a configuracion")` | `NavbarMenu.tsx:42` | Pendiente |
| Footer `href="#"` (Soporte, Privacidad, Contacto) | `Footer.tsx` | Pendiente |
| `auth-button.tsx` sin consumidor activo | `components/auth-button.tsx` | Pendiente |
| `logout-button.tsx` sin consumidor activo | `components/logout-button.tsx` | Pendiente |
| `env-var-warning.tsx` sin consumidor activo | `components/env-var-warning.tsx` | Pendiente |
| `theme-switcher.tsx` sin consumidor activo | `components/theme-switcher.tsx` | Pendiente |
| `/login` en proxy sin página real | `lib/supabase/proxy.ts:6,12` | Pendiente |
| Eliminación de tipos fuera de `useProductTypes` | `TypeDropdownMenu.tsx:112` | Pendiente |
| `eslint-config-next` 15.3.1 vs Next.js 16 real | `package.json` | Pendiente |
| Dependencias `latest` sin version fija | `package.json` | Pendiente |

**Nuevas deudas identificadas en esta auditoría:**

- `next-themes@0.4.6` en `dependencies` sin consumidor activo. El único
  consumidor esperado es `theme-switcher.tsx`, que es un componente heredado
  sin uso. La dependencia debería removerse junto con el componente.
- `tsx` no declarado en `devDependencies` pero invocado directamente en el
  script `seed:products`. Si no está instalado globalmente, `pnpm seed:products`
  falla con "tsx: command not found". Agregar `tsx` a `devDependencies` o
  documentar el requisito de instalación global.
- `package-lock.json` coexiste con `pnpm-lock.yaml` en el root. Es
  probablemente un residuo de npm previo al cambio a pnpm. Puede confundir
  herramientas que detectan el gestor de paquetes por la presencia del lock file.
- `lib/contentNormalizer.ts` nombre engañoso (ver sección 3).
- `TypeDropdownMenu.tsx` exporta `TypeCombobox` — inconsistencia nombre de
  archivo vs export.
- Doble `console.error` en Route Handlers de tipos (ver sección 1).

### 6. Sincronización con documentación

Los tres documentos reflejan el estado del núcleo del inventario con fidelidad
después de las actualizaciones previas del 29 de junio. Los nuevos hallazgos
de esta auditoría son detalles de implementación que no estaban en el radar.
Se actualizó Branch_Status.md para incluir las nuevas deudas identificadas.

Finalizado omar

---

## Aceptación de términos y condiciones — 30 de junio de 2026

Rama: `pre-marketing`

Se implementó el flujo completo de aceptación de términos (versión `2026-06-29`,
coincide con la fecha de `public/terms.html` y `public/privacy.html`).

### Archivos nuevos

- `lib/terms.ts` — constantes compartidas (cliente y servidor):
  `CURRENT_TERMS_VERSION`, rutas a los HTML legales y claves de `user_metadata`.
- `lib/request-ip.ts` — `getClientIp()` para obtener la IP de los headers de
  deploy (primer valor de `x-forwarded-for`, o `x-real-ip`).
- `database/termsAcceptance.ts` — acceso a datos de `terms_acceptance`
  (`hasAccepted`, `recordAcceptance` idempotente ante duplicados `23505`).
- `lib/terms.service.ts` — servicio server-only: `hasAcceptedCurrentTerms`,
  `requireAcceptedTerms` (lanza `TermsRequiredError` 403), `acceptCurrentTerms`
  y `recordAcceptanceAfterConfirmation` (best-effort tras confirmar email).
- `app/api/terms/accept/route.ts` — `POST` que registra la aceptación vigente.
- `components/terms/TermsAcceptanceGate.tsx` — popup no-descartable que llama al
  endpoint y recarga.

### Archivos modificados

- `components/sign-up-form.tsx` — checkbox obligatorio con enlaces a los HTML;
  pasa `options.data` (intención de aceptación) a `signUp`.
- `app/auth/confirm/route.ts` — tras `verifyOtp`, registra la aceptación si el
  usuario marcó el checkbox al registrarse.
- `lib/products.service.ts` y `lib/product-types.service.ts` — reemplazan
  `getCurrentUserId()` por `requireAcceptedTerms()`. Este es el choke point que
  hace el gate no-bypasseable: todo el dominio (SSR y API) pasa por aquí.
- `app/home/page.tsx` — si el dominio lanza `TermsRequiredError`, renderiza el
  popup en lugar del inventario.
- `lib/supabase/proxy.ts` — `/terms.html` y `/privacy.html` agregados a
  `publicPaths` para que los invitados puedan abrirlos durante el registro.

### Resistencia a bypass

- Sin aceptación, todo endpoint de dominio responde `403` (frente a `curl`).
- Con gate sin aceptación, `/home` no renderiza el inventario, solo el popup.
- La versión se fija siempre en el servidor; el cliente no la elige.
- El RLS asegura que cada usuario solo inserte su propia aceptación.

### Pendiente operativo (Supabase)

El esquema asume modelo append-only `unique (user_id, terms_version)` y `anon`
sin grants. El SQL para ejecutar manualmente en la consola de Supabase se
entregó en la sesión (no se generó migración por indicación de Omar).

[Listo omar]
