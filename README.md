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
- Listado, busqueda, alta, edicion y eliminacion de productos.
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

La pantalla principal carga inicialmente los productos desde el servidor. La
busqueda se realiza en tiempo real sobre los productos cargados y considera
`nombre`, `modelo`, `medida` y el nombre visible del tipo.

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

- Inicio de sesion.
- Registro.
- Confirmacion por correo.
- Recuperacion de contrasena.
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
consultas.

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

Los tipos siguen parcialmente la arquitectura objetivo:

```txt
components/inventory/TypeDropdownMenu.tsx
  -> hooks/useProductTypes.ts (listar y crear)
  -> lib/api.ts
  -> app/api/product-types/*
  -> database/productTypes.ts
  -> lib/supabase/server.ts
  -> Supabase PostgreSQL + RLS
```

Actualmente los Route Handlers de tipos llaman directamente a
`database/productTypes.ts`; no existe un servicio de tipos equivalente a
`lib/products.service.ts`. Ademas, la eliminacion se inicia directamente desde
`TypeDropdownMenu.tsx` hacia `lib/api.ts`, fuera de `useProductTypes`.

Estas diferencias no rompen el funcionamiento, pero distribuyen validacion,
reglas y manejo de estado entre componente y Route Handler. Conviene crear un
servicio de tipos y mover la eliminacion al hook existente.

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
| `components/inventory/` | Tabla, modal, selector de tipos, confirmaciones y errores del inventario. |
| `components/layout/` | Navegacion y pie de pagina. |
| `components/ui/` | Primitivas reutilizables de interfaz. |
| `hooks/` | Estado y operaciones interactivas del cliente. |
| `lib/` | Cliente HTTP, servicios de dominio, validacion, seguridad, clientes Supabase y utilidades. |
| `database/` | Capa de acceso a datos para las tablas `producto` y `tipo`; no contiene el esquema ni las politicas RLS. |
| `types/` | Contratos compartidos de dominio y respuestas. |
| `proxy.ts` | Punto de entrada del proxy de Next para refrescar y proteger sesiones. |

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

## Rutas

| Ruta | Acceso | Proposito |
| --- | --- | --- |
| `/` | Autenticado | Inventario principal. |
| `/auth/login` | Invitado | Inicio de sesion. |
| `/auth/sign-up` | Invitado | Registro. |
| `/auth/forgot-password` | Invitado | Solicitud de recuperacion. |
| `/auth/update-password` | Publica dentro del flujo de recuperacion | Cambio de contrasena. |
| `/auth/confirm` | Publica | Confirmacion de OTP enviado por Supabase. |
| `/api/products` | Autenticado | Listar y crear productos. |
| `/api/products/[id]` | Autenticado | Consultar, editar y eliminar un producto. |
| `/api/product-types` | Autenticado | Listar y crear tipos. |
| `/api/product-types/[id]` | Autenticado | Eliminar un tipo. |

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
```

Antes de entregar cambios:

```bash
pnpm lint
pnpm build
```

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

`producto.tipo_id` almacena el identificador de `tipo` en la base de datos. En
el modelo normalizado que consume actualmente la UI, la propiedad `tipo_id`
contiene el nombre visible del tipo. Esta dualidad se conserva por
compatibilidad y es una deuda de dominio conocida.

## Decisiones actuales

- La primera carga ocurre en un Server Component y entrega datos iniciales al
  cliente.
- Los Server Components llaman servicios server-only directamente; no hacen
  peticiones HTTP a los Route Handlers de la misma aplicacion.
- Los hooks se reservan para estado y comportamiento interactivo del cliente.
- Los flujos de Supabase Auth usan los clientes oficiales directamente y no
  pasan por la capa `database/*`.
- La busqueda es local para responder inmediatamente sin peticiones nuevas.
- La consulta inicial esta limitada a los primeros 50 productos del usuario.
- Los precios se presentan en formato MXN.
- Stock `0` se considera vacio, de `1` a `3` bajo y desde `4` disponible.
- La configuracion, soporte, privacidad y contacto permanecen como puntos de
  extension temporal.

## Limitaciones conocidas

- No hay paginacion visible ni busqueda server-side.
- La busqueda no establece prioridad o ranking entre campos.
- No existe una suite de pruebas automatizadas.
- Los tipos de producto no tienen una capa de servicio y sus Route Handlers
  acceden directamente a `database/productTypes.ts`.
- La eliminacion de tipos se ejecuta desde el componente en vez de estar
  encapsulada en `useProductTypes`.
- `tipo_id` tiene significados distintos entre la fila de base de datos y el
  modelo normalizado de UI.
- El repositorio no contiene migraciones ni definiciones de politicas RLS, por
  lo que esa configuracion no puede auditarse o reproducirse solo desde codigo.
- `scripts/seed-products.ts` usa una service role y evita RLS de forma
  intencional; debe tratarse como herramienta administrativa, no como flujo de
  la aplicacion.
- Configuracion y enlaces del footer aun no tienen destinos funcionales.
- La eliminacion de un tipo relacionado con productos depende de las
  restricciones definidas en Supabase.

## Calidad del codigo

El proyecto activa TypeScript estricto, `noUnusedLocals` y
`noUnusedParameters`. El dominio de inventario mantiene las escrituras y
consultas sensibles en el servidor. Los componentes de autenticacion cliente
si acceden directamente a Supabase Auth mediante `lib/supabase/client.ts`,
lo cual es una excepcion deliberada y apropiada para el manejo de sesion.

`Branch_changes.md` contiene la bitacora detallada de auditorias, proteccion de
rutas y limpieza aplicadas durante el desarrollo.
