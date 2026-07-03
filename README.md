# Motorefacciones - Inventario

Aplicacion web privada para administrar el inventario de una refaccionaria de
motocicletas. Permite a cada usuario autenticado consultar y gestionar sus
productos y tipos de producto mediante una interfaz operativa conectada a
Supabase.

## Estado actual

La aplicacion cuenta con un MVP funcional del inventario:

- Autenticacion por correo y contrasena con Supabase Auth.
- Proteccion de paginas y endpoints para usuarios autenticados.
- Redireccion segura al login y retorno a la ruta solicitada.
- Listado paginado, busqueda, alta, edicion y eliminacion de productos.
- Consulta, alta y eliminacion de tipos de producto.
- Validacion de payloads en servidor con Zod.
- Confirmacion antes de eliminar productos o tipos.
- Manejo visible de errores y restauracion del estado cuando falla un borrado.
- Separacion de datos por usuario reforzada en codigo y mediante RLS de
  Supabase.

La ruta principal `/` contiene el inventario y requiere una sesion valida.

## Stack

- Next.js 16 con App Router, Server Components y Route Handlers.
- React 19 y TypeScript estricto.
- Tailwind CSS, Radix UI y componentes estilo shadcn.
- Supabase Auth, Supabase SSR y PostgreSQL con RLS.
- Zod para validacion de entradas del servidor.
- pnpm como gestor de dependencias.

## Funcionalidades

### Inventario

Cada producto contiene:

- Nombre.
- Modelo compatible.
- Medida.
- Tipo de producto.
- Existencia.
- Precio proveedor.
- Precio publico.

La pantalla principal carga inicialmente la primera pagina de productos desde el
servidor. El listado usa paginas de 50 productos y controles de anterior /
siguiente basados en `hasNextPage`.

La busqueda considera `nombre`, `modelo`, `medida` y el nombre visible del
tipo. En el cliente se normaliza el texto, se limita a 100 caracteres y se
aplica un debounce de 450 ms. Mientras llega la respuesta remota, la interfaz
puede mostrar coincidencias locales de las paginas ya cacheadas. La busqueda
completa se resuelve en servidor mediante `GET /api/products?q=...&page=...`.

Crear y editar productos se realiza desde un modal. El servidor valida campos
requeridos, convierte entradas numericas, rechaza valores negativos y exige que
la existencia sea un entero.

El borrado solicita confirmacion y se refleja de forma optimista en la tabla. Si
la operacion falla, el producto se restaura y el error aparece en la interfaz.

### Tipos de producto

El selector de tipos permite:

- Buscar tipos existentes.
- Crear un tipo nuevo desde el mismo selector.
- Eliminar un tipo despues de confirmarlo.

Los tipos disponibles pertenecen al usuario autenticado.

### Autenticacion

La aplicacion incluye:

- Inicio de sesion con correo y contrasena.
- Inicio de sesion con Google (OAuth) desde login y registro.
- Registro con aceptacion obligatoria de terminos y condiciones. El registro
  entra directo al inventario: la confirmacion por correo esta desactivada.
- Recuperacion de contrasena (envia correo con enlace).
- Actualizacion de contrasena.
- Cierre de sesion desde la pagina principal.

Un usuario autenticado que visita una pantalla exclusiva para invitados, como
`/auth/login`, es redirigido al inventario.

## Arquitectura actual

La aplicacion usa una arquitectura por capas, pero no toda operacion debe
recorrer una unica cadena `componente -> hook -> lib/api -> /api -> database`.
El flujo correcto depende de donde comienza la operacion.

### Flujos de dominio

#### CRUD de productos iniciado en el navegador

Este es el flujo mas completo y consistente de la aplicacion:

```txt
components/inventory/InventoryDashboardClient.tsx
  -> hooks/useInventory.ts
    -> lib/api.ts
      -> app/api/products/*
        -> lib/products.service.ts
          -> database/items.ts
            -> lib/supabase/server.ts
              -> Supabase PostgreSQL + RLS
```

