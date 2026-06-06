# Branch_changes

## Alcance

Este documento resume los cambios de la branch `backend` que no existen en
`main`, mas los cambios locales actuales de auditoria, cleanup y refactor de
`use client`.

Base de comparacion:

- Branch actual: `backend`
- Base: `main`
- Commits exclusivos de la branch:
  - `2a743` added join to the database and now it renders information
  - `e8f14` Added update and fixed the problematic of what columns sends the client to the server
  - `e980f` now you can add items and it displays in the frontend
  - `50e86` Added the dropdown menu of types of products for the create form

## Resumen Ejecutivo

La branch `backend` mueve el inventario desde una UI con datos parcialmente
mockeados hacia una integracion real con Supabase a traves de route handlers de
Next.js. Agrega lectura con join hacia la tabla `tipo`, creacion de productos,
actualizacion por id, tipado para el shape raw de Supabase y soporte de
`user_id` obtenido desde la sesion.

El refactor actual de `use client` reduce el costo de hidratacion de la ruta
principal: `app/page.tsx` deja de ser Client Component y pasa a ser Server
Component. La interactividad queda aislada en un island cliente dedicado al
dashboard de inventario.

## Cambios de la Branch Contra Main

### Backend, API y Base de Datos

- `database/items.ts`
  - Agrega query real a Supabase sobre la tabla `producto`.
  - Agrega join con `tipo (tipo_de_producto)` para resolver el nombre del tipo.
  - Agrega paginacion inicial con `range`.
  - Agrega `getProductById`.
  - Agrega `createProduct`.
  - Agrega `updateProduct`.

- `app/api/products/route.ts`
  - `GET /api/products` usa `itemsDatabase.getAllProducts`.
  - Normaliza `tipo.tipo_de_producto` hacia `tipo_id`.
  - `POST /api/products` crea el producto en Supabase.
  - Obtiene `user_id` del usuario actual antes de insertar.

- `app/api/products/[id]/route.ts`
  - `GET /api/products/:id` consulta Supabase por id.
  - `PUT /api/products/:id` actualiza Supabase por id.
  - Ajusta `params` como `Promise<{ id: string }>` para el modelo actual de
    Next.
  - `DELETE` conserva la respuesta `{ id }`, pero aun no ejecuta delete real en
    Supabase.

- `lib/server-utils.ts`
  - Agrega `getCurrentUserId`.
  - Centraliza la lectura del usuario autenticado desde el cliente server de
    Supabase.

### Tipos y Normalizacion

- `types/index.ts`
  - Agrega `RawProduct` para representar el shape real que llega de Supabase.
  - Cambia el modelo de producto visible en frontend de `tipo` a `tipo_id`.
  - Agrega `user_id` opcional a `Product`.
  - Ajusta `SortField` para usar `tipo_id`.

- `lib/contentNormalizer.ts`
  - Cambia el campo renderizado de tipo desde `tipo` hacia `tipo_id`.

- `components/inventory/ProductModal.tsx`
  - Ajusta el formulario para enviar `tipo_id` en vez de `tipo`.

- `hooks/useInventory.ts`
  - Ajusta la busqueda local para incluir `tipo_id`.

### Frontend y Layout

- `app/layout.tsx`
  - Elimina la dependencia directa de `next/font/google`.
  - Usa `font-sans` como clase del body.

- `components/inventory/ProductModalFields.tsx`
  - Simplifica el input removiendo placeholder fijo.

- `README.md`
  - Amplia la documentacion del proyecto y del flujo actual.

- `Branch_Status.md`
  - Agrega una auditoria previa del estado de la branch.

## Auditoria Exclusiva del Commit `50e86`

Comparacion auditada: `840e2..50e86`. Esta seccion evalua solo lo agregado o
modificado por el commit `50e86`, sin mezclar la auditoria con cambios previos.

### Resumen de Calidad

El commit resuelve una necesidad real de UX: el usuario ya no tiene que conocer
el valor tecnico de `tipo_id` para crear un producto. La separacion general por
capas es buena: hay una ruta API para tipos, un modulo de base de datos, un hook
cliente, un combobox reutilizable y el formulario consume esa pieza sin mover
toda la logica al modal. Esa modularidad es razonable y no se siente
sobredisenada para el tamano actual de la feature.

El punto debil es robustez. El flujo funciona en el camino feliz, pero varias
partes dependen de convenciones implicitas: `tipo_id` viaja como nombre visible
en la UI y luego se traduce a UUID en el backend, la creacion de tipos nuevos no
se espera antes de seleccionarlos, y el servidor no valida suficientemente el
payload. La conclusion es que el commit esta bien encaminado, pero todavia se ve
como una implementacion funcional inicial, no como una version pulida.

### Hallazgos Principales

- **Robustez media-alta: creacion de tipo nuevo con condicion de carrera.**
  En `components/inventory/TypeDropdownMenu.tsx`, `addNewType` llama
  `handleAddType(...)` y luego `refetch()` sin `await`. Despues selecciona el
  texto nuevo y cierra el popover. Si el POST del tipo tarda o falla, el
  formulario puede quedar apuntando a un tipo que aun no existe, y `POST
  /api/products` puede fallar al resolverlo. Tambien se pierde el error porque
  `TypeCombobox` no consume el estado `error` del hook.

