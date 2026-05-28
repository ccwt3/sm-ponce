# Motorefacciones - Inventario

Aplicacion Next.js para gestionar inventario de una refaccionaria de motocicletas. El objetivo funcional es administrar productos con nombre, modelo compatible, medida, tipo de producto, existencia, precio base/proveedor, precio de venta/publico y acciones CRUD para crear, editar y eliminar registros.

La aplicacion usa React en el frontend, App Router de Next.js, Tailwind CSS para estilos y Supabase para autenticacion, sesiones y acceso a datos. La seguridad de filas queda delegada a RLS de Supabase.

## Estado actual

La pantalla principal del inventario vive en `app/page.tsx`. Esta vista carga productos, permite busqueda en tiempo real, muestra una tabla, abre un modal para crear/editar y expone una accion de borrado.

El flujo actual es:

```txt
app/page.tsx
  -> hooks/useInventory.ts
    -> lib/api.ts
      -> app/api/products/route.ts
      -> app/api/products/[id]/route.ts
        -> database/items.ts
          -> lib/supabase/server.ts
            -> Supabase
```

Hay una base solida para separar UI, estado, API y base de datos, pero el proyecto todavia mezcla codigo propio del inventario con restos del starter de Supabase/Next.js.

## Stack

- Next.js con App Router.
- React 19.
- TypeScript con `strict` activo.
- Tailwind CSS.
- Supabase SSR con `@supabase/ssr` y `@supabase/supabase-js`.
- Radix UI y componentes estilo shadcn en `components/ui`.
- `lucide-react` para iconos.
- pnpm como gestor de dependencias segun `pnpm-lock.yaml`.

Scripts disponibles:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