El hook administra estado interactivo; `lib/api.ts` es el cliente HTTP del
navegador; los Route Handlers son la frontera HTTP; el servicio concentra
validacion, autorizacion y reglas de negocio; `database/items.ts` encapsula las
consultas. `useInventory` tambien administra cache LRU de paginas, busqueda con
cancelacion de requests obsoletos, paginacion y restauracion de estado en
errores de borrado optimista.

#### Carga inicial de productos desde servidor

La primera carga evita una llamada HTTP interna:

```txt
app/page.tsx (Server Component)
  -> lib/products.server.ts
    -> lib/products.service.ts
      -> database/items.ts
        -> lib/supabase/server.ts
          -> Supabase PostgreSQL + RLS
```

Este flujo no necesita hook ni `/api`. Un Server Component debe llamar a una
funcion server-only o servicio directamente, en lugar de hacer `fetch` contra
un endpoint de la misma aplicacion.

#### Tipos de producto

Los tipos ya siguen la misma frontera server-side que productos:

```txt
components/inventory/TypeDropdownMenu.tsx
  -> hooks/useProductTypes.ts (listar y crear)
  -> lib/api.ts
    -> app/api/product-types/*
      -> lib/product-types.service.ts
        -> database/productTypes.ts
          -> lib/supabase/server.ts
            -> Supabase PostgreSQL + RLS
```

Los Route Handlers delegan en `lib/product-types.service.ts`; el servicio
concentra autenticacion, validacion, `trim`, reutilizacion de tipos existentes,
creacion, eliminacion y errores 404/409 controlados. `database/productTypes.ts`
queda como acceso a datos.

La diferencia pendiente esta en el estado cliente: la eliminacion todavia se
inicia desde `TypeDropdownMenu.tsx` hacia `lib/api.ts` y luego llama `refetch()`.
Conviene mover esa operacion a `useProductTypes` para que el hook concentre
todas las operaciones interactivas de tipos.

### Flujos de autenticacion e infraestructura

Supabase Auth usa flujos distintos al CRUD de dominio:

```txt
Formularios cliente -> lib/supabase/client.ts -> Supabase Auth
LogoutButton/NavbarMenu -> hooks/useLogout.ts -> lib/supabase/client.ts -> Supabase Auth
Server Components y /auth/confirm -> lib/supabase/server.ts -> Supabase Auth
proxy.ts -> lib/supabase/proxy.ts -> Supabase Auth
```

Estos accesos directos son apropiados: Supabase Auth administra sesion y
cookies mediante sus clientes oficiales, y no necesita pasar por
`database/*`. Los Server Components tampoco usan hooks de cliente. Extraer
adaptadores o hooks adicionales solo seria recomendable si se necesita
reutilizacion, pruebas aisladas o una politica centralizada de errores.

### Regla arquitectonica recomendada

| Punto de entrada | Flujo recomendado |
| --- | --- |
| Interaccion cliente de dominio | Componente -> hook/controlador -> `lib/api.ts` -> Route Handler -> servicio -> `database/*` -> Supabase. |
| Server Component de dominio | Server Component -> modulo server-only/servicio -> `database/*` -> Supabase. |
| Supabase Auth en cliente | Componente o hook -> `lib/supabase/client.ts` -> Supabase Auth. |
| Auth y proteccion en servidor | Route Handler, Server Component o proxy -> cliente Supabase server/proxy -> Supabase Auth. |
| Scripts administrativos | Script aislado -> cliente administrativo -> Supabase; fuera del runtime y con credenciales protegidas. |

Los hooks no son una capa obligatoria. Son utiles para estado, efectos y
comportamiento reutilizable del navegador; no aplican a Server Components,
Route Handlers ni scripts.

### Responsabilidades por directorio