- **Contrato de datos confuso: `tipo_id` a veces es nombre y a veces UUID.**
  `ProductModalFields` envia el nombre visible del tipo por `tipo_id`, y
  `app/api/products/route.ts` lo traduce a UUID antes de insertar. El flujo de
  creacion queda resuelto, pero el nombre del campo contradice su contenido y
  aumenta la carga mental de mantenimiento. Ademas, el modal tambien se usa en
  edicion, pero `PUT /api/products/:id` no hace la misma traduccion, por lo que
  cambiar el tipo al editar puede terminar enviando un nombre a una columna que
  espera un id real.

- **Manejo de errores del backend mejorable.** `getTypeOfProductId` usa
  `.single()` y lanza error si no encuentra el tipo. Por eso el `if (!typeId)`
  en `app/api/products/route.ts` queda practicamente inalcanzable para el caso
  "no encontrado"; la respuesta termina siendo 500 en vez de 400. Para esta
  intencion conviene `maybeSingle()` o una funcion que retorne `ProductType |
  null`.

- **Validacion insuficiente en `POST /api/product-types`.** La ruta acepta
  cualquier JSON y lo inserta como `tipo_de_producto`. Falta validar que sea
  string, hacer `trim`, rechazar valores vacios y manejar duplicados desde el
  servidor. La UI evita duplicados por comparacion case-insensitive, pero esa
  proteccion no cubre requests directos ni carreras entre usuarios.

- **El combobox deberia ser controlado por props.** `TypeCombobox` mantiene su
  propio `value` interno y solo expone `handleChange`. Eso basta para crear, pero
  no refleja el valor inicial al editar un producto. Un contrato `value` /
  `onValueChange` haria mas claro el componente y evitaria que el modal muestre
  "Selecciona un tipo" aunque `form.tipo_id` ya tenga valor.

- **Consistencia visual y dependencias.** Los nuevos componentes `command`,
  `dialog` y `popover` usan tokens estilo shadcn (`bg-popover`,
  `text-muted-foreground`, `bg-primary`, etc.). El `tailwind.config.ts` apunta a
  CSS variables como `--popover` y `--primary`, pero `app/globals.css` no define
  esas variables. El build compila, pero el resultado visual puede quedar
  inconsistente o depender de propiedades CSS invalidas. Tambien se agrego el
  paquete monolitico `radix-ui` aunque el proyecto ya usa paquetes Radix
  especificos; no es grave, pero hace mas ruidoso el lockfile y menos clara la
  estrategia de dependencias.

- **Higiene de codigo pendiente.** El commit deja un `console.log` en
  `ProductModal.tsx`, un comentario `//todo`, espacios finales en dos archivos y
  errores de lint por comillas sin escapar en `TypeDropdownMenu.tsx`. Tambien se
  suma el warning ya conocido de export default anonimo, ahora repetido en
  `database/productTypes.ts`.

### Modularidad y Mantenibilidad

Lo mas valioso del commit es que no mete toda la logica de tipos dentro de
`ProductModal`. La feature queda repartida en piezas con responsabilidades
entendibles:

- `database/productTypes.ts`: acceso a Supabase para la tabla `tipo`.
- `app/api/product-types/route.ts`: boundary HTTP para listar y crear tipos.
- `hooks/useProductTypes.ts`: estado cliente para consumir la API.
- `components/inventory/TypeDropdownMenu.tsx`: interaccion del usuario.
- `ProductModalFields`: integracion puntual del campo `tipo_id`.

Esa division es sana. La mejora recomendada no es crear mas abstracciones, sino
endurecer los contratos existentes: separar DTOs de UI y DB, hacer el combobox
controlado, devolver errores distinguibles desde la capa de datos y validar los
payloads en route handlers.

### Verificacion Ejecutada

- `npm.cmd run build`: exitoso.
- `.\node_modules\.bin\eslint.cmd app components hooks lib database types`:
  falla por `react/no-unescaped-entities` en
  `components/inventory/TypeDropdownMenu.tsx`.
- `git diff --check 50e86^ 50e86`: falla por trailing whitespace en
  `app/api/product-types/route.ts` y `lib/api.ts`.

### Prioridad Recomendada

Antes de seguir ampliando el formulario, conviene cerrar tres puntos: esperar y
manejar errores al crear tipos desde el combobox, normalizar el contrato de
`tipo_id` vs nombre visible, y agregar validacion server-side en
`POST /api/product-types`. Con eso la feature queda mucho mas mantenible sin
meter abstraccion innecesaria.

## Cambios Locales Actuales: `codex cleanup`

Estos cambios se hicieron despues de la auditoria del commit `50e86` y estan
pensados para un commit manual separado: `codex cleanup`.

Alcance aplicado:

- Se corrigio la asincronia del combobox de tipos.
- Se mantuvo el contrato UX de `tipo_id` como nombre visible dentro del
  formulario, pero el backend lo traduce a id real antes de persistir.
- Se mantuvo compatibilidad con el listado actual, que sigue mostrando el nombre
  visible del tipo en la columna `tipo_id`.
- Se mejoro el manejo de "tipo no encontrado" en creacion y actualizacion.
- Se limpio higiene de codigo: `console.log`, `//todo`, comillas de lint,
  whitespace y export default anonimo nuevo.

Alcance excluido por decision:

- No se agrego validacion fuerte en `POST /api/product-types`.
- No se tocaron tokens visuales, dependencias ni consistencia visual de shadcn /
  Radix.

### Backend y API

