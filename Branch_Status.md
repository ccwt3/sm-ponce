# Branch Status - Auditoria de arquitectura

Fecha de auditoria inicial: 13 de junio de 2026
Actualizacion documental: 22 de junio de 2026

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

## Actualizacion del 22 de junio de 2026

Se comparo `README.md`, `Branch_Status.md` y `Branch_changes.md` contra la
codebase actual. La arquitectura base sigue vigente, pero la documentacion no
reflejaba completamente los cambios recientes de busqueda, paginacion, cache
cliente, rutas de autenticacion y seed administrativo.

### Hallazgos nuevos contra la documentacion

| Area | Estado real en codigo | Diferencia encontrada |
| --- | --- | --- |
| Productos | `app/page.tsx` entrega un `ProductPage` inicial con `page`, `pageSize` y `hasNextPage`. | La documentacion hablaba de carga/listado como si fuera solo una lista inicial. |
| Paginacion | `ProductPagination` permite anterior/siguiente; `PRODUCT_PAGE_SIZE` es 50. | `README.md` aun decia que no habia paginacion visible. |
| Busqueda | `useInventory` aplica debounce de 450 ms, aborta requests obsoletos y llama `GET /api/products?q=...&page=...`. | `README.md` describia la busqueda como local sobre productos cargados. |
| Cache cliente | `products.client-cache.ts` mantiene cache LRU de 5 paginas normales y 10 paginas de busqueda. | No estaba documentado. |
| Busqueda local | La UI muestra coincidencias locales de paginas cacheadas mientras llega la busqueda remota. | Faltaba explicar que es fallback, no la fuente principal. |
| Tipos de producto | `POST /api/product-types` valida con Zod, hace `trim` y reutiliza coincidencias exactas. | La auditoria anterior trataba la validacion de tipos como pendiente en varios pasajes historicos. |
| Rutas auth | Existen `/auth/error` y `/auth/sign-up-success`; no existen `/protected` ni `/instruments`. | `Branch_changes.md` conserva historia donde `/protected` aparece como preservada. |
| Seed | `pnpm seed:products` ejecuta `scripts/seed-products.ts`, crea 300 productos y borra datos previos por defecto. | README solo mencionaba el seed como excepcion aislada; faltaban variables y comportamiento. |
| Git/script | `scripts/seed-products.ts` esta trackeado aunque `.gitignore` contiene `/scripts`. | `Branch_Status.md` decia que `scripts/` aparecia sin seguimiento. |

### Arquitectura actual agregada

#### Listado paginado y busqueda de productos

```txt
InventoryDashboardClient
  -> useInventory
    -> lib/products.search.ts para normalizar/debounce/limites
    -> lib/products.client-cache.ts para cache LRU y fallback local
    -> lib/api.ts:getProducts({ page, search, signal })
      -> GET /api/products?page=N&q=texto
        -> parseProductPage + parseProductSearch
        -> lib/products.service.ts:getProductsForDashboard
          -> database/items.ts:getProductsPage
            -> Supabase producto + tipo
```

Evaluacion: correcto.

La busqueda server-side usa `ilike` en `nombre`, `modelo` y `medida`, y busca
ids de tipos con `ilike` sobre `tipo.tipo_de_producto`. La paginacion obtiene
una fila extra para calcular `hasNextPage` y devuelve solo 50 productos.

#### Seed administrativo actual

```txt
pnpm seed:products
  -> scripts/seed-products.ts
    -> dotenv .env.local
    -> @supabase/supabase-js con SUPABASE_SERVICE_ROLE_KEY
      -> borra productos/tipos previos del SEED_USER_ID
      -> crea 15 tipos y 300 productos
```

Evaluacion: apropiado como herramienta administrativa, riesgoso si se ejecuta
sin revisar `.env.local` porque `DELETE_PREVIOUS_DATA` esta en `true`.

### Deuda tecnica actualizada

