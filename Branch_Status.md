# Branch Status - Auditoria de arquitectura

Fecha de auditoria: 13 de junio de 2026

## Resumen ejecutivo

La aplicacion tiene un MVP funcional de inventario y una arquitectura por capas
mayormente saludable. El CRUD de productos iniciado desde el navegador es el
flujo mejor estructurado: separa UI, estado cliente, cliente HTTP, frontera API,
servicio de dominio, acceso a datos y Supabase.

La aplicacion completa no sigue, ni deberia seguir, una unica cadena rigida:

```txt
componente -> hook -> lib/api -> /api -> database -> Supabase
```

Esa cadena aplica a interacciones de dominio iniciadas en componentes cliente,
pero no a Server Components, Route Handlers, proxy, autenticacion ni scripts.
En esos casos saltar hooks o `/api` es correcto.

La discrepancia arquitectonica principal esta en tipos de producto: sus Route
Handlers acceden directamente a `database/productTypes.ts`, sin una capa de
servicio, y la eliminacion se ejecuta desde el componente fuera del hook
`useProductTypes`.

## Estado tecnico verificado

| Verificacion | Resultado |
| --- | --- |
| `npm run lint` | Correcto, sin errores. |
| `npm run build` | Correcto, compila Next.js y TypeScript. |
| TypeScript estricto | Activado. |
| Pruebas automatizadas | No existen. |
| Migraciones y RLS versionadas | No existen en el repositorio. |
| Estado Git durante auditoria | Rama `hand-made`; `scripts/` aparece sin seguimiento. |

El build verificado usa Next.js 16.2.4 y genera correctamente las paginas,
Route Handlers y proxy.

## Arquitectura objetivo

La arquitectura recomendable no es una sola tuberia, sino un conjunto de
flujos segun el punto de entrada.

### Interaccion cliente de dominio

```txt
Componente cliente
  -> hook o controlador cliente
    -> lib/api.ts
      -> app/api/*
        -> servicio de dominio
          -> database/*
            -> lib/supabase/server.ts
              -> Supabase PostgreSQL + RLS
```

Este flujo mantiene credenciales, autorizacion, validacion y consultas fuera
del navegador.

### Renderizado y carga desde servidor

```txt
Server Component
  -> modulo server-only o servicio
    -> database/*
      -> lib/supabase/server.ts
        -> Supabase PostgreSQL + RLS
```

No se recomienda que un Server Component haga `fetch` a `/api` dentro de la
misma aplicacion. La llamada directa al servicio evita HTTP innecesario y
conserva la separacion de responsabilidades.

### Autenticacion

```txt
Componente o hook cliente -> lib/supabase/client.ts -> Supabase Auth
Server Component o Route Handler -> lib/supabase/server.ts -> Supabase Auth
proxy.ts -> lib/supabase/proxy.ts -> Supabase Auth
```

Supabase Auth no usa las tablas de dominio mediante `database/*`; sus clientes
oficiales son la capa de integracion.

## Flujos reales auditados

### 1. Carga inicial de productos

```txt
app/page.tsx
  -> lib/products.server.ts
    -> lib/products.service.ts
      -> lib/server-utils.ts para obtener el usuario
      -> database/items.ts
        -> lib/supabase/server.ts
          -> tabla producto + relacion tipo + RLS
```

Evaluacion: correcto.

No usa hook, `lib/api.ts` ni `/api` porque empieza en un Server Component. Esta
es una excepcion necesaria, no una violacion.

### 2. Listar productos desde el navegador

```txt
InventoryDashboardClient
  -> useInventory
    -> lib/api.ts:getProducts
      -> GET /api/products
        -> lib/products.service.ts:getProductsForDashboard
          -> database/items.ts
            -> Supabase
```

Evaluacion: correcto y consistente con la arquitectura objetivo.

El hook solo usa este flujo cuando no recibe productos iniciales o cuando se
solicita `refetch`.

### 3. Crear, editar y eliminar productos

```txt
InventoryDashboardClient/ProductModal
  -> useInventory
    -> lib/api.ts
      -> POST/PUT/DELETE /api/products/*
        -> lib/products.service.ts
          -> validacion Zod
          -> usuario autenticado y asignacion/filtro por user_id
          -> resolucion del tipo
          -> database/items.ts
            -> Supabase
```

Evaluacion: correcto y es el flujo de referencia del proyecto.