- `database/productTypes.ts`
  - Renombra la clase interna a `ProductTypesDatabase`.
  - Deja de exportar una instancia anonima.
  - Reemplaza la busqueda rigida por nombre con `getTypeOfProduct`.
  - `getTypeOfProduct` acepta id real o nombre visible.
  - Usa `maybeSingle()` para que "no encontrado" pueda regresar `null` en vez de
    lanzar error.
  - `getAllTypesOfProducts` devuelve arreglo vacio si Supabase no entrega data.

- `app/api/products/route.ts`
  - `POST /api/products` resuelve `body.tipo_id` contra la tabla `tipo`.
  - Guarda en Supabase el UUID real en `tipo_id`.
  - Devuelve al frontend el nombre visible del tipo para mantener estable la
    tabla actual.
  - Si el tipo no existe, responde `400` con `Tipo de producto no encontrado`.

- `app/api/products/[id]/route.ts`
  - `GET /api/products/:id` normaliza la respuesta para exponer el nombre
    visible del tipo.
  - `PUT /api/products/:id` ahora traduce el tipo recibido a UUID antes de
    actualizar.
  - Si se intenta actualizar con un tipo inexistente, responde `400`.
  - Elimina logs temporales y comentarios guia que ya no aportaban.

- `app/api/product-types/route.ts`
  - Solo cambia formato del import y trailing whitespace.
  - La validacion del payload queda pendiente para otro commit, por instruccion.

### Frontend y Hook

- `components/inventory/TypeDropdownMenu.tsx`
  - `TypeCombobox` pasa a ser controlado por props `value` y `onValueChange`.
  - Muestra y emite el nombre visible del tipo seleccionado para preservar una
    UX legible.
  - Al agregar un tipo nuevo, espera el POST antes de seleccionar y cerrar.
  - Reutiliza un tipo existente si el texto buscado ya existe.
  - Muestra estado de error del hook dentro del popover.
  - Corrige el error de lint por comillas sin escapar.

- `hooks/useProductTypes.ts`
  - `handleAddType` ahora recibe el nombre del tipo y devuelve el tipo creado.
  - Expone `creating` para deshabilitar el boton mientras se crea un tipo.
  - Propaga errores al combobox y evita duplicados locales por id.
  - `refetch` devuelve la lista obtenida.

- `components/inventory/ProductModalFields.tsx`
  - Conecta el campo `tipo_id` al combobox controlado.
  - Remueve el `//todo` local.

- `components/inventory/ProductModal.tsx`
  - Remueve el `console.log` de creacion.

- `lib/api.ts`
  - Solo limpia trailing whitespace.

### Estado Actual de la Feature

La feature de crear producto queda en estado funcional mas robusto:

1. El usuario abre el modal de creacion.
2. El campo `Tipo` carga opciones desde `/api/product-types`.
3. El usuario selecciona un tipo existente o escribe uno nuevo.
4. Si crea un tipo nuevo, la UI espera a que el backend devuelva el registro.
5. El formulario conserva el nombre visible del tipo.
6. La API traduce ese nombre al UUID real antes de guardar en Supabase.
7. La respuesta vuelve normalizada con el nombre visible para que la tabla siga
   mostrando una etiqueta entendible.

La actualizacion de productos tambien queda mas alineada con la creacion:

1. Si el usuario cambia el tipo en edicion, el backend lo resuelve contra
   `tipo`.
2. Se actualiza Supabase con el id real.
3. La respuesta vuelve con nombre visible para la UI.

### Estado Tecnico Actual

- Modularidad: mejorada. El dropdown, el hook, la API y la capa de Supabase
  siguen separados por responsabilidad.
- Legibilidad: mejorada. `TypeCombobox` tiene un contrato mas claro y
  `database/productTypes.ts` expresa mejor la intencion.
- Robustez: mejorada. Ya no se selecciona un tipo nuevo antes de que exista en
  backend.
- Compatibilidad: mantenida. La UI y el formulario muestran nombres visibles,
  mientras el guardado usa UUIDs reales dentro del backend.
- Riesgo residual: el modelo `Product.tipo_id` todavia mezcla nombre visible en
  UI con id real en persistencia. El cleanup lo contiene en la API, pero una
  separacion futura `tipo_id` / `tipo_nombre` seria mas clara.

### Verificacion del Cleanup

Comandos ejecutados:

```bash
npm.cmd run build
```

Resultado: build exitoso.

```bash
.\node_modules\.bin\eslint.cmd app components hooks lib database types
```

Resultado: sin errores. Queda un warning preexistente en `database/items.ts`
por `import/no-anonymous-default-export`.

```bash
git diff --check
```

Resultado: sin errores de whitespace. Git solo reporta avisos de conversion
LF/CRLF en Windows.

## Cambios Locales Actuales: Refactor de `use client`

Estos cambios forman parte del refactor actual y todavia no estan committeados.

### Archivos Nuevos

- `lib/products.server.ts`
  - Nuevo modulo server-only.
  - Agrega `normalizeProduct`.
  - Agrega `getProductsForDashboard`.
  - Evita duplicar la transformacion `RawProduct -> Product` entre pagina y API.

- `components/inventory/InventoryDashboardClient.tsx`
  - Nuevo island cliente del dashboard.
  - Contiene busqueda instantanea, boton Agregar, tabla, modal y conexion con
    `useInventory`.

- `components/layout/NavbarMenu.tsx`
  - Nuevo island cliente para el dropdown del navbar.
  - Mantiene `useState`, `useRef`, `useEffect`, click outside y animacion del
    menu sin convertir todo el navbar en cliente.

### Archivos Modificados