1. No hay pruebas automatizadas para servicios, route handlers, hooks,
   paginacion, busqueda ni flujos de autorizacion.
2. No hay migraciones, esquema generado, indices ni politicas RLS versionadas;
   no se puede auditar rendimiento de busqueda ni reglas de unicidad desde el
   repositorio.
3. `tipo_id` sigue teniendo doble significado: UUID real en base de datos y
   nombre visible en el modelo normalizado de UI.
4. Falta `lib/product-types.service.ts`; validacion, deduplicacion y
   autorizacion de tipos viven en Route Handlers.
5. La eliminacion de tipos sigue saliendo desde `TypeDropdownMenu.tsx` hacia
   `lib/api.ts`, fuera de `useProductTypes`.
6. El backend de tipos reutiliza coincidencias exactas, pero no garantiza
   deduplicacion case-insensitive ni carrera segura sin una restriccion unica
   en Supabase.
7. La paginacion no tiene conteo total, salto a ultima pagina ni selector de
   tamano de pagina; solo anterior/siguiente y `hasNextPage`.
8. La busqueda no tiene ranking, prioridad por campo ni documentacion de
   indices.
9. `NavbarMenu` conserva una accion temporal de Configuracion con
   `console.log`.
10. Los enlaces del footer (`Soporte`, `Privacidad`, `Contacto`) siguen con
    `href="#"`.
11. El proxy conserva `/login` como ruta publica/guest-only heredada, aunque
    no existe una pagina `app/login`.
12. Siguen existiendo componentes heredados sin consumidor directo en las rutas
    actuales: `components/auth-button.tsx`, `components/logout-button.tsx`,
    `components/env-var-warning.tsx` y `components/theme-switcher.tsx`.
13. Las dependencias de Radix mezclan paquetes especificos `@radix-ui/*` con el
    paquete monolitico `radix-ui`.
14. `eslint-config-next` esta fijado en 15.3.1 mientras el lockfile resuelve
    Next.js 16.2.4.

## Estado tecnico verificado

| Verificacion | Resultado |
| --- | --- |
| `npm run lint` | Correcto, sin errores. |
| `npm run build` | Correcto, compila Next.js y TypeScript. |
| TypeScript estricto | Activado. |
| Pruebas automatizadas | No existen. |
| Migraciones y RLS versionadas | No existen en el repositorio. |
| Estado Git durante auditoria | Rama `hand-made`; sin cambios reportados antes de editar documentacion; `scripts/seed-products.ts` esta trackeado. |

El build verificado usa Next.js 16.2.4 y genera correctamente las paginas,
Route Handlers y proxy.

Nota: en la actualizacion del 22 de junio se hizo comparacion estatica de
codigo y documentacion. No se reejecutaron lint/build antes de editar estos
documentos.

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

El hook usa este flujo cuando no recibe productos iniciales, cuando navega
paginas, cuando ejecuta busqueda remota o cuando se solicita `refetch`.

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
o `database`, y su clave nunca debe exponerse al navegador. El comando actual
es `pnpm seed:products`; requiere `SUPABASE_SERVICE_ROLE_KEY` y `SEED_USER_ID`
en `.env.local`.

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
- El listado ya soporta paginacion visible de 50 productos por pagina.
- La busqueda combina consulta server-side, debounce, cancelacion de requests
  obsoletos y fallback local sobre paginas cacheadas.
- El proxy y los servicios aplican proteccion complementaria.
- Los clientes Supabase estan separados para navegador, servidor y proxy.
- Lint, TypeScript y build pasaron en la verificacion previa documentada.

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
6. No hay pruebas ni fixtures para la paginacion, busqueda con `q`, cache
   cliente o cancelacion de requests obsoletos.
7. La deduplicacion de tipos depende de comparaciones exactas y de la UI; falta
   una restriccion unica/versionada para cubrir requests directos o carreras.

### Prioridad baja