Las reglas relevantes estan en el servicio: validacion, autorizacion,
normalizacion del tipo y errores 404. El borrado de UI es optimista y se
revierte si la operacion falla.

### 4. Listar y crear tipos de producto

```txt
TypeDropdownMenu
  -> useProductTypes
    -> lib/api.ts
      -> GET/POST /api/product-types
        -> validacion y autorizacion dentro del Route Handler
        -> database/productTypes.ts
          -> Supabase
```

Evaluacion: funcional, pero parcialmente inconsistente.

Falta una capa `lib/product-types.service.ts`. Como consecuencia, el Route
Handler contiene reglas de negocio como validacion, deteccion de duplicados y
asignacion de propietario. Esas reglas no pueden reutilizarse facilmente desde
otro punto de entrada server-side y quedan acopladas a Next.js.

Recomendacion: crear un servicio de tipos que concentre listar, crear y eliminar
tipos; dejar los Route Handlers limitados a traducir HTTP.

### 5. Eliminar tipos de producto

```txt
TypeDropdownMenu
  -> lib/api.ts:deleteProductType
    -> DELETE /api/product-types/[id]
      -> database/productTypes.ts
        -> Supabase
```

Evaluacion: funcional, con dos discrepancias.

- La accion no pasa por `useProductTypes`, aunque ese hook ya administra la
  coleccion, errores, creacion y `refetch`.
- El Route Handler no pasa por un servicio de dominio.

Recomendacion: mover `deleteProductType` y la actualizacion de estado al hook,
y hacer que el endpoint delegue en el servicio de tipos.

### 6. Autenticacion cliente

```txt
LoginForm/SignUpForm/ForgotPasswordForm/UpdatePasswordForm
  -> lib/supabase/client.ts
    -> Supabase Auth
```

Evaluacion: correcto.

No necesita `lib/api.ts`, `/api`, servicio de dominio ni `database/*`.
Agregar un hook por formulario no aportaria valor por si solo. Un adaptador
`lib/auth.client.ts` podria ser util en el futuro para unificar traduccion de
errores, telemetria o pruebas, pero no es una correccion obligatoria.

### 7. Cierre de sesion

```txt
LogoutButton/NavbarMenu
  -> useLogout
    -> lib/supabase/client.ts
      -> Supabase Auth
```

Evaluacion: correcto. El hook es util porque la misma accion se reutiliza en
dos componentes y tambien centraliza redireccion y refresco.

### 8. Autenticacion y proteccion server-side

Flujos auditados:

```txt
proxy.ts -> lib/supabase/proxy.ts -> Supabase Auth
app/auth/confirm/route.ts -> lib/supabase/server.ts -> Supabase Auth
app/protected/page.tsx -> lib/supabase/server.ts -> Supabase Auth
components/auth-button.tsx -> lib/supabase/server.ts -> Supabase Auth
lib/server-utils.ts -> lib/supabase/server.ts -> Supabase Auth
```

Evaluacion: correcto.

Estos puntos de entrada son server-side y no deben usar hooks cliente. El proxy
renueva sesion, protege rutas y responde `401` para endpoints anonimos. Los
servicios vuelven a validar al usuario y no dependen exclusivamente del proxy.

### 9. Script de seed

```txt
scripts/seed-products.ts
  -> @supabase/supabase-js con SUPABASE_SERVICE_ROLE_KEY
    -> Supabase directamente
```

Evaluacion: apropiado solo como herramienta administrativa aislada.

La service role evita RLS intencionalmente. El script no pertenece al runtime
de la aplicacion, no debe importarse desde `app`, `components`, `hooks`, `lib`
o `database`, y su clave nunca debe exponerse al navegador.

## Cumplimiento por capa

| Area | Hook cuando aplica | Cliente HTTP/API cuando aplica | Servicio de dominio | Acceso a datos aislado | Evaluacion |
| --- | --- | --- | --- | --- | --- |
| Productos, carga server | No aplica | No aplica | Si | Si | Correcto |
| Productos, CRUD cliente | Si | Si | Si | Si | Correcto |
| Tipos, listar/crear | Si | Si | No | Si | Mejorable |
| Tipos, eliminar | No, aunque conviene | Si | No | Si | Mejorable |
| Auth cliente | Opcional | No aplica | No aplica | No aplica | Correcto |
| Auth server/proxy | No aplica | No aplica | No aplica | No aplica | Correcto |
| Seed administrativo | No aplica | No aplica | No aplica | Acceso directo intencional | Fuera del runtime |