- `app/page.tsx`
  - Remueve `"use client"`.
  - Convierte la pagina principal en Server Component.
  - Hace el fetch inicial en servidor.
  - Usa `Suspense` para cumplir con Cache Components / Partial Prerendering de
    Next 16.
  - Renderiza `Navbar` y `Footer` como estructura server-rendered.
  - Entrega `initialProducts` e `initialError` al island cliente.

- `hooks/useInventory.ts`
  - Mantiene `"use client"` porque contiene estado React e interaccion.
  - Ahora acepta `initialProducts` e `initialError`.
  - Evita el fetch inicial por `useEffect` cuando los productos ya vienen del
    servidor.
  - Mantiene `refetch` para usos posteriores.
  - Mantiene busqueda instantanea con `useMemo`.
  - Mantiene optimistic updates en crear, actualizar y borrar.
  - En delete, guarda snapshot previo y revierte localmente si falla la API.

- `components/layout/Navbar.tsx`
  - Remueve `"use client"`.
  - Queda como Server Component presentacional.
  - Delega solo el menu interactivo a `NavbarMenu`.

- `components/inventory/ProductTable.tsx`
  - Remueve `"use client"`.
  - Sigue recibiendo callbacks porque se renderiza dentro de
    `InventoryDashboardClient`.

- `components/inventory/ProductModal.tsx`
  - Remueve `"use client"` directo.
  - Sigue siendo parte del grafo cliente al ser importado por el island cliente.
  - Limpia el mapeo de `Product` a `CreateProductInput`.
  - Remueve variables no usadas y la clase `inputClass` duplicada.

- `app/api/products/route.ts`
  - Reutiliza `getProductsForDashboard` para compartir normalizacion con la
    pagina server.
  - Mantiene `POST` con `user_id`.

## Antes del Refactor de `use client`

### Estado

- `app/page.tsx` era Client Component.
- `useInventory` vivia directamente en la pagina.
- El estado de productos, busqueda, loading, error y modal se inicializaba en el
  navegador.
- La pagina arrancaba con `loading = true`.
- Los productos se pedian desde el cliente despues de hidratar mediante
  `useEffect`.

### Flujo

1. El navegador descargaba la pagina y el bundle cliente de la ruta.
2. React hidrataba `page.tsx`.
3. `useInventory` ejecutaba `useEffect`.
4. El cliente llamaba `GET /api/products`.
5. La API consultaba Supabase y devolvia productos.
6. La UI renderizaba tabla, busqueda y modal.
7. CRUD funcionaba por fetch hacia `/api/products`.

### Arquitectura

- Boundary cliente demasiado alto: `app/page.tsx`.
- `Navbar`, `Footer`, tabla, modal y acciones quedaban bajo el grafo cliente de
  la pagina.
- Fetch inicial dependia del navegador.
- Mayor JavaScript enviado para la ruta principal.
- Normalizacion de productos estaba duplicada entre capas.

## Despues del Refactor de `use client`

### Estado

- `app/page.tsx` es Server Component.
- El fetch inicial ocurre en servidor.
- `InventoryDashboardClient` recibe `initialProducts`.
- El estado interactivo queda limitado al dashboard:
  - `products`
  - `search`
  - `loading`
  - `error`
  - `modal`
- `NavbarMenu` tiene su propio estado aislado para el dropdown.

### Flujo

1. Next renderiza `app/page.tsx` en servidor.
2. `InventoryDashboardServer` obtiene productos con `getProductsForDashboard`.
3. Los productos normalizados pasan como props serializables al island cliente.
4. El cliente hidrata solo `InventoryDashboardClient` y `NavbarMenu`.
5. La busqueda filtra instantaneamente en memoria.
6. Agregar, editar y borrar llaman a la API.
7. La UI se actualiza con optimistic updates sin perder responsividad.

### Arquitectura

- Boundary server:
  - `app/page.tsx`
  - `Navbar`
  - `Footer`
  - `lib/products.server.ts`
  - `database/items.ts`
  - route handlers de `app/api/products`

- Boundary cliente:
  - `InventoryDashboardClient`
  - `useInventory`
  - `NavbarMenu`
  - formularios/auth existentes que ya eran cliente por interaccion propia

- Los componentes `ProductTable` y `ProductModal` ya no declaran `"use client"`
  directamente, aunque siguen funcionando dentro del island cliente.

## Interactividad Preservada

- Busqueda instantanea.
- Estado del modal.
- Inputs del formulario.
- Botones Agregar, Editar y Borrar.
- Optimistic updates.
- Animacion del modal (`animate-modal-in`).
- Animacion del dropdown (`animate-fade-in`).
- Cierre del dropdown por click outside.

## Resultado Arquitectonico

El acoplamiento de la ruta principal con `"use client"` baja de un modelo de
pagina completa hidratada a un modelo de islands:

- Antes: pagina completa como cliente.
- Despues: pagina server con islands cliente solo donde existe interaccion.

Esto reduce el JavaScript necesario para la primera carga, permite fetch inicial
server-side y conserva el comportamiento interactivo del dashboard.

## Verificacion

Comandos ejecutados:

```bash
npm.cmd run build
```

Resultado: build exitoso.

```bash
.\node_modules\.bin\eslint.cmd app components hooks lib database types
```

Resultado: sin errores. Queda un warning preexistente en `database/items.ts`
por `import/no-anonymous-default-export`.

## Pendientes Detectados