1. Cada operacion de producto puede crear un cliente Supabase para validar al
   usuario y otro para consultar datos. Funciona, pero podria centralizarse un
   contexto por solicitud si el volumen lo exige.
2. Los formularios Auth llaman al SDK desde cada componente. Es aceptable,
   aunque un adaptador comun facilitaria mensajes y pruebas uniformes.
3. `database/*` funciona como repositorio de datos; renombrarlo no es necesario,
   pero documentar esa responsabilidad evita confundirlo con migraciones o
   esquema.
4. La paginacion no expone conteo total ni salto a ultima pagina.
5. Persisten rutas/configuraciones heredadas o temporales: `/login` en proxy,
   enlaces `#` del footer, `console.log` de Configuracion y componentes auth
   sin consumidor actual.
6. La estrategia de Radix y `eslint-config-next` deberia revisarse para alinear
   dependencias con Next.js 16.

## Prioridades recomendadas

1. Crear `lib/product-types.service.ts` y hacer que ambos endpoints de tipos lo
   utilicen.
2. Encapsular eliminacion de tipos dentro de `useProductTypes`.
3. Separar `tipo_id` y `tipo_nombre` en los contratos de dominio/UI.
4. Agregar pruebas unitarias para servicios y validaciones, y pruebas de
   integracion para Route Handlers autorizados/no autorizados.
5. Agregar pruebas de paginacion, busqueda remota, fallback local y cache.
6. Versionar migraciones, indices, unicidad de tipos y politicas RLS de
   Supabase.
7. Mantener el seed aislado, documentar su ejecucion y proteger la service role.
8. Limpiar restos heredados de UI/proxy y alinear dependencias.

## Conclusion

El estado arquitectonico general es bueno para un MVP. El flujo de productos
puede tomarse como referencia para nuevas funcionalidades de dominio. No se
debe forzar una cadena unica sobre toda la aplicacion: las excepciones de
Server Components y Supabase Auth son correctas.

La mejora mas valiosa es alinear tipos de producto con la capa de servicio ya
usada por productos. Despues, la mayor deuda no es de estructura de carpetas,
sino de contratos de dominio, pruebas y configuracion de Supabase versionada.

## Auditoria de seguridad e integridad de datos

Fecha de auditoria: 22 de junio de 2026

Alcance: revision estatica del codigo actual usando `README.md` como mapa,
mas el schema y las policies de Supabase compartidas para `producto` y `tipo`.
El foco fue seguridad basica de cuentas, separacion entre usuarios, resistencia
a inputs maliciosos, anti-inyeccion y proteccion de integridad de datos.

### Veredicto corto

La aplicacion esta razonablemente protegida contra el riesgo mas grave:
un usuario autenticado leyendo, editando o eliminando datos de otro usuario.
La defensa existe en dos capas: codigo server-side que filtra por `user_id` y
RLS de Supabase con `auth.uid() = user_id`.

No la consideraria lista para produccion con datos reales de clientes todavia.
La razon principal no es una falla obvia de aislamiento entre usuarios, sino
que varias reglas de integridad viven solo en la aplicacion y no estan
versionadas ni reforzadas por la base de datos. Un usuario autenticado podria
saltarse la UI y llamar directamente a Supabase con la publishable key para
crear sus propios registros con datos invalidos, aunque no deberia poder tocar
datos de otros usuarios.

### Score actual

| Area | Score | Evaluacion |
| --- | ---: | --- |
| Separacion entre usuarios | 8/10 | Buena si RLS esta activa como en las capturas. Codigo y policies filtran por propietario. |
| Proteccion basica de cuentas | 6/10 | Supabase Auth cubre lo principal, pero falta cerrar redirect abierto y documentar configuracion de Auth. |
| Anti-inyeccion y XSS basico | 7/10 | No hay SQL raw ni HTML raw; hay un filtro PostgREST armado como string que necesita pruebas de payloads raros. |
| Integridad de datos | 5/10 | Validacion server-side buena, pero faltan constraints, indices, unicidad y migraciones versionadas. |
| Manejo de errores de datos | 6/10 | Errores se ocultan al cliente, pero faltan respuestas 400/409 para constraints esperadas. |
| Preparacion para produccion | 6/10 | Apta para beta privada controlada; no lista para produccion con datos importantes de clientes. |

