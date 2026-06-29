# Branch Status - Auditoria de arquitectura

Fecha de auditoria inicial: 13 de junio de 2026
Actualizacion documental: 29 de junio de 2026

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

La discrepancia arquitectonica principal que queda esta en tipos de producto:
la eliminacion se ejecuta desde el componente fuera del hook `useProductTypes`.
Los Route Handlers de tipos ya delegan en `lib/product-types.service.ts`.

Auditoria del 29 de junio: se confirmo que `proxy.ts` es la convencion
correcta de Next.js 16 (reemplaza a `middleware.ts`). El proxy esta activo
y funciona. El hallazgo inicial de la auditoria sobre este punto era incorrecto
y fue corregido despues de verificar con `pnpm build`.

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
      -> por defecto conserva datos previos del SEED_USER_ID
      -> crea 15 tipos y 300 productos
```

Evaluacion: apropiado como herramienta administrativa. El modo destructivo
requiere `SEED_DELETE_PREVIOUS_DATA=true` y `CONFIRM_SEED_DELETE=true`, y queda
bloqueado con `NODE_ENV=production`.

### Deuda tecnica actualizada

1. No hay pruebas automatizadas para servicios, route handlers, hooks,
   paginacion, busqueda ni flujos de autorizacion.
2. Existen migraciones versionadas con schema, RLS, constraints, indices y
   foreign keys; aun no hay indices especificos para busqueda `ilike`.
3. `tipo_id` sigue teniendo doble significado: id numerico real en base de
   datos y nombre visible en el modelo normalizado de UI.
4. La eliminacion de tipos sigue saliendo desde `TypeDropdownMenu.tsx` hacia
   `lib/api.ts`, fuera de `useProductTypes`.
5. El backend de tipos reutiliza coincidencias exactas antes de insertar; la
   base garantiza unicidad case-insensitive, pero carreras o llamadas directas
   pueden responder `409` en vez de reutilizar silenciosamente.
6. La paginacion no tiene conteo total, salto a ultima pagina ni selector de
   tamano de pagina; solo anterior/siguiente y `hasNextPage`.
7. La busqueda no tiene ranking, prioridad por campo ni indices especificos.
8. `NavbarMenu` conserva una accion temporal de Configuracion con
   `console.log`.
9. Los enlaces del footer (`Soporte`, `Privacidad`, `Contacto`) siguen con
    `href="#"`.
10. El proxy conserva `/login` como ruta publica/guest-only heredada, aunque
    no existe una pagina `app/login`.
11. Siguen existiendo componentes heredados sin consumidor directo en las rutas
    actuales: `components/auth-button.tsx`, `components/logout-button.tsx`,
    `components/env-var-warning.tsx` y `components/theme-switcher.tsx`.
12. Las dependencias de Radix mezclan paquetes especificos `@radix-ui/*` con el
    paquete monolitico `radix-ui`.
13. `eslint-config-next` esta fijado en 15.3.1 mientras el lockfile resuelve
    Next.js 16.2.4.
14. `next-themes@0.4.6` esta en `dependencies` sin consumidor activo en el
    runtime. Su unico consumidor esperado es `theme-switcher.tsx`, que es
    un componente heredado sin uso. La dependencia deberia removerse junto
    con el componente.
15. `tsx` no esta declarado en `devDependencies` pero el script
    `seed:products` lo invoca directamente. Si no esta instalado
    globalmente, `pnpm seed:products` falla. Agregar `tsx` a
    `devDependencies` o documentar el requisito de instalacion global.
16. `package-lock.json` coexiste con `pnpm-lock.yaml` en el root.
    Probablemente es un residuo de npm previo al cambio a pnpm. Puede
    confundir herramientas que detectan el gestor de paquetes.
17. `lib/contentNormalizer.ts` tiene un nombre enganoso: define configuracion
    estatica de campos del formulario y columnas de la tabla de productos,
    no normaliza contenido. Candidato a renombrarse como
    `lib/product-ui-config.ts` o `lib/inventory-schema.ts`.
18. `TypeDropdownMenu.tsx` exporta `TypeCombobox`. El nombre del archivo y el
    nombre del export son distintos. Conviene alinear uno de los dos.
19. `validateSupabaseTableId` en `lib/validation/ids.ts` devuelve
    `id: string` en el caso exitoso, pero todos los callers hacen
    `Number(idValidation.id)` inmediatamente. Seria mas directo devolver
    `id: number`.
20. Los Route Handlers de tipos (`app/api/product-types/route.ts` y
    `[id]/route.ts`) tienen `console.error` propios ademas de los que ya
    tiene `database/productTypes.ts`. Cada error del repositorio de tipos
    se loggea dos veces en el servidor.

## Estado tecnico verificado

| Verificacion | Resultado |
| --- | --- |
| `npm run lint` | Correcto, sin errores. |
| `npm run build` | Correcto, compila Next.js y TypeScript. |
| TypeScript estricto | Activado. |
| Pruebas automatizadas | No existen. |
| Migraciones y RLS versionadas | Existen en `supabase/migrations`; incluyen constraints, RLS, grants y FK compuesta producto/tipo. |
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
        -> lib/product-types.service.ts
          -> validacion Zod
          -> usuario autenticado y asignacion/filtro por user_id
          -> reutilizacion de tipos existentes
          -> database/productTypes.ts
            -> Supabase
```

Evaluacion: correcto.

Los Route Handlers de tipos quedaron como traductores HTTP. Las reglas de
dominio viven en `lib/product-types.service.ts` y el acceso a datos queda en
`database/productTypes.ts`.

### 5. Eliminar tipos de producto

```txt
TypeDropdownMenu
  -> lib/api.ts:deleteProductType
    -> DELETE /api/product-types/[id]
      -> lib/product-types.service.ts
        -> validacion de id y usuario autenticado
        -> database/productTypes.ts
          -> Supabase
```

Evaluacion: funcional, con una discrepancia.

- La accion no pasa por `useProductTypes`, aunque ese hook ya administra la
  coleccion, errores, creacion y `refetch`.

Recomendacion: mover `deleteProductType` y la actualizacion de estado al hook.

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
| Tipos, listar/crear | Si | Si | Si | Si | Correcto |
| Tipos, eliminar | No, aunque conviene | Si | Si | Si | Mejorable |
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
- Los tipos de producto ya tienen una capa de servicio clara.
- Las entradas de productos se validan con Zod en servidor.
- `user_id` se obtiene de la sesion y se usa en consultas y mutaciones.
- La carga inicial server-side evita una llamada HTTP interna.
- El listado ya soporta paginacion visible de 50 productos por pagina.
- La busqueda combina consulta server-side, debounce, cancelacion de requests
  obsoletos y fallback local sobre paginas cacheadas.
- El proxy y los servicios aplican proteccion complementaria.
- Las migraciones versionan constraints, unicidad, RLS, grants y una FK
  compuesta que evita asociar productos con tipos de otro usuario.
- Los clientes Supabase estan separados para navegador, servidor y proxy.
- Lint, TypeScript y build pasaron en la verificacion previa documentada.

## Riesgos y deuda arquitectonica

### Prioridad media

1. La eliminacion de tipos queda fuera de `useProductTypes`.
2. `tipo_id` significa id en base de datos, pero nombre visible en el modelo
   que consume la UI. Esto debilita contratos y aumenta el riesgo de errores.
3. No hay pruebas automatizadas para servicios, Route Handlers, hooks o flujos
   de autorizacion.
4. No hay pruebas ni fixtures para la paginacion, busqueda con `q`, cache
   cliente o cancelacion de requests obsoletos.
5. La deduplicacion de tipos reutiliza coincidencias exactas en el servicio; la
   base cubre duplicados case-insensitive, pero en carreras puede responder
   `409` en vez de reutilizar el tipo existente.
6. Las policies de tipos siguen definidas `to public` en la migracion base,
   aunque los grants de `anon` ya fueron revocados. Conviene hacerlas explicitas
   para `authenticated` y agregar `WITH CHECK` a UPDATE.
7. Hay dos indices unicos normalizados equivalentes para tipos; conviene
   consolidar uno.

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

1. Encapsular eliminacion de tipos dentro de `useProductTypes`.
2. Separar `tipo_id` y `tipo_nombre` en los contratos de dominio/UI.
3. Agregar pruebas unitarias para servicios y validaciones, y pruebas de
   integracion para Route Handlers autorizados/no autorizados.
4. Agregar pruebas de paginacion, busqueda remota, fallback local y cache.
5. Hacer explicitas las policies de tipos para `authenticated` y agregar
   `WITH CHECK` a UPDATE.
6. Consolidar indices normalizados redundantes y confirmar la regla de unicidad
   de productos por nombre.
7. Mantener el seed aislado, documentar su ejecucion y proteger la service role.
8. Limpiar restos heredados de UI/proxy y alinear dependencias.

## Conclusion

El estado arquitectonico general es bueno para un MVP. El flujo de productos
puede tomarse como referencia para nuevas funcionalidades de dominio. No se
debe forzar una cadena unica sobre toda la aplicacion: las excepciones de
Server Components y Supabase Auth son correctas.

La mayor deuda ya no es de estructura de carpetas. Ahora esta en contratos de
dominio, pruebas automatizadas, algunos detalles de RLS/indices versionados y
limpieza de comportamiento/documentacion para la eliminacion de tipos.

## Auditoria de seguridad e integridad de datos

Fecha de auditoria: 22 de junio de 2026

Nota del 25 de junio de 2026: esta seccion se conserva como registro historico
de la auditoria inicial. Varias observaciones ya fueron corregidas por cambios
posteriores en codigo y migraciones. Para el estado vigente, usar la seccion
`Reauditoria de seguridad e integridad de datos`.

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

### Estado de produccion recomendado al 22 de junio

No listo para produccion con informacion real de clientes en la fecha de esta
auditoria inicial.

Estado aceptable hoy: beta privada o entorno interno con usuarios de confianza,
RLS activo y backups.

Condicion minima definida entonces: versionar Supabase, agregar
constraints/indices/policies explicitas, cerrar el open redirect de
`/auth/confirm`, validar ids, alinear tipos con el schema y cubrir con pruebas
los casos cross-user e inputs invalidos. La mayoria de esos puntos ya fueron
cerrados o reclasificados en la reauditoria vigente.

## Reauditoria de seguridad e integridad de datos

Fecha de auditoria: 25 de junio de 2026

Alcance: comparacion estatica de `Branch_Status.md`, `Branch_changes.md`,
`README.md`, la codebase actual y las migraciones nuevas
`supabase/migrations/20260625142252_remote_schema.sql` y
`supabase/migrations/20260625153103_remote_schema.sql`. No se valido la
configuracion viva de Supabase Auth desde consola; por lo tanto, ajustes de
Auth aplicados solo fuera del repositorio quedan marcados como no verificables
desde codigo.

### Veredicto corto

La bitacora de `Branch_changes.md` coincide en buena parte con el codigo real.
Las correcciones de aplicacion mas importantes si estan hechas: redirect seguro
en confirmacion de Auth, validacion de ids, tipos TypeScript alineados con el
schema, servicio de dominio para tipos, mapeo de errores esperados y seed
administrativo no destructivo por defecto.

La migracion nueva cierra el hueco principal de integridad de datos que habia
quedado en la reauditoria anterior: ya versiona y valida `CHECK` para numeros
no negativos, textos no vacios y longitudes maximas en `producto` y `tipo`.
Tambien conserva la unicidad normalizada de tipos por usuario.

La migracion mas reciente tambien endurece la frontera de DB: revoca permisos
de tabla para `anon`, quita permisos innecesarios de `authenticated`, recrea
policies de productos para `authenticated` y agrega `WITH CHECK` explicito en
UPDATE de productos. Ademas cambia la relacion producto/tipo a una FK compuesta
`(tipo_id, user_id)`, evitando que un producto de un usuario apunte a un tipo de
otro usuario incluso por llamada directa a Supabase.

La app ya esta en mejor posicion para una beta abierta minima o controlada,
siempre que RLS y Auth esten activos en Supabase y exista monitoreo operativo.
No marcaria `producto.tipo_id ON DELETE SET NULL` como bloqueante para beta: es
una decision funcional razonable si el negocio permite eliminar un tipo sin
destruir productos. La migracion actual conserva filas y solo limpia
`tipo_id`, por lo que el `user_id` del producto permanece intacto.

La app todavia no queda lista para produccion con datos importantes de clientes
solo desde la codebase. Los pendientes principales son pruebas automatizadas,
hacer explicitas las policies restantes de tipos, confirmacion operativa de
Supabase Auth y limpieza de algunos detalles de documentacion/schema.

### Estado contra las fases reportadas

| Fase o recomendacion | Estado real al 25 de junio | Evaluacion |
| --- | --- | --- |
| Redirect seguro en `/auth/confirm` | `app/auth/confirm/route.ts` usa `getSafeRedirectPath` de `lib/supabase/proxy.ts`. | Hecho. |
| Validacion de ids dinamicos | Productos validan en Route Handler; tipos validan en `lib/product-types.service.ts` antes de tocar base de datos. | Hecho. |
| Tipos TypeScript vs schema | `ProductRow.id`, `ProductRow.tipo_id` y `ProductType.id` son numericos; payloads cliente ya no heredan `user_id`. | Hecho, con deuda conocida de `Product.tipo_id` como nombre visible. |
| Servicio de tipos | Existe `lib/product-types.service.ts`; los endpoints de tipos delegan en el servicio. | Hecho. |
| Errores esperados de Supabase | `lib/api-errors.ts` mapea `23505`, `23503`, `22P02` y `PGRST116`; repositorios lo usan. | Hecho en codigo, pendiente de pruebas. |
| Seed seguro | `scripts/seed-products.ts` es no destructivo por defecto, exige `SEED_DELETE_PREVIOUS_DATA=true` y `CONFIRM_SEED_DELETE=true`, y bloquea borrado con `NODE_ENV=production`. | Hecho. |
| Checklist Supabase Auth | README y `Branch_changes.md` documentan valores esperados. | Documentado, no verificable desde repo. |
| Migraciones versionadas | Existen migraciones con tablas, RLS, FK, unicidad y constraints de integridad. | Hecho. |
| Constraints de integridad | `20260625142252_remote_schema.sql` agrega y valida `CHECK` para no negativos, no vacios y longitudes maximas. | Hecho. |
| Unicidad de tipos por usuario | La migracion tiene indice unico funcional `user_id, lower(trim(tipo_de_producto))`. | Hecho. |
| Unicidad de productos | La migracion agrega `producto_user_nombre_unique` por usuario y nombre normalizado. | Hecho, conviene confirmar que esa regla de negocio es deseada. |
| FK producto/tipo por usuario | `20260625153103_remote_schema.sql` usa FK compuesta `(tipo_id, user_id)` hacia `tipo(id, user_id)`. | Hecho. |
| Borrado de tipos relacionados | La FK usa `ON DELETE SET NULL (tipo_id)`. | Decision aceptada para beta; documentar comportamiento. |
| Grants de tabla | La migracion mas reciente revoca permisos de `anon` y permisos innecesarios de `authenticated`. | Hecho. |
| Policies RLS explicitas | Productos SELECT/UPDATE ya son `to authenticated`; UPDATE tiene `WITH CHECK`. Policies de tipos siguen `to public` y UPDATE de tipo no muestra `WITH CHECK` explicito. | Parcial. |
| Tests automatizados | No hay script de test ni specs en el repo. | Pendiente. |

### Hallazgos verificados en codigo y DB

1. La separacion entre usuarios sigue bien defendida en runtime. Los servicios
   obtienen usuario con Supabase Auth en servidor y los repositorios filtran por
   `user_id` en consultas, updates y deletes.
2. El navegador no consulta directamente `producto` ni `tipo`. Las llamadas
   directas a Supabase desde cliente aparecen en Auth, que es una excepcion
   deliberada y apropiada.
3. La service role solo aparece en `scripts/seed-products.ts`; no se usa en
   `app`, `components`, `hooks`, `lib` o `database`.
4. La validacion server-side de productos sigue rechazando strings vacios,
   numeros no finitos, precios negativos y existencia negativa o decimal.
5. La migracion nueva agrega defensas de base para los mismos invariantes
   criticos: `producto_existencia_nonnegative`,
   `producto_precio_proveedor_nonnegative`,
   `producto_precio_publico_nonnegative`, `producto_nombre_not_blank`,
   `producto_nombre_max_length`, `producto_modelo_max_length`,
   `producto_medida_max_length`, `tipo_nombre_not_blank` y
   `tipo_nombre_max_length`.
6. La validacion de tipos hace `trim` y exige texto no vacio. Ahora la base
   tambien limita `tipo_de_producto` a 80 caracteres, lo que cubre llamadas
   directas a Supabase que salten la UI.
7. La busqueda remota usa query builder/PostgREST y escapa comillas dobles y
   backslashes en el filtro `.or(...)`. Aun asi, faltan pruebas con comas,
   parentesis, comillas, backslashes y operadores PostgREST.
8. El helper de ids rechaza valores no numericos, cero, negativos y enteros no
   seguros. Productos lo aplican en el Route Handler; tipos lo aplican en el
   servicio antes de llamar al repositorio.
9. `database/productTypes.ts` sigue buscando duplicados con igualdad exacta
   antes de insertar. La unicidad case-insensitive de la migracion cubre
   carreras y llamadas directas, pero en esos casos el comportamiento sera
   `409` en vez de reutilizacion silenciosa del tipo existente.
10. La migracion mas reciente reemplaza la FK simple de `producto.tipo_id` por
    `producto_tipo_id_user_id_fkey`, una FK compuesta que obliga a que el tipo
    referenciado pertenezca al mismo `user_id` que el producto.
11. El borrado de tipos relacionados queda como decision funcional aceptada
    para beta: la FK versionada usa `ON DELETE SET NULL`, por lo que borrar un
    tipo usado por productos conserva las filas y deja `tipo_id` en `null`. El
    servicio normaliza esos productos como `Sin tipo`.
12. La migracion mas reciente revoca permisos de tabla para `anon` en
    `producto` y `tipo`, y revoca permisos innecesarios de `authenticated`
    como `references`, `trigger` y `truncate`.
13. Productos quedaron mas explicitos: SELECT y UPDATE son `to authenticated`,
    y UPDATE declara `WITH CHECK` de propietario.
14. Hay dos indices unicos funcionalmente equivalentes para tipos:
    `tipo_user_tipo_de_producto_unique` y `tipo_user_tipo_normalized_unique`.
    No debilita seguridad, pero duplica mantenimiento en inserts/updates y
    conviene limpiar uno.
15. Las policies de tipos siguen declaradas `to public` desde la migracion base.
    Como los grants de `anon` ya fueron revocados, no es un acceso anonimo
    efectivo, pero para claridad operativa conviene recrearlas `to
    authenticated` y agregar `WITH CHECK` explicito en UPDATE.
16. No hay proteccion CSRF/origin explicita en endpoints mutantes. El riesgo
    sigue siendo menor con JSON/fetch same-origin y cookies modernas, pero es
    una defensa recomendable antes de abrir la app fuera de una beta cerrada.

### Documentacion sincronizada y remanentes historicos

1. `README.md` ya fue actualizado para reflejar migraciones versionadas,
   servicio de tipos, constraints, RLS/grants y `ON DELETE SET NULL`.
2. Pasajes historicos de la auditoria del 22 de junio quedan como referencia de
   estado anterior; para la foto vigente debe usarse esta reauditoria.
3. La deuda de eliminacion de tipos fuera de `useProductTypes` sigue siendo
   real: `TypeDropdownMenu.tsx` importa `deleteProductType` desde `lib/api.ts`
   y despues llama `refetch()`.
4. La deuda de `tipo_id` con doble significado sigue real en el contrato de UI.
5. La deuda de pruebas automatizadas sigue real.
6. La recomendacion vieja de cerrar el open redirect de `/auth/confirm` ya esta
   resuelta.
7. La afirmacion de que borrar un tipo usado queda protegido por FK restrictiva
   ya no aplica; por decision de producto, la FK usa `ON DELETE SET NULL
   (tipo_id)` y no se considera bloqueante para beta abierta minima.
8. La deuda antigua sobre constraints de integridad faltantes y grants anonimos
   amplios ya no aplica a las migraciones nuevas.

### Pendientes minimos antes de produccion

1. Hacer explicitas las policies RLS de tipos para `authenticated` y agregar
   `WITH CHECK` visible en UPDATE de `tipo`.
2. Revisar si conviene recrear tambien INSERT/DELETE de productos como `to
   authenticated` para consistencia documental, aunque los grants de `anon` ya
   fueron revocados.
3. Limpiar el indice unico redundante de tipos o decidir un unico nombre
   canonico para `user_id, lower(btrim(tipo_de_producto))`.
4. Documentar formalmente que borrar un tipo deja productos como `Sin tipo` por
   `ON DELETE SET NULL`, y actualizar UI/API si se quiere hacerlo mas explicito
   para el usuario.
5. Confirmar si `producto_user_nombre_unique` es la regla deseada. Hoy impide
   productos con el mismo nombre por usuario aunque cambien modelo, medida o
   tipo.
6. Agregar pruebas automatizadas para aislamiento entre usuarios, ids invalidos,
   inputs negativos, strings largos, duplicados, borrado de tipos relacionados y
   busqueda con caracteres especiales.
7. Confirmar fuera del repositorio la checklist de Supabase Auth productiva:
   email confirmation, redirect URLs, Site URL, politica de contrasena, rate
   limits, plantillas y MFA segun necesidad.
8. Mantener `README.md` y `Branch_Status.md` sincronizados cuando cambien las
   migraciones o reglas de negocio.

---

## Auditoria medium-depth — 29 de junio de 2026

Cobertura: seguridad, conexiones entre modulos, arquitectura y casos especiales
de render, calidad del codigo, modularidad-legibilidad y codigo basura.

### Resumen de hallazgos nuevos

| Area | Hallazgo | Prioridad |
| --- | --- | --- |
| Calidad | `lib/contentNormalizer.ts` nombre enganoso (deuda 17) | Baja |
| Calidad | `validateSupabaseTableId` devuelve `string` en vez de `number` (deuda 19) | Baja |
| Calidad | Doble `console.error` en Route Handlers de tipos (deuda 20) | Baja |
| Modularidad | Dos `StockBadge` con mismo nombre en `ui/` y `landing/` | Baja |
| Modularidad | `TypeDropdownMenu.tsx` exporta `TypeCombobox` (deuda 18) | Baja |
| Codigo basura | `next-themes` instalado sin consumidor activo (deuda 14) | Media |
| Codigo basura | `tsx` sin declarar en `devDependencies` (deuda 15) | Media |
| Codigo basura | `package-lock.json` coexiste con `pnpm-lock.yaml` (deuda 16) | Baja |
| Arquitectura | `lib/products.server.ts` es un re-export trivial de una linea | Informativo |
| Seguridad | Sin hallazgos nuevos criticos | — |

### Estado arquitectonico al 29 de junio

Los flujos documentados en Branch_Status.md coinciden con el codigo real. La
capa de seguridad esta en orden: proxy con `getClaims()`, servicios con
`getUser()`, filtros por `user_id`, RLS, validacion de ids, Zod. El caso
especial de render inicial (Server Component + Suspense + datos iniciales sin
HTTP) esta implementado correctamente y documentado.

Las deudas nuevas son de baja severidad. No bloquean la beta. El foco antes
de produccion sigue siendo: pruebas automatizadas, policies RLS de tipos, y
limpieza de los items heredados.

---

## Auditoria del 29 de junio de 2026

Rama auditada: `deployment-config` (1 commit adelante de origin).

Alcance: contraste estatico de los tres documentos contra la codebase actual.
No se ejecutaron lint ni build.

### Hallazgo critico 1: landing page nueva sin documentar

La ruta `/landing` existe en codigo desde antes de esta auditoria y no
aparecia en ningun documento.

Estructura nueva confirmada:

```txt
app/landing/page.tsx
components/landing/  (14 componentes)
lib/landing/         (6 modulos: constants, countdown, use-countdown,
                      showcase-data, features-data, onboarding-data)
```

Puntos clave:

- `BETA_DEADLINE_ISO = "2026-07-02T23:59:59-06:00"`. El plazo de beta es el
  2 de julio de 2026 y la landing muestra una cuenta regresiva hacia ese
  momento.
- `BetaModal` aparece automaticamente despues de 600 ms con un CTA que lleva
  a `/auth/login` para registro.
- `lib/supabase/proxy.ts` fue actualizado para incluir `/landing` en
  `publicPaths` y `guestOnlyPaths`. La intencion es que la landing sea
  accesible sin autenticacion y que usuarios autenticados sean redirigidos al
  intentar visitarla.
- La landing usa su propio layout de marketing, sin `Navbar` ni `Footer` del
  inventario.

### Hallazgo 2 — `proxy.ts` es la convencion correcta de Next.js 16 (CORREGIDO)

La auditoria inicial marco `proxy.ts` como un archivo inactivo. Al verificarlo
con `pnpm build` se confirmo que Next.js 16 cambio la convencion: el archivo
de proxy/middleware ahora debe llamarse `proxy.ts` y exportar `proxy`. El build
con el nombre `proxy.ts` compila sin warnings; con `middleware.ts` Next.js 16
emite un warning de deprecacion. El archivo estaba correcto desde el inicio.

### Hallazgo 3: dependencias sin version fija

`package.json` usa `"latest"` para `next`, `@supabase/ssr` y
`@supabase/supabase-js`. El lockfile protege la instalacion local, pero un
entorno limpio de CI o un Vercel redeploy sin cache puede instalar una version
distinta.

Accion recomendada: fijar las versiones que resuelve el lockfile actual.

### Deudas confirmadas pendientes al 29 de junio

| Deuda | Ubicacion |
| --- | --- |
| Eliminacion de tipos fuera de `useProductTypes` | `TypeDropdownMenu.tsx` |
| `console.log` en Configuracion | `NavbarMenu.tsx:43` |
| Footer links sin destino | `Footer.tsx` (tres `href="#"`) |
| Componentes heredados sin consumidor | `auth-button`, `logout-button`, `env-var-warning`, `theme-switcher` |
| Ruta `/login` en proxy sin pagina real | `lib/supabase/proxy.ts:6` |
| No hay pruebas automatizadas | Todo el proyecto |
| `eslint-config-next` 15.3.1 vs Next.js 16 | `package.json` |