- `DELETE /api/products/:id` aun no elimina en Supabase; solo responde `{ id }`.
- `ProductModalFields` trata los campos numericos como texto; podrian
  beneficiarse de inputs tipados.
- `POST /api/product-types` aun necesita validacion server-side completa:
  string, `trim`, rechazo de vacios y manejo de duplicados.
- Queda pendiente revisar consistencia visual de los componentes shadcn/Radix y
  sus tokens CSS.
- `lib/utils.ts` aun conserva `filterProducts` con shape `{ tipo: string }`,
  mientras el modelo actual usa `tipo_id`.
- Existen otros `"use client"` legitimos fuera del dashboard, principalmente en
  formularios de auth, theme switcher y componentes UI de Radix.

## Auditoria Actual: Validacion de Inputs

Comparacion auditada: cambios locales actuales contra el ultimo commit
`HEAD`. Esta seccion revisa exclusivamente el sistema de validacion agregado
para inputs de productos.

### Resumen Ejecutivo

La validacion agregada mejora el camino feliz de `POST /api/products`: ahora
rechaza `nombre` vacio y valores no numericos en `existencia`,
`precio_proveedor` y `precio_publico`. Sin embargo, todavia no se puede
considerar robusta. El sistema valida parcialmente, no normaliza el payload que
se persiste, rompe el contrato parcial de `PUT`, y deja fuera campos importantes
como `modelo`, `medida` y `tipo_id`.

El build de produccion pasa, pero los checks de calidad no estan limpios:
ESLint falla por imports sin usar y `git diff --check` detecta whitespace nuevo.

### Hallazgos Principales

- **Alta: `PUT /api/products/:id` queda validado como si fuera creacion.**
  En `app/api/products/[id]/route.ts:48-50`, el body se declara como parcial
  pero luego se castea a `CreateProductInput` para pasar por
  `validateProductInput`. Como `validateProductInput` siempre revisa
  `nombre`, `existencia`, `precio_proveedor` y `precio_publico`, cualquier
  cliente que mande un update parcial valido puede recibir `400`. El modal
  actual manda el formulario completo, asi que el camino feliz de UI puede
  pasar, pero el contrato del route handler y el tipo `UpdateProductInput`
  quedan inconsistentes. Recomendacion: separar `validateCreateProductInput`
  de `validateUpdateProductInput`, o usar un schema Zod base con
  `.partial()` para updates.

- **Alta: los valores numericos se validan, pero no se normalizan antes de
  persistir.** `numericValidator` transforma a `Number` en
  `middleware/numericValidator.ts:8`, pero `validateProductInput` solo usa el
  resultado para detectar errores y luego lo descarta. En
  `app/api/products/route.ts:51-60` se persiste y se responde con `...body`.
  Como el formulario cliente envia strings, la API puede seguir guardando o
  devolviendo strings en campos tipados como number. Recomendacion: que la
  validacion retorne un payload parseado y que los route handlers usen ese
  payload validado para `createProduct`, `updateProduct` y la respuesta.

- **Media-alta: precios con decimales son rechazados.**
  `middleware/numericValidator.ts:7` usa `/^\d+$/`, por lo que `12.50` falla.
  Eso puede estar bien para `existencia`, pero es restrictivo para
  `precio_proveedor` y `precio_publico`. Recomendacion: separar reglas por
  campo: enteros no negativos para inventario y decimal no negativo para
  precios, o documentar que los precios se guardan como centavos enteros.

- **Media: cobertura de campos incompleta.** `validateProductInput` solo valida
  `nombre` y tres campos numericos. `modelo` se revisa en `POST` solo con un
  check de presencia en `app/api/products/route.ts:30`, por lo que `"   "`
  pasa; `medida` no se valida; `tipo_id` no se valida ni se trimea antes de
  buscar el tipo. Recomendacion: mover todas las reglas de producto a un schema
  unico de Zod con `trim`, errores por campo y validacion explicita de
  `tipo_id`.

- **Media: JSON o shapes invalidos pueden terminar como 500.**
  Si `req.json()` falla o si el body no es un objeto con los campos esperados,
  el `catch` general responde `500` con "Error al crear producto" o "Error al
  actualizar producto". Para errores de input, la API deberia responder `400`
  con un mensaje accionable. Recomendacion: validar primero el shape raw con
  Zod y separar errores de parseo/validacion de errores de infraestructura.

- **Media: la capa de validacion esta acoplada a HTTP.**
  `middleware/formValidator.ts` devuelve `NextResponse` directamente. Eso hace
  mas dificil reutilizar la validacion fuera de route handlers y obliga a
  testearla como infraestructura HTTP. Recomendacion: devolver un resultado
  estructurado, por ejemplo `{ success, data, errors }`, y construir el
  `NextResponse` en la ruta.

- **Media-baja: ubicacion y nombres confusos.** El directorio `middleware/`
  contiene utilidades de validacion, no middleware de Next. En un proyecto Next,
  ese nombre puede generar confusion de responsabilidad. Recomendacion:
  moverlo a `lib/validation/` o `lib/schemas/` y nombrar los archivos segun el
  dominio, por ejemplo `product.schema.ts`.

- **Baja: higiene de codigo pendiente.** En `app/api/products/route.ts:9-10`
  se importan `numericValidator` y `textValidator` pero no se usan. En
  `app/api/products/[id]/route.ts:49` hay trailing whitespace. Ademas, el import
  `{validateProductInput}` no sigue el espaciado usado en el resto del repo.

### Buenas Practicas y Modularidad