### Contexto de base de datos auditado

Schema compartido:

```sql
CREATE TABLE public.producto (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nombre text NOT NULL,
  modelo text,
  medida text,
  tipo_id integer,
  existencia smallint NOT NULL,
  precio_proveedor numeric NOT NULL,
  precio_publico numeric NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT producto_pkey PRIMARY KEY (id),
  CONSTRAINT producto_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT producto_tipo_id_fkey FOREIGN KEY (tipo_id) REFERENCES public.tipo(id)
);

CREATE TABLE public.tipo (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  tipo_de_producto text NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT tipo_pkey PRIMARY KEY (id),
  CONSTRAINT tipo_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

Policies mostradas:

- `producto`: INSERT con `WITH CHECK (auth.uid() = user_id)`.
- `producto`: SELECT, UPDATE y DELETE con `USING (auth.uid() = user_id)`.
- `tipo`: mismas policies para crear, ver, editar y eliminar tipos.
- RLS esta activo en ambas tablas segun las capturas.
- Las policies estan aplicadas a `public`. Como `auth.uid()` es `null` para
  anonimos, en la practica no deberian dar acceso anonimo, pero para claridad
  conviene apuntarlas al rol `authenticated`.

### Fortalezas verificadas

1. El cliente no consulta `producto` ni `tipo` directamente desde la UI; el
   CRUD normal pasa por Route Handlers y Supabase server client.
2. `getCurrentUserId()` obtiene el usuario real desde Supabase Auth en servidor.
3. Al crear productos, el servidor asigna `user_id`; no confia en el cliente.
4. Las consultas, updates y deletes de productos usan `.eq("user_id", userId)`.
5. Las consultas, creacion y deletes de tipos usan `.eq("user_id", userId)` o
   insertan el `user_id` del servidor.
6. Las policies RLS refuerzan la separacion por usuario si alguien intenta
   saltarse la app y llamar Supabase directamente.
7. `producto.tipo_id` tiene foreign key hacia `tipo(id)`, asi que la base evita
   referencias a tipos inexistentes.
8. La eliminacion de tipos usados por productos queda protegida por la foreign
   key por defecto. La app muestra error si Supabase rechaza el delete.
9. Zod valida create/update de productos en servidor: strings requeridos,
   trim, numeros finitos, precios no negativos y existencia entera no negativa.
10. Zod valida la creacion de tipos: texto, trim y no vacio.
11. No se encontraron usos de `dangerouslySetInnerHTML`, `innerHTML`, `eval` ni
    HTML crudo. React escapa los nombres de productos y tipos al renderizar.
12. La busqueda usa query builder/PostgREST de Supabase, no SQL manual.
13. Los errores internos de Supabase no se devuelven completos en endpoints de
    inventario; el cliente recibe mensajes genericos o errores controlados.
14. `.env.local` y `.env` estan ignorados por Git, lo que reduce el riesgo de
    filtrar `SUPABASE_SERVICE_ROLE_KEY`.

### Riesgos bloqueantes para produccion

1. No hay migraciones versionadas de schema, constraints, indices ni policies
   RLS. El repo no puede reproducir ni auditar la seguridad real de Supabase.
2. Las reglas de negocio no estan duplicadas en la base de datos. Un usuario
   autenticado podria llamar Supabase directamente y crear sus propios datos
   invalidos: existencias negativas, precios negativos, textos enormes o tipos
   duplicados, si la base no lo impide.
3. No hay constraints `CHECK` para `existencia >= 0`,
   `precio_proveedor >= 0`, `precio_publico >= 0` ni limites de longitud de
   texto.
4. No hay unicidad para tipos por usuario. La app reutiliza coincidencias
   exactas, pero dos requests simultaneos o una llamada directa pueden crear
   duplicados como `Aceites`, `aceites` o valores con diferencias invisibles.
5. `app/auth/confirm/route.ts` usa `redirect(next)` con un `next` recibido por
   query string. A diferencia del proxy y login form, no sanitiza la ruta. Es
   un riesgo de open redirect en flujos de confirmacion.
6. Los parametros `id` de endpoints dinamicos se aceptan como string sin
   validar que sean enteros positivos, aunque la base usa `bigint`. Inputs como
   texto arbitrario pueden terminar como errores de infraestructura en vez de
   `400`.
7. Los tipos TypeScript no coinciden con el schema real: `ProductRow.id`,
   `ProductRow.tipo_id` y `ProductType.id` son `string`, pero Supabase usa
   `bigint`/`integer`. Esto no siempre rompe en runtime, pero oculta errores y
   debilita contratos.
8. `ProductWriteInput` hereda `user_id` como opcional aunque la base lo exige.
   El servicio lo agrega correctamente, pero el tipo no expresa el contrato de
   persistencia con precision.
9. `tipo_id` conserva doble significado: id real en BD y nombre visible en UI.
   Esto aumenta el riesgo de updates incorrectos y hace mas dificil testear
   integridad.
10. No hay tests automatizados que prueben intentos cross-user, inserts
    invalidos, duplicados, constraints ni errores de FK.

### Riesgos importantes pero no bloqueantes

1. Las policies estan aplicadas a `public`. Con `auth.uid() = user_id`, anonimo
   no deberia pasar, pero `authenticated` seria mas explicito y menos
   sorprendente.
2. Las policies de UPDATE vistas en capturas muestran `USING`, pero no muestran
   `WITH CHECK` explicito. Conviene agregarlo aunque Postgres pueda reutilizar
   `USING` como check en algunos casos; hacerlo explicito evita ambiguedad.
3. No hay rate limiting propio en endpoints de inventario ni formularios de
   Auth. Se depende de Supabase/Vercel/plataforma para abuso basico.
4. No hay proteccion CSRF/origin explicita en endpoints mutantes. El riesgo es
   bajo con JSON/fetch same-origin y cookies modernas, pero para produccion
   conviene validar `Origin`/`Host` en POST, PUT y DELETE.
5. `errorResponse` convierte errores de constraint o FK en `500` generico. Es
   seguro, pero no ideal: errores esperados como tipo en uso, duplicado o input
   invalido deberian mapearse a `400` o `409`.
6. `POST /api/product-types` no tiene longitud maxima. Un usuario podria crear
   tipos enormes que afecten UI y almacenamiento.
7. `modelo`, `medida` y `nombre` tampoco tienen maximos ni en Zod ni en BD.
8. La busqueda remota arma una cadena `.or(...)` de PostgREST. No es SQL raw y
   el valor se entrecomilla, pero faltan pruebas con comas, parentesis,
   comillas, backslashes y operadores PostgREST.
9. El seed usa service role y `DELETE_PREVIOUS_DATA = true`. Es correcto como
   herramienta local, pero peligroso si se ejecuta con variables de produccion.
10. El error de auth se muestra desde query string en `/auth/error`. React lo
    escapa, asi que no es XSS directo, pero puede exponer mensajes internos de
    Supabase al usuario.

### Recomendaciones minimas antes de produccion

1. Versionar migraciones de Supabase en el repo, incluyendo schema, indices,
   constraints y policies.
2. Agregar constraints de integridad en base de datos:

```sql
ALTER TABLE public.producto
  ADD CONSTRAINT producto_existencia_nonnegative CHECK (existencia >= 0),
  ADD CONSTRAINT producto_precio_proveedor_nonnegative CHECK (precio_proveedor >= 0),
  ADD CONSTRAINT producto_precio_publico_nonnegative CHECK (precio_publico >= 0),
  ADD CONSTRAINT producto_nombre_not_blank CHECK (length(btrim(nombre)) > 0),
  ADD CONSTRAINT producto_nombre_max_length CHECK (length(nombre) <= 160),
  ADD CONSTRAINT producto_modelo_max_length CHECK (modelo IS NULL OR length(modelo) <= 120),
  ADD CONSTRAINT producto_medida_max_length CHECK (medida IS NULL OR length(medida) <= 80);