| Directorio | Responsabilidad |
| --- | --- |
| `app/` | Paginas, layouts, autenticacion y endpoints internos. |
| `app/landing/` | Pagina de aterrizaje de la beta (publica). |
| `components/inventory/` | Tabla, modal, selector de tipos, confirmaciones y errores del inventario. |
| `components/landing/` | Componentes de la pagina de aterrizaje (hero, features, countdown, etc.). |
| `components/layout/` | Navegacion y pie de pagina del inventario. |
| `components/ui/` | Primitivas reutilizables de interfaz. |
| `hooks/` | Estado y operaciones interactivas del cliente. |
| `lib/` | Cliente HTTP, servicios de dominio, validacion, seguridad, paginacion, busqueda, cache cliente, clientes Supabase y utilidades. |
| `lib/landing/` | Constantes, datos y utilidades de la pagina de aterrizaje. |
| `database/` | Capa de acceso a datos para las tablas `producto` y `tipo`. |
| `supabase/migrations/` | Schema, constraints, indices, foreign keys y policies RLS versionadas. |
| `types/` | Contratos compartidos de dominio y respuestas. |
| `proxy.ts` | Punto de entrada del proxy de Next.js 16 para refrescar y proteger sesiones. En Next.js 16 reemplaza a `middleware.ts`. |

## Proteccion y seguridad

La proteccion se aplica en varias capas complementarias.

### Proxy de sesion

`proxy.ts` delega en `lib/supabase/proxy.ts` para:

- Refrescar las cookies de sesion de Supabase.
- Redirigir usuarios anonimos a `/auth/login`.
- Conservar la ruta solicitada en el parametro seguro `next`.
- Responder `401` en JSON cuando un usuario anonimo llama a `/api/*`.
- Evitar que usuarios autenticados regresen a paginas exclusivas para
  invitados.

Las rutas bajo `/auth/*` son publicas porque alojan los flujos de autenticacion.
Las rutas de login, registro y recuperacion son exclusivas para invitados.

### Autorizacion del servidor

Los servicios y endpoints no dependen solamente del proxy:

- `requireCurrentUser()` valida la sesion nuevamente con Supabase.
- `getCurrentUserId()` obtiene el propietario autenticado.
- El servidor asigna `user_id` al crear datos; no confia en el propietario
  enviado por el cliente.
- Las consultas, actualizaciones y eliminaciones filtran por `user_id`.
- Los errores de autenticacion se convierten en respuestas HTTP `401`.

### RLS

Las politicas RLS de Supabase son la ultima frontera de autorizacion y deben
permanecer activas para `producto` y `tipo`. El codigo usa el cliente de usuario
con cookies de sesion durante el runtime; no utiliza una service role para
saltarse RLS. El script administrativo de seed es la excepcion aislada.

Las migraciones versionan RLS, grants y constraints. La configuracion actual
revoca permisos de tabla para `anon`, conserva permisos de lectura/escritura
solo para usuarios autenticados y refuerza productos con policies `SELECT` y
`UPDATE` para `authenticated`; `UPDATE` incluye `WITH CHECK` de propietario.
La relacion entre productos y tipos usa una FK compuesta `(tipo_id, user_id)`,
lo que evita asociar un producto con un tipo de otro usuario incluso si alguien
llama Supabase directamente.

### Aceptacion de terminos y condiciones

El uso de la aplicacion exige aceptar la version vigente de los terminos. La
version unica de verdad vive en `lib/terms.ts` como `CURRENT_TERMS_VERSION` y se
registra en la tabla `terms_acceptance` con un modelo append-only: una fila por
combinacion `(user_id, terms_version)`. Esto permite versionar los terminos sin
necesidad de una policy `UPDATE` (el RLS solo expone `INSERT` y `SELECT`).

La proteccion no depende del frontend. El gate real es server-side y vive en el
mismo choke point por el que pasa todo el dominio:

- `requireAcceptedTerms()` (`lib/terms.service.ts`) reemplaza a
  `getCurrentUserId()` en los servicios de productos y tipos. Resuelve el
  usuario, exige una aceptacion de la version vigente y lanza
  `TermsRequiredError` (HTTP 403) si no existe.
- Como todo acceso a datos de dominio (SSR inicial, listados, busqueda y
  mutaciones) pasa por esos servicios, ni el frontend ni un `curl` pueden operar
  sin una aceptacion registrada.