## Respuesta a las preguntas arquitectonicas

### Se sigue `componente -> hook -> lib/api -> /api -> database -> Supabase`?

Solo en parte. El CRUD cliente de productos sigue una version mas completa que
incluye `lib/products.service.ts` entre `/api` y `database`.

La carga inicial server-side, Auth, proxy y scripts no siguen esa cadena porque
sus puntos de entrada y responsabilidades son distintos.

### Toda la aplicacion deberia seguirla al pie de la letra?

No. Forzar hooks en Server Components o hacer que el servidor llame a su propio
`/api` agregaria complejidad y costo sin mejorar la separacion.

Lo importante es conservar estas fronteras:

- Los componentes cliente de dominio no consultan tablas Supabase directamente.
- Las reglas de dominio viven en servicios, no en componentes ni Route
  Handlers.
- Las consultas de dominio viven en `database/*`.
- Las operaciones server-side validan usuario y propietario.
- Supabase Auth usa los clientes apropiados para cliente, servidor y proxy.

### Si server/client no necesita hook, esta bien no usarlo?

Si. Un hook es una herramienta de React cliente para estado, efectos y
reutilizacion. No es una capa universal.

- Server Components, Route Handlers y proxy no usan hooks cliente.
- Un componente cliente sencillo puede llamar a un adaptador directamente si
  no administra estado complejo ni comparte comportamiento.
- Cuando ya existe un hook que representa el dominio cliente, como
  `useProductTypes`, conviene mantener dentro de el todas las operaciones
  relacionadas, incluida la eliminacion.

## Fortalezas actuales

- El navegador no accede directamente a las tablas `producto` o `tipo`.
- El CRUD de productos tiene una capa de servicio clara.
- Las entradas de productos se validan con Zod en servidor.
- `user_id` se obtiene de la sesion y se usa en consultas y mutaciones.
- La carga inicial server-side evita una llamada HTTP interna.
- El proxy y los servicios aplican proteccion complementaria.
- Los clientes Supabase estan separados para navegador, servidor y proxy.
- Lint, TypeScript y build pasan.

## Riesgos y deuda arquitectonica

### Prioridad media

1. Falta `lib/product-types.service.ts`; reglas de tipos viven en Route
   Handlers.
2. La eliminacion de tipos queda fuera de `useProductTypes`.
3. `tipo_id` significa id en base de datos, pero nombre visible en el modelo
   que consume la UI. Esto debilita contratos y aumenta el riesgo de errores.
4. No hay pruebas automatizadas para servicios, Route Handlers, hooks o flujos
   de autorizacion.
5. No hay migraciones, esquema generado ni politicas RLS versionadas. La
   configuracion real de Supabase no puede verificarse desde el repositorio.

### Prioridad baja

1. Cada operacion de producto puede crear un cliente Supabase para validar al
   usuario y otro para consultar datos. Funciona, pero podria centralizarse un
   contexto por solicitud si el volumen lo exige.
2. Los formularios Auth llaman al SDK desde cada componente. Es aceptable,
   aunque un adaptador comun facilitaria mensajes y pruebas uniformes.
3. `database/*` funciona como repositorio de datos; renombrarlo no es necesario,
   pero documentar esa responsabilidad evita confundirlo con migraciones o
   esquema.

## Prioridades recomendadas

1. Crear `lib/product-types.service.ts` y hacer que ambos endpoints de tipos lo
   utilicen.
2. Encapsular eliminacion de tipos dentro de `useProductTypes`.
3. Separar `tipo_id` y `tipo_nombre` en los contratos de dominio/UI.
4. Agregar pruebas unitarias para servicios y validaciones, y pruebas de
   integracion para Route Handlers autorizados/no autorizados.
5. Versionar migraciones y politicas RLS de Supabase.
6. Mantener el seed aislado, documentar su ejecucion y proteger la service role.

## Conclusion

El estado arquitectonico general es bueno para un MVP. El flujo de productos
puede tomarse como referencia para nuevas funcionalidades de dominio. No se
debe forzar una cadena unica sobre toda la aplicacion: las excepciones de
Server Components y Supabase Auth son correctas.

La mejora mas valiosa es alinear tipos de producto con la capa de servicio ya
usada por productos. Despues, la mayor deuda no es de estructura de carpetas,
sino de contratos de dominio, pruebas y configuracion de Supabase versionada.