ALTER TABLE public.tipo
  ADD CONSTRAINT tipo_nombre_not_blank CHECK (length(btrim(tipo_de_producto)) > 0),
  ADD CONSTRAINT tipo_nombre_max_length CHECK (length(tipo_de_producto) <= 80);
```

3. Agregar unicidad por usuario para tipos normalizados. Idealmente usar un
   indice funcional:

```sql
CREATE UNIQUE INDEX tipo_user_tipo_normalized_unique
  ON public.tipo (user_id, lower(btrim(tipo_de_producto)));
```

4. Definir si productos tambien deben evitar duplicados. Si si, crear una
   unicidad por usuario y campos normalizados, por ejemplo nombre + modelo +
   medida + tipo.
5. Hacer explicitas las policies RLS por rol `authenticated` y agregar
   `WITH CHECK (auth.uid() = user_id)` en INSERT y UPDATE para ambas tablas.
6. Mantener los filtros por `user_id` en codigo aunque exista RLS. Esa doble
   defensa es correcta.
7. Sanitizar `next` en `app/auth/confirm/route.ts` usando la misma regla segura
   del proxy: debe iniciar con `/`, no con `//`, y no apuntar a rutas guest-only.
8. Validar `params.id` con Zod o helper comun como entero positivo antes de
   llamar Supabase. Responder `400` si no es valido.
