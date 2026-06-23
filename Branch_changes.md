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