La decision de usar Zod es positiva: es una herramienta adecuada para validar
payloads en runtime. El problema es que la implementacion actual lo usa como
validadores sueltos, no como schema de producto. Eso obliga a repetir reglas,
perder el payload transformado y mezclar responsabilidades entre validacion,
route handler y tipos TypeScript.

La forma mas mantenible seria un schema base:

- `productCreateSchema`: valida todos los campos obligatorios de creacion.
- `productUpdateSchema`: deriva del schema base con `.partial()` y valida solo
  campos presentes.
- Un retorno parseado que ya tenga `number` donde el dominio espera `number`.
- Errores con nombre de campo para que la UI pueda mostrarlos con precision.

### Verificacion Ejecutada

```bash
npm.cmd run build
```

Resultado: exitoso.

```bash
npm.cmd run lint
```

Resultado: timeout despues de 120s sin entregar diagnostico final.

```bash
.\node_modules\.bin\eslint.cmd app\api\products\route.ts app\api\products\[id]\route.ts middleware\formValidator.ts middleware\numericValidator.ts middleware\textValidator.ts
```

Resultado: falla por imports sin usar en `app/api/products/route.ts`.

```bash
git diff --check HEAD
```

Resultado: falla por trailing whitespace en
`app/api/products/[id]/route.ts:49`.

### Prioridad Recomendada

Antes de considerar cerrado el sistema de validacion, conviene corregir en este
orden: separar schemas de create/update, usar el payload parseado por Zod para
persistir, diferenciar reglas numericas de existencia vs precios, completar la
validacion de `modelo`, `medida` y `tipo_id`, y limpiar los errores de lint /
whitespace. Con eso la validacion pasaria de "filtro inicial" a boundary real de
API.

## Cambios Aplicados: Robustecimiento de Validacion

Esta seccion documenta los cambios hechos despues de la auditoria anterior para
cerrar los riesgos detectados en el sistema de validacion.

### Validacion y Contrato de API

- Se reemplazaron los validadores sueltos bajo `middleware/` por schemas de
  dominio en `lib/validation/`.
- `lib/validation/products.ts` ahora expone validacion separada para:
  - creacion de productos;
  - actualizacion parcial de productos.
- `POST /api/products` valida el body crudo, rechaza JSON invalido con `400` y
  usa el payload parseado por Zod para persistir.
- `PUT /api/products/:id` ya no castea updates parciales a
  `CreateProductInput`; valida solo los campos presentes y rechaza bodies sin
  campos validos.
- Los campos numericos ahora se parsean en el boundary server:
  - `existencia` exige entero no negativo;
  - `precio_proveedor` y `precio_publico` aceptan decimales no negativos.
- `nombre` y `tipo_id` se trimean y son obligatorios.
- `modelo` y `medida` son tolerantes a vacio, `null` y ausencia, alineados con
  la nulabilidad de la base de datos.
- `POST /api/product-types` ahora valida que el tipo sea texto no vacio,
  trimea el valor y reutiliza el tipo existente si ya esta creado.

### Flujo de Datos y Normalizacion

- El formulario puede seguir enviando strings desde los inputs HTML.
- La normalizacion numerica ocurre en el servidor, justo antes de persistir,
  para no depender de coerciones implicitas de Supabase o del navegador.
- `modelo` y `medida` se tiparon como `string | null` en `Product` y
  `RawProduct`.
- El modal convierte `null` a `""` al editar, para que los inputs sigan siendo
  controlados y comodos de usar.
- El input del modal usa `?? ""` en vez de `|| ""`, por lo que el valor `0` ya
  no se renderiza como campo vacio.
- `typesDatabase.findType` ahora acepta nombre visible o UUID real, lo que
  conserva el flujo en el que la UI muestra nombres pero la base guarda ids.

### Limpieza y Buenas Practicas

- Se eliminaron imports sin usar en las rutas de productos.
- Se elimino el `console.log` temporal de `DELETE /api/products/:id`.
- Se limpio whitespace pendiente.
- `database/items.ts` ya no exporta una instancia anonima.
- `tailwind.config.ts` usa import ESM para `tailwindcss-animate`.
- `eslint.config.mjs` ignora `.next`, `node_modules` y `out`, evitando que el
  lint analice artefactos generados.
- `lib/utils.ts` actualiza `filterProducts` para usar `tipo_id` y tolerar
  `modelo` nullable.

### Verificacion Final

```bash
npm.cmd run build
```

Resultado: exitoso.

```bash
npm.cmd run lint
```

Resultado: exitoso.

```bash
git diff --check HEAD
```

Resultado: sin errores de whitespace. Git solo reporta avisos esperados de
conversion LF/CRLF en Windows.

Nota: se intento un spot-check directo de Zod con `node --input-type=module`,
pero el sandbox devolvio `EPERM` al leer un archivo dentro de `node_modules`.
No se considero bloqueante porque el build de Next y ESLint completo pasaron
correctamente.

## Auditoria de Limpieza de Codebase: app, components, database, hooks, lib y types

Fecha de revision: 2026-06-06.

Esta seccion documenta una revision estatica enfocada en limpieza, calidad,
modularidad, legibilidad y mantenibilidad. No se modifico codigo funcional en
esta auditoria; solo se registran hallazgos y recomendaciones.

### Verificacion Ejecutada

```bash
npm.cmd run lint
```

Resultado: exitoso.

```bash
npm.cmd run build
```

Resultado: exitoso.