Variables esperadas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_API_URL=
```

`NEXT_PUBLIC_API_URL` es opcional. Si no existe, `lib/api.ts` usa `/api`.

## Estructura revisada

### `app`

- `app/page.tsx`: pantalla principal del inventario. Es un Client Component que conecta el hook `useInventory` con la tabla, modal, barra de busqueda, navbar y footer.
- `app/api/products/route.ts`: route handler para listar y crear productos.
- `app/api/products/[id]/route.ts`: route handler para obtener, actualizar y eliminar por id.
- `app/auth/*`: pantallas y rutas heredadas del starter para login, registro, confirmacion, recuperacion y cambio de password.
- `app/protected/*`: pagina protegida de ejemplo del starter. Muestra claims del usuario y pasos tutoriales.
- `app/instruments/page.tsx`: pagina de prueba que consulta una tabla `instruments`; no parece pertenecer al dominio final del inventario.
- `app/layout.tsx`: layout raiz con metadatos de Motorefacciones.
- `app/globals.css`: Tailwind base/components/utilities.
- `app/particulars.css`: estilos sueltos no importados en el layout principal; parecen restos o pruebas.

### `components`

- `components/inventory/ProductTable.tsx`: tabla principal. Recibe productos filtrados y callbacks de editar/borrar.
- `components/inventory/ProductTableRows.tsx`: renderiza celdas a partir de `databaseFields`.
- `components/inventory/ProductModal.tsx`: modal de crear/editar producto. Mantiene estado local del formulario.
- `components/inventory/ProductModalFields.tsx`: renderiza inputs de formulario a partir de `databaseFields`.
- `components/layout/Navbar.tsx`: barra superior de Motorefacciones con menu de configuracion y logout.
- `components/layout/Footer.tsx`: pie de pagina simple.
- `components/ui/*`: componentes reutilizables de UI. `StockBadge.tsx` es especifico del inventario; otros son base del starter/shadcn.
- `components/*form.tsx`, `auth-button`, `logout-button`, etc.: componentes de autenticacion del starter Supabase.
- `components/tutorial/*`, logos y deploy button: restos del starter. No son parte del flujo principal de inventario.

### `hooks`

- `hooks/useInventory.ts`: hook central del inventario.

Responsabilidades actuales:

- Cargar productos desde `GET /api/products`.
- Mantener `products`, `search`, `loading`, `error` y estado de modal.
- Filtrar productos localmente en tiempo real.
- Crear, editar y borrar con llamadas a `lib/api.ts`.
- Hacer update optimista en borrado y recargar si falla.

### `lib`

- `lib/api.ts`: cliente HTTP del frontend hacia los route handlers de Next.js. Expone `getProducts`, `getProductById`, `createProduct`, `updateProduct` y `deleteProduct`.
- `lib/contentNormalizer.ts`: define `databaseFields`, la lista central de campos visibles en tabla y formulario.
- `lib/utils.ts`: utilidades de clases, formato de precio MXN, estado de stock, clases de badge y helpers heredados.
- `lib/supabase/client.ts`: cliente Supabase para Client Components.
- `lib/supabase/server.ts`: cliente Supabase para Server Components y route handlers con cookies.
- `lib/supabase/proxy.ts`: refresco de sesion y redireccion a login cuando no hay usuario.

### `database`

- `database/items.ts`: capa de acceso a Supabase para la tabla `producto`.

Metodos actuales:

- `getAllProducts()`: consulta `producto`, hace join con `tipo(tipo_de_producto)` y pagina los primeros 50 productos.
- `getProductById(id)`: consulta un producto por id.
- `createProduct(body)`: inserta un producto.
- `updateProduct(body)`: actualiza un producto.

No existe todavia un metodo real de eliminacion en esta capa.

### `types`

- `types/index.ts`: contratos principales de dominio y UI.

Tipos clave:

- `RawProduct`: forma esperada desde Supabase cuando `tipo` viene como relacion.
- `Product`: forma usada por la UI.
- `CreateProductInput`: producto sin `id` ni timestamps.
- `UpdateProductInput`: campos parciales con `id`.
- `ModalState`: estado del modal de crear/editar/cerrado.
- `StockStatus`: `ok`, `low` o `empty`.

## Modelo de producto usado por la UI

```ts
interface Product {
  id: string;
  nombre: string;
  modelo: string;
  medida: string;
  tipo_id: string;
  existencia: number;
  precio_proveedor: number;
  precio_publico: number;
  creadoEn?: string;
  actualizadoEn?: string;
}
```

Observacion importante: en la lectura de Supabase, `tipo_id` se transforma para contener el texto `tipo.tipo_de_producto`. El nombre `tipo_id` sugiere un identificador, pero en la UI se esta usando como etiqueta visible del tipo.

## Busqueda en tiempo real

La busqueda esta implementada en `hooks/useInventory.ts` como filtro local sobre el arreglo ya cargado. Esto cumple la parte de reaccion inmediata al escribir: cada cambio en el input de `app/page.tsx` actualiza `search`, recalcula `filteredProducts` y re-renderiza la tabla sin pedir datos de nuevo.

Campos buscados actualmente:

```ts
const searchFields = ["nombre", "medida", "modelo", "tipo_id"] as const;
```

Esto significa que hoy busca por:

- nombre
- medida
- modelo
- tipo visible en `tipo_id`

Brecha contra el requerimiento: el cliente pidio filtrar por `nombre -> modelo -> tipo`. El codigo actual agrega `medida` y no aplica una prioridad real por campo; solamente revisa si cualquiera de los campos contiene el texto. Funcionalmente, si se escribe `camara` o `elpepe`, encontrara coincidencias en cualquiera de esos campos cargados, pero la prioridad `nombre -> modelo -> tipo` no esta modelada como ranking u orden de resultados.

## CRUD actual

### Listar

`GET /api/products` llama a `itemsDatabase.getAllProducts()`, transforma el objeto relacional `tipo` a un campo plano `tipo_id` y responde `{ data: products }`.

La consulta esta limitada a 50 productos:

```ts
const page = 0;
const pageSize = 50;
```

### Crear

`POST /api/products` valida que existan `nombre` y `modelo`, luego llama a `itemsDatabase.createProduct(body)`.

Riesgo detectado: en `database/items.ts`, `createProduct()` usa `.select().single()`, por lo que Supabase devuelve un objeto, no un arreglo. Sin embargo, el metodo retorna `product[0]`. Esto probablemente rompe la creacion porque `backedProduct.id` quedaria indefinido o lanzaria error.

### Editar

`PUT /api/products/[id]` recibe el body, combina el `id` de la ruta y llama a `ItemsDatabase.updateProduct()`. El hook reemplaza el producto actualizado en estado local.

Riesgos detectados:

- Hay `console.log` activos en hook, route handler y database.
- El formulario manda valores numericos como strings porque todos los inputs usan `e.target.value`.
- No hay validacion de tipos o rangos para existencia/precios antes de actualizar.

### Eliminar

El frontend llama `DELETE /api/products/:id` y hace update optimista quitando la fila de la tabla.

Brecha critica: el route handler de `DELETE` actualmente solo responde `{ data: { id } }`; no llama a Supabase ni a `database/items.ts`. En la UI parece borrarse, pero el registro no se elimina de la base de datos. Al recargar, el producto deberia volver a aparecer.

## Supabase y seguridad

La app tiene clientes Supabase separados:

- `lib/supabase/client.ts` para navegador.
- `lib/supabase/server.ts` para servidor y route handlers.
- `lib/supabase/proxy.ts` para refresco de sesion y control de acceso.

El proxy redirige a `/auth/login` si no hay usuario y la ruta no es `/`, `/login` ni `/auth/*`.

Punto a revisar: `app/page.tsx` queda excluida de proteccion por la condicion `request.nextUrl.pathname !== "/"`. Si el inventario real debe ser privado, la ruta raiz deberia protegerse o moverse a una ruta protegida.

RLS: como las consultas a `producto` se hacen con el cliente server usando la publishable key y cookies, las politicas RLS de Supabase deberian gobernar que puede leer/escribir cada usuario. Esto es correcto como enfoque, siempre que las policies en Supabase esten completas.

## Modularidad y legibilidad

### Puntos fuertes

- Separacion razonable entre vista (`app/page.tsx`), estado (`useInventory`), cliente HTTP (`lib/api.ts`) y acceso a datos (`database/items.ts`).
- Los tipos principales estan centralizados en `types/index.ts`.
- `databaseFields` reduce duplicacion entre tabla y modal.
- El filtro de busqueda es simple, local y rapido para datasets pequenos.
- El badge de stock encapsula reglas visuales y reutiliza helpers de `lib/utils.ts`.
- El uso de Supabase SSR esta alineado con App Router y cookies.

### Puntos debiles

- Hay comentarios extensos y varios con mojibake/encoding roto, lo que reduce legibilidad.
- Persisten restos del starter: tutoriales, deploy button, pagina protected, instruments, textos en ingles y componentes no usados.
- Algunas abstracciones estan a medio camino: `contentNormalizer` centraliza campos, pero usa `type: 0 | 1 | 2 | 3` en lugar de nombres semanticos.
- `tipo_id` se usa como texto de tipo, no como id, lo que puede confundir API, DB y UI.
- `ProductModalFields` renderiza todos los inputs como texto; existencia y precios deberian ser numericos.
- No hay schema validation en los endpoints.
- No hay confirmacion antes de borrar.
- No hay tests automatizados.
- No hay paginacion real, busqueda server-side o estrategia para inventarios grandes.

## Problemas funcionales prioritarios

1. Implementar borrado real en Supabase.

   Agregar `deleteProduct(id)` en `database/items.ts` y llamarlo desde `DELETE /api/products/[id]`.

2. Corregir `createProduct()`.

   Si se usa `.single()`, retornar `product` y no `product[0]`.

3. Normalizar tipos numericos.

   Convertir `existencia`, `precio_proveedor` y `precio_publico` a numeros antes de enviar a la API. Idealmente usar `type="number"` y validacion.

4. Aclarar el modelo de `tipo`.

   Separar `tipo_id` real de una propiedad visible como `tipo_nombre` o `tipo`.

5. Ajustar busqueda al requerimiento exacto.

   Si la prioridad `nombre -> modelo -> tipo` importa, ordenar resultados por prioridad de coincidencia. Si solo importa encontrar por esos campos, quitar `medida` de `searchFields` o confirmar que tambien debe buscarse.

6. Proteger la ruta principal.

   Si `/` es el inventario de produccion, no deberia estar excluida del proxy de autenticacion.

## Recomendaciones de limpieza

- Eliminar o aislar archivos del starter que no formen parte del producto final: tutoriales, deploy, instruments y textos de ejemplo.
- Cambiar comentarios decorativos por comentarios cortos y utiles.
- Corregir encoding de archivos con caracteres rotos.
- Reemplazar `databaseFields.type` numerico por una union legible, por ejemplo:

```ts
type FieldKind = "text" | "primary" | "currency" | "stock";
```

- Mover reglas de campos editables a una definicion tipada que incluya input type, label, formatter y parser.
- Agregar validacion con un schema compartido para create/update.
- Agregar estados UX para guardado fallido y confirmacion de delete.
- Agregar pruebas unitarias para `useInventory`, transformacion de productos y route handlers criticos.

## Notas de diseno UI

La UI actual es sobria y adecuada para una herramienta operativa: tabla, busqueda, boton de alta y modal. Esto encaja bien con un gestor de inventario que sera usado de forma repetida.

Areas de mejora:

- La barra de busqueda tiene ancho fijo (`w-52`), puede sentirse limitada en pantallas amplias.
- Las acciones de editar/borrar usan texto; se podrian reforzar con iconos y tooltips.
- El modal tiene ancho maximo pequeno; si se agregan mas campos como proveedor, categoria o compatibilidades, convendra reorganizarlo.
- No hay filtros por stock bajo, sin existencia o tipo de producto.

## Resumen tecnico

El proyecto ya tiene una arquitectura entendible y modular para un inventario pequeno/mediano. La busqueda en tiempo real existe y esta del lado del cliente. La conexion a Supabase tambien esta encaminada, especialmente para lectura y actualizacion.

Antes de considerarlo listo para produccion, hay que cerrar tres puntos: que crear y borrar persistan correctamente, que los tipos de datos del formulario coincidan con la base de datos, y que la proteccion de rutas/RLS cubra el inventario real. Despues de eso, la siguiente mejora natural seria limpiar restos del starter y fortalecer validacion, paginacion y busqueda.