9. Alinear tipos TypeScript con la BD o crear tipos separados:
   `ProductRowDb` con `id: number`, `tipo_id: number | null`, y `Product` de UI
   con `tipo_nombre`.
10. Separar definitivamente `tipo_id` y `tipo_nombre` en contratos de UI/API.
11. Crear `lib/product-types.service.ts` para centralizar validacion,
    deduplicacion, propietario y errores de tipos.
12. Mapear errores esperados de Supabase:
    duplicado -> `409`, FK en uso -> `409`, id invalido -> `400`,
    no encontrado -> `404`.
13. Agregar tests automatizados para:
    - usuario A no puede leer, editar ni borrar datos de usuario B;
    - usuario A no puede crear datos con `user_id` de B por llamada directa;
    - inputs negativos, strings enormes y ids invalidos fallan;
    - tipos duplicados fallan o se reutilizan;
    - borrar un tipo usado por productos responde de forma controlada;
    - busqueda con caracteres especiales no rompe ni amplia resultados.
14. Endurecer el seed:
    exigir una variable como `CONFIRM_SEED_DELETE=true`, bloquear produccion por
    `NODE_ENV=production`, y nunca usar service role fuera de scripts locales o
    CI controlado.
15. Revisar configuracion de Supabase Auth para produccion:
    confirmacion de email activa, politica minima de contrasena, rate limits,
    dominios de redirect permitidos y, si el producto lo requiere, MFA.

### Estado de produccion recomendado

No listo para produccion con informacion real de clientes.

Estado aceptable hoy: beta privada o entorno interno con usuarios de confianza,
RLS activo y backups.

Condicion minima para pasar a produccion: versionar Supabase, agregar
constraints/indices/policies explicitas, cerrar el open redirect de
`/auth/confirm`, validar ids, alinear tipos con el schema y cubrir con pruebas
los casos cross-user e inputs invalidos.