- El servidor fija siempre la version desde `CURRENT_TERMS_VERSION`; nunca confia
  en la version enviada por el cliente. El RLS garantiza que cada usuario solo
  pueda insertar su propia aceptacion.

Puntos de registro de la aceptacion:

- En el registro, un checkbox obligatorio guarda la intencion en
  `user_metadata`. Al confirmar el email (`app/auth/confirm/route.ts`), si esa
  marca existe, se registra la aceptacion (best-effort, con IP).
- Quien llegue autenticado sin aceptacion (por ejemplo, un registro por `curl`
  sin checkbox, o un usuario anterior a esta funcionalidad) ve un popup
  no-descartable en `/home` que registra la aceptacion via
  `POST /api/terms/accept` antes de poder usar la aplicacion.

## Rutas

| Ruta | Acceso | Proposito |
| --- | --- | --- |
| `/` | Autenticado | Inventario principal. |
| `/landing` | Invitado | Pagina de aterrizaje de la beta. |
| `/auth/login` | Invitado | Inicio de sesion. |
| `/auth/sign-up` | Invitado | Registro. |
| `/auth/forgot-password` | Invitado | Solicitud de recuperacion. |
| `/auth/update-password` | Publica dentro del flujo de recuperacion | Cambio de contrasena. |
| `/auth/error` | Publica | Pantalla de error de autenticacion. |
| `/auth/confirm` | Publica | Confirmacion de OTP de recuperacion de contrasena. |
| `/auth/callback` | Publica | Intercambia el codigo OAuth (Google) por sesion. |
| `/api/products` | Autenticado | Listar y crear productos. |
| `/api/products/[id]` | Autenticado | Consultar, editar y eliminar un producto. |
| `/api/product-types` | Autenticado | Listar y crear tipos. |
| `/api/product-types/[id]` | Autenticado | Eliminar un tipo. |
| `/api/terms/accept` | Autenticado | Registrar la aceptacion de los terminos vigentes. |

## Manejo de errores

Los Route Handlers devuelven errores JSON con un estado HTTP apropiado. El
cliente transforma esas respuestas en errores legibles para la interfaz.

- Los errores de carga se muestran dentro del estado principal.
- Los errores de crear, editar o eliminar productos aparecen en un aviso
  flotante descartable.
- Los errores al eliminar tipos se muestran dentro del dialogo de
  confirmacion.
- El borrado optimista de productos se revierte cuando la API falla.
- Los modales conservan su estado cuando una operacion no termina
  correctamente.

## Requisitos y configuracion

Se necesita una version de Node.js compatible con Next.js 16, Corepack/pnpm y
un proyecto de Supabase con Auth y RLS configurados.

Crea `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY

# Opcional. Por defecto el cliente usa /api.
NEXT_PUBLIC_API_URL=/api

# Solo para seed administrativo local.
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
SEED_USER_ID=UUID_DEL_USUARIO_A_SEEDEAR
SEED_DELETE_PREVIOUS_DATA=false
CONFIRM_SEED_DELETE=false
```

Las variables de Supabase son obligatorias para validar sesiones. Los archivos
`.env*` locales no se versionan.

### Instalacion

```bash
pnpm install
pnpm dev
```

La aplicacion queda disponible normalmente en:

```txt
http://localhost:3000
```

`pnpm-workspace.yaml` aprueba unicamente los scripts nativos requeridos por
`sharp` y `unrs-resolver`. Si pnpm vuelve a solicitar aprobacion, no habilites
scripts globalmente; conserva la lista explicita del proyecto.

### Comandos

```bash
pnpm dev     # Servidor de desarrollo
pnpm lint    # ESLint
pnpm build   # Build de produccion y validacion TypeScript
pnpm start   # Ejecutar el build de produccion
pnpm seed:products # Seed administrativo local
```

Antes de entregar cambios:

```bash
pnpm lint
pnpm build
```

### Seed administrativo

`pnpm seed:products` ejecuta `scripts/seed-products.ts`. El script usa
`SUPABASE_SERVICE_ROLE_KEY`, por lo que evita RLS intencionalmente y debe
tratarse como herramienta administrativa local o de CI controlado, no como
flujo de runtime ni como credencial disponible para el cliente.