Conclusion tecnica: no se detectaron imports rotos ni errores de compilacion.
La deuda encontrada es principalmente de limpieza, restos de starter,
contratos confusos y exports no usados. El proyecto no tiene activado
`noUnusedLocals` ni `noUnusedParameters` en `tsconfig.json`, y ESLint usa la
configuracion base de Next; por eso algunos exports o archivos sin uso pueden
pasar lint/build sin advertencias.

### Componentes o Archivos Locales Sin Referencia Directa

Cruce de imports locales dentro de `app`, `components`, `database`, `hooks`,
`lib`, `types` y `proxy.ts` marco estos archivos como no usados por el flujo
actual:

- `components/deploy-button.tsx`
- `components/hero.tsx`
- `components/tutorial/connect-supabase-steps.tsx`
- `components/tutorial/fetch-data-steps.tsx`
- `components/tutorial/sign-up-user-steps.tsx`

Archivos usados solo por esos restos:

- `components/next-logo.tsx`, usado por `components/hero.tsx`.
- `components/supabase-logo.tsx`, usado por `components/hero.tsx`.
- `components/tutorial/code-block.tsx`, usado por `fetch-data-steps.tsx`.
- `components/tutorial/tutorial-step.tsx`, usado por los pasos tutorial.

Recomendacion: si el producto ya no necesita la pantalla/tutorial del starter
Supabase, estos archivos son candidatos claros para eliminacion en una tarea de
limpieza dedicada.

### Restos del Starter Supabase/Next

- `components/deploy-button.tsx` conserva URL de Vercel hacia
  `nextjs-with-supabase`.
- `components/hero.tsx` conserva texto "Supabase and Next.js Starter Template".
- `components/tutorial/*` conserva instrucciones genericas de Supabase.
- `components/env-var-warning.tsx` sigue en ingles y esta acoplado al layout
  legacy de `/protected`.
- `components/auth-button.tsx`, `components/logout-button.tsx` y
  `components/theme-switcher.tsx` estan usados por `/protected`, pero no por el
  flujo principal de inventario.
- `app/protected/page.tsx` es una pagina diagnostica que imprime claims de la
  sesion; es util durante desarrollo, pero no parece parte del producto final.

Recomendacion: decidir si `/protected` seguira existiendo como ruta interna de
debug o si se eliminara junto con sus componentes legacy. Si se conserva,
conviene renombrarla o aislarla como herramienta de diagnostico.

### Placeholders y Codigo Temporal

- `app/instruments/page.tsx` es una ruta placeholder: "Modulo de instrumentos
  sin configurar".
- `components/layout/Footer.tsx` renderiza links `Soporte`, `Privacidad` y
  `Contacto` con `href="#"`.
- `components/layout/NavbarMenu.tsx` conserva `console.log("-> ir a
  configuracion")` en la accion de Configuracion.
- `components/layout/NavbarMenu.tsx` usa el texto `...` como trigger visual del
  menu. Funciona, pero es menos semantico que un icono de menu con estado claro.
- `components/inventory/ProductTableRows.tsx` muestra `N/A` para valores
  `null` o `undefined`; es valido, pero mezcla idioma ingles dentro de una UI
  mayormente en espanol.

Recomendacion: reemplazar placeholders por rutas reales o deshabilitarlas hasta
que exista funcionalidad. Quitar logs temporales antes de produccion.

### Utilidades y Tipos No Usados o Sobregeneralizados

- `lib/utils.ts` exporta `generateTempId()`, pero no hay referencias actuales.
- `lib/utils.ts` exporta `filterProducts()`, pero el filtro real vive dentro de
  `hooks/useInventory.ts`.
- `types/index.ts` conserva `SortField`, `SortDirection` y `TableSort`, pero no
  hay ordenamiento implementado en la UI actual.
- `lib/api.ts` exporta `getProductById()`, pero el flujo cliente actual no lo
  consume.
- `lib/products.server.ts` re-exporta `normalizeProduct`, pero el uso actual
  desde `app/page.tsx` solo necesita `getProductsForDashboard`.
- `lib/validation/products.ts` exporta `ProductInput` y `ProductUpdateInput`;
  actualmente se usan solo como tipos de retorno internos del mismo archivo.

Recomendacion: en una limpieza futura, borrar exports no usados o hacerlos
internos. Si son intencionales para features proximas, documentarlo cerca del
tipo o feature para evitar que parezcan deuda.

### Contratos de Dominio Confusos

- `Product.tipo_id` representa el nombre visible del tipo en la UI, pero en la
  base de datos `tipo_id` representa el UUID real. Este doble significado sigue
  siendo la mayor deuda de modelo.
- `ProductWriteInput` usa el shape de `ProductRow`, mientras `Product` usa el
  shape normalizado para UI. La frontera entre "row de base" y "modelo de UI"
  existe, pero no esta totalmente separada.
- `CreateProductInput` deriva de `Product` y por eso permite `user_id`
  opcional. En runtime la validacion del servidor controla el payload, pero a
  nivel TypeScript el formulario puede cargar y enviar `user_id` en edicion.
- `ProductModal.toProductForm()` conserva `user_id` al pasar un producto al
  formulario, aunque ese campo no deberia ser responsabilidad del cliente.

Recomendacion: separar explicitamente:

- `ProductRow`: shape de Supabase.
- `Product`: shape de UI.
- `CreateProductInput` / `UpdateProductInput`: payloads del cliente, sin
  `user_id`.
- `tipo_id`: UUID real.
- `tipo_nombre` o `tipo`: etiqueta visible.

### Consistencia de Idioma y Mensajes

- Hay mezcla de textos en ingles y espanol en formularios de auth:
  `Login`, `Sign up`, `Forgot your password?`, `Saving...`, etc.
- Logs internos y errores de base usan mensajes en ingles, mientras la UI y API
  responden principalmente en espanol.
- `N/A` aparece en tabla de productos aunque el resto de la UI esta en espanol.

Recomendacion: antes de UI/UX final, definir idioma unico para producto. Para
este proyecto, el espanol parece el default natural.

### Observaciones de Modularidad

- La separacion principal `app -> hooks -> lib/api -> route handlers ->
  service -> database -> Supabase` esta clara y mantenible.
- `database/items.ts` y `database/productTypes.ts` repiten el helper privado
  `getSupabaseClient()`. No es grave, pero podria consolidarse si aparecen mas
  repositorios.
- `TypeCombobox` concentra seleccion, creacion, borrado y errores de tipos. Es
  funcional, pero crece como componente de dominio y podria dividirse si se
  agregan mas acciones o permisos.
- `useProductTypes()` carga tipos por cada montaje del combobox. Hoy es
  aceptable, pero si el modal crece o se reutiliza el selector en varias vistas,
  convendria cachear o elevar ese estado.

### Riesgo Actual

No hay riesgo inmediato de build roto. Los riesgos principales son:

1. Limpieza: restos del starter pueden confundir la arquitectura real.
2. Mantenibilidad: `tipo_id` con doble significado complica cambios futuros.
3. Seguridad conceptual: los tipos de formulario permiten `user_id` aunque el
   servidor lo ignore/controla.
4. Producto: rutas placeholder y links `#` hacen que la app parezca incompleta.

### Recomendacion de Orden de Limpieza

1. Eliminar o aislar restos del starter (`hero`, `deploy-button`,
   `components/tutorial/*`, logos asociados).
2. Decidir destino de `/protected` y sus componentes legacy.
3. Quitar placeholders visibles: `/instruments`, links `#`, log de
   configuracion.
4. Separar contratos de `tipo_id`/`tipo_nombre` y payloads sin `user_id`.
5. Activar reglas o herramientas para detectar exports muertos si el equipo
   quiere mantener la codebase mas estricta.

## Cambios Aplicados: Limpieza Profunda Antes de UI/UX

Esta seccion documenta la aplicacion de la auditoria anterior. Se mantuvieron
intactos los contratos de dominio actuales relacionados con `user_id` y
`tipo_id`.

### Archivos y Restos Eliminados

- Se elimino la ruta placeholder `app/instruments/page.tsx`.
- Se eliminaron archivos sin referencia del starter:
  - `components/deploy-button.tsx`
  - `components/hero.tsx`
  - `components/next-logo.tsx`
  - `components/supabase-logo.tsx`
  - `components/tutorial/code-block.tsx`
  - `components/tutorial/connect-supabase-steps.tsx`
  - `components/tutorial/fetch-data-steps.tsx`
  - `components/tutorial/sign-up-user-steps.tsx`
  - `components/tutorial/tutorial-step.tsx`
- Se elimino `components/ui/checkbox.tsx`, cuyo unico consumidor era el
  tutorial eliminado.
- Se retiro `@radix-ui/react-checkbox` como dependencia directa. El paquete
  permanece solo como dependencia transitiva de `radix-ui`.
- Se conservaron `/protected` y todos sus componentes requeridos.
- Se conservaron los placeholders de Soporte, Privacidad, Contacto y
  Configuracion por decision de producto.

### Codigo y Tipos Sin Uso

- Se eliminaron `generateTempId()` y `filterProducts()` de `lib/utils.ts`.
- Se elimino el bloque comentado de `getProductById()` en `lib/api.ts`.
- Se eliminaron `SortField`, `SortDirection`, `TableSort` y `ModalMode` como
  tipos publicos sin consumidores.
- Los tipos auxiliares de `lib/contentNormalizer.ts` y
  `lib/validation/products.ts` ahora son internos al archivo.
- `normalizeProduct()` dejo de exportarse fuera de `lib/products.service.ts`.
- `lib/products.server.ts` ahora re-exporta solo `getProductsForDashboard`.

### Consistencia en Espanol

- Se tradujeron textos visibles de login, registro, recuperacion y cambio de
  contrasena.
- Se tradujeron `/auth/error`, `/auth/sign-up-success`, `/protected`, el
  selector de tema y componentes auxiliares de autenticacion.
- Se tradujeron mensajes internos de acceso a datos y logs de rutas de tipos.
- Se reemplazo `N/A` por `No disponible`.
- Se eliminaron o tradujeron comentarios heredados del starter que seguian en
  ingles.

### Prevencion de Nueva Deuda

- `tsconfig.json` ahora activa:
  - `noUnusedLocals`
  - `noUnusedParameters`
- El cruce final de imports locales no encontro archivos sin referencia.
- README fue actualizado para reflejar la estructura real despues de la poda.

### Verificacion Final

```bash
npm.cmd run lint
```

Resultado: exitoso.

```bash
npm.cmd run build
```

Resultado: exitoso. El mapa final ya no incluye `/instruments`.

Nota: al eliminar `/instruments`, el cache generado `.next/dev` conservo una
referencia obsoleta. Se regeneraron tipos con `next typegen` y se limpio
unicamente `.next/dev`; no se modificaron archivos fuente para ocultar el
problema.