El seed crea 15 tipos de producto base y 300 productos para `SEED_USER_ID`.
Por defecto es no destructivo: no borra datos, reutiliza tipos existentes y
agrega productos nuevos con un sufijo unico por ejecucion.

Para borrar primero los productos y tipos previos del usuario objetivo, se
deben definir ambas variables:

```env
SEED_DELETE_PREVIOUS_DATA=true
CONFIRM_SEED_DELETE=true
```

El modo destructivo se bloquea cuando `NODE_ENV=production`.

### Checklist Supabase Auth para produccion

Esta configuracion se aplica en la consola de Supabase del proyecto
productivo. No guardes llaves, tokens de Management API ni secretos en archivos
versionados.

Usa valores exactos para produccion:

| Ajuste | Valor productivo requerido |
| --- | --- |
| Confirmacion de email | Desactivada. El registro entra directo al inventario; la recuperacion de contrasena sigue enviando correo. |
| Proveedor Google (OAuth) | Activado. Client ID y Secret desde Google Cloud Console; redirect de Supabase `https://<proyecto>.supabase.co/auth/v1/callback`. |
| Site URL | `https://<dominio-productivo>` |
| Redirect URLs permitidas | `https://<dominio-productivo>/`, `https://<dominio-productivo>/auth/update-password` y `https://<dominio-productivo>/auth/callback` |
| Redirect URLs locales | Solo en proyecto local/staging separado: `http://localhost:3000/` y `http://localhost:3000/auth/update-password` |
| Wildcards de redirect | No usar comodines amplios ni dominios no controlados en produccion. |
| Politica minima de contrasena | Minimo 12 caracteres, con minusculas, mayusculas, numeros y simbolos. Activar bloqueo de contrasenas filtradas si el plan lo permite. |
| Rate limits de Auth | Revisados en Authentication > Rate Limits. Mantener limites por defecto como base y endurecer envios de email/OTP si hay abuso. |
| MFA | Evaluado. No marcarlo como obligatorio hasta implementar UI de enrollment/challenge; preferir TOTP cuando se agregue. |
| Plantillas de correo | Revisar confirmacion y recuperacion para usar solo URLs del dominio productivo y no exponer errores internos. |

Flujos a validar manualmente despues de aplicar la configuracion:

- Registro con correo entra directo al inventario, sin correo de confirmacion.
- Login con correo redirige al inventario.
- Login con Google (cuenta nueva y existente) termina en el inventario.
- Recuperacion de contrasena abre `/auth/update-password`.
- Actualizacion de contrasena permite volver a iniciar sesion.

## Modelo de datos esperado

El codigo espera dos tablas de Supabase.

### `producto`

```txt
id
nombre
modelo
medida
tipo_id
existencia
precio_proveedor
precio_publico
user_id
```

### `tipo`

```txt
id
tipo_de_producto
user_id
```

### `terms_acceptance`

```txt
id
user_id
terms_version
accepted_at
ip_address
```

Modelo append-only: una fila por `(user_id, terms_version)`. La unicidad la
garantiza `unique (user_id, terms_version)`. RLS expone solo `INSERT` y `SELECT`
para `authenticated` con `auth.uid() = user_id`.

`producto.tipo_id` almacena el identificador de `tipo` en la base de datos. En
el modelo normalizado que consume actualmente la UI, la propiedad `tipo_id`
contiene el nombre visible del tipo. Esta dualidad se conserva por
compatibilidad y es una deuda de dominio conocida.

La base versionada refuerza integridad con constraints para existencias y
precios no negativos, textos requeridos no vacios, longitudes maximas y
unicidad normalizada de tipos por usuario. `producto.tipo_id` usa `ON DELETE SET
NULL`: si se elimina un tipo, los productos relacionados se conservan y quedan
como `Sin tipo` en la UI.

## Decisiones actuales

- La primera carga ocurre en un Server Component y entrega datos iniciales al
  cliente.
- Los Server Components llaman servicios server-only directamente; no hacen
  peticiones HTTP a los Route Handlers de la misma aplicacion.
- Los hooks se reservan para estado y comportamiento interactivo del cliente.
- Los flujos de Supabase Auth usan los clientes oficiales directamente y no
  pasan por la capa `database/*`.
- La busqueda usa consulta server-side y fallback local sobre paginas cacheadas
  para responder mientras llega la red.
- La consulta inicial carga la primera pagina de 50 productos del usuario.
- El cliente conserva hasta 5 paginas normales y 10 paginas de busqueda en
  cache LRU durante la sesion de la vista.
- Los precios se presentan en formato MXN.
- Stock `0` se considera vacio, de `1` a `3` bajo y desde `4` disponible.
- Eliminar un tipo de producto no elimina productos: la base deja
  `producto.tipo_id` en `null` y la UI lo muestra como `Sin tipo`.
- La configuracion, soporte, privacidad y contacto permanecen como puntos de
  extension temporal.

## Limitaciones conocidas

- No hay conteo total de productos, salto a ultima pagina ni selector de tamano
  de pagina; la paginacion visible solo conoce anterior, siguiente y
  `hasNextPage`.
- La busqueda server-side usa coincidencias simples y no establece prioridad o
  ranking entre campos.

- Existen migraciones versionadas para schema, constraints, indices y RLS. Aun
  no hay indices especificos para optimizar busquedas `ilike` en `nombre`,
  `modelo`, `medida` o nombre de tipo.

- No existe una suite de pruebas automatizadas.

- La eliminacion de tipos se ejecuta desde el componente en vez de estar
  encapsulada en `useProductTypes`.
- El backend de tipos reutiliza coincidencias exactas antes de insertar. La
  base cubre duplicados case-insensitive con un indice unico normalizado; en
  carreras o llamadas directas el resultado puede ser `409` en vez de
  reutilizacion silenciosa.

- `tipo_id` tiene significados distintos entre la fila de base de datos y el
  modelo normalizado de UI.

- `scripts/seed-products.ts` usa una service role y evita RLS de forma
  intencional; debe tratarse como herramienta administrativa, no como flujo de
  la aplicacion.

- Configuracion y enlaces del footer aun no tienen destinos funcionales.
- El menu de Configuracion conserva una accion temporal con `console.log`.

- El proxy conserva `/login` como ruta publica/guest-only heredada, aunque no
  existe una pagina `app/login` en la codebase actual.
- Persisten componentes heredados sin consumidor directo en las rutas actuales:
  `auth-button`, `logout-button`, `env-var-warning` y `theme-switcher`.

- La eliminacion de un tipo relacionado con productos conserva las filas y deja
  el tipo en `null`; conviene hacer mas explicito este comportamiento en la UI
  si se mantiene despues de la beta.
- Hay dos indices unicos normalizados equivalentes para tipos en migraciones
  historicas; no afecta seguridad, pero conviene consolidarlos.
- `producto_user_nombre_unique` impide nombres duplicados por usuario aunque
  cambien modelo, medida o tipo; conviene confirmar si esa es la regla de
  negocio deseada.

- La estrategia de dependencias Radix mezcla paquetes especificos
  `@radix-ui/*` con el paquete monolitico `radix-ui`.
- `eslint-config-next` esta fijado en 15.3.1 mientras el lockfile resuelve
  Next.js 16.2.4.

## Calidad del codigo

El proyecto activa TypeScript estricto, `noUnusedLocals` y
`noUnusedParameters`. El dominio de inventario mantiene las escrituras y
consultas sensibles en el servidor. Los componentes de autenticacion cliente
si acceden directamente a Supabase Auth mediante `lib/supabase/client.ts`,
lo cual es una excepcion deliberada y apropiada para el manejo de sesion.

`Branch_changes.md` contiene la bitacora historica de auditorias, proteccion de
rutas y limpiezas aplicadas durante el desarrollo. Algunas secciones describen
estados anteriores; para la foto actual de arquitectura y deuda tecnica, usa
`Branch_Status.md`.
