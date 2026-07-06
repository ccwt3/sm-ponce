# Branch changes

## Sesion: Fix de desbordamiento horizontal en la landing movil (6 jul 2026)

Origen: en movil (iPhone SE 375px y menores) la landing tenia scroll horizontal:
el navbar sacaba "Iniciar sesion"/"Crear cuenta", el banner superior se veia
cortado a la derecha y el cuerpo se desbordaba. Objetivo: corregir solo el
desbordamiento, sin tocar el diseno visual.

### Causa raiz

El navbar (`components/landing/site-header.tsx`) tenia la marca + los dos botones
(ambos `whitespace-nowrap`) en un `justify-between` sin `flex-wrap`. En 375px la
suma (~427px) excedia el ancho disponible (~335px), empujando el ancho del
documento mas alla del viewport. Eso generaba scroll horizontal y hacia que el
banner sticky (ancho de viewport) se viera "cortado a la derecha".

### Lo que se hizo

1. **`app/layout.tsx`**. Se agrego `overflow-x-clip` al `<body>` (contenedor
   principal). Se uso `clip` en vez de `hidden` a proposito: `overflow-x: hidden`
   fuerza `overflow-y: auto` y crea un scroll container que rompe el
   `position: sticky` del banner y del header; `clip` recorta el desbordamiento
   horizontal sin romper el sticky.

2. **`components/landing/site-header.tsx`**. El navbar paso de `justify-between`
   (sin wrap) a `flex-wrap` con `gap-x-3 gap-y-2.5`, y el grupo de botones se
   alinea a la derecha con `ml-auto` (replica el `justify-between` en desktop y
   permite que en movil los botones bajen a una segunda fila alineados a la
   derecha, ambos completos). Padding movil un poco menor (`px-4`/`px-3`) y la
   marca con `min-w-0`. Desktop queda identico.

3. **`components/landing/urgency-bar.tsx`**. Banner explicito con `w-full
   max-w-full` (ya tenia `text-center` y padding horizontal `px-4`).

4. **`components/landing/inventory-showcase.tsx`**. Se agrego `min-w-0 max-w-full`
   a la tarjeta raiz para que la tabla `min-w-[640px]` (que ya scrollea dentro de
   su `overflow-x-auto`) no expanda el grid del hero.

5. **Fix del sticky banner/header (movil).** El header usaba `sticky top-[33px]`,
   un offset fijo que asume que el banner mide 33px (cierto en desktop de 1 linea,
   falso en movil donde el banner ocupa 2-3 lineas ~105px), provocando que el
   header se solapara con el banner al hacer scroll. Solucion robusta sin adivinar
   alturas: se quitaron los `sticky` individuales de `urgency-bar.tsx`
   (`sticky top-0 z-[60]`) y `site-header.tsx` (`sticky top-[33px] z-50`), y en
   `app/page.tsx` ambos se envolvieron en un unico contenedor
   `<div className="sticky top-0 z-[60]">`. Asi banner + navbar se fijan juntos
   como bloque a cualquier altura; el header siempre queda justo debajo del banner
   sin solape. Desktop identico (ambos fijos, banner 1 linea).

Se agrego `.claude/launch.json` (config de dev server para preview local).

### Verificacion

- `pnpm lint` y `pnpm build` pasan limpios.
- Preview a 375px: `document.scrollWidth == clientWidth` (375) y
  `hasHorizontalScroll: false`. Navbar con botones en 2da fila visibles, banner
  full width sin corte. Desktop sin cambios respecto al diseno original.

[Listo omar]

## Sesion: Empty states guiados del inventario (3 jul 2026)

Origen: reemplazar el texto plano "No se encontraron productos." por dos empty
states útiles y guiados, usando iconos de `lucide-react`.

### Lo que se hizo

1. **`components/inventory/EmptyState.tsx` (nuevo)**. Dos componentes:
   - `EmptyInventoryState` (Versión A, inventario vacío): icono `Package`, título
     en negritas, subtítulo, CTA "+ Agregar primera refacción" y una tarjeta
     discreta de guía de inicio rápido con checks decorativos (no funcionales).
     El CTA recibe `onAddFirst` y se conecta al mismo `handleOpenCreate` del botón
     "Agregar" principal.
   - `EmptySearchState` (Versión B, búsqueda sin resultados): icono `SearchX`,
     título, subtítulo y botón "Limpiar búsqueda" que llama `onClearSearch`
     (`setSearch("")`).

2. **`components/inventory/InventoryDashboardClient.tsx`**. La decisión de qué
   empty state mostrar subió al dashboard, que ya tiene las señales necesarias.
   Lógica simplificada respecto a lo pedido: con 0 productos, si `isSearchMode`
   está activo se muestra Versión B (solo cuando `!isSearching`, para evitar el
   parpadeo de "Sin resultados" mientras llega la búsqueda remota); si no,
   Versión A. Se apoya en `isSearchMode`/`isSearching` derivados del texto
   normalizado en vez de inspeccionar `page=n`.

3. **`components/inventory/ProductTable.tsx`**. Se quitó el prop `emptyMessage` y
   el guard de lista vacía; ahora solo renderiza la tabla (el padre solo lo monta
   cuando hay productos). Se eliminó el import ya no usado de `inventoryState`.

Estilo consistente con la app (tokens `muted`/`border`/`foreground`, botones de
`inventoryButton`). Lint sin errores en los archivos tocados.

4. **`README.md` sincronizado**. Se documento en la doc principal todo lo que
   faltaba respecto a la codebase real:
   - Estados vacios guiados del inventario (funcionalidad, componente
     `EmptyState.tsx`, y la decision de flujo A/B basada en
     `isSearchMode`/`isSearching`).
   - `EmptyState.tsx` agregado a la responsabilidad de `components/inventory/`.
   - Rutas publicas estaticas `/terms.html` y `/privacy.html` (`public/`),
     que estaban en `publicPaths` del proxy pero faltaban en la tabla de rutas.
   - Mencion de la seccion FAQ y CTA final en `components/landing/`.
   - Nueva "decision actual" sobre como se eligen los estados vacios en cliente.
   Se verificaron los items de "Limitaciones conocidas" contra el codigo
   (`console.log` en NavbarMenu, footer `href="#"`, `/login` heredado en proxy,
   componentes `auth-button`/`logout-button`/`env-var-warning`/`theme-switcher`
   sin consumidor): siguen vigentes, no se removio nada por no estar obsoleto.

[Listo omar]

## Sesion: Google OAuth + registro sin confirmacion de email (2 jul 2026)

Origen: agregar login con Google y quitar la pantalla de confirmacion (registro
entra directo al dashboard), cuidando que las analiticas de PostHog no se
rompan. La configuracion en la consola de Supabase (Confirm email OFF, provider
Google ON, redirect URLs con `/auth/callback`) ya la hizo Omar de antemano; esta
sesion es solo codigo y documentacion.

### Lo que se hizo

1. **Ruta callback de OAuth** (`app/auth/callback/route.ts`, nueva). Equivalente
   social de `/auth/confirm`: intercambia el `code` PKCE por sesion
   (`exchangeCodeForSession`). Como el redirect saca al navegador de la app,
   ningun formulario cliente corre, asi que este es el punto server-side donde
   se registra la aceptacion de terminos (best-effort, con el popup de `/home`
   como respaldo) y se captura `user_signed_in` con `method: "google"` via
   `captureServerEvent`. Reutiliza `getSafeRedirectPath`, `getClientIp`,
   `hasAcceptedCurrentTerms`/`acceptCurrentTerms` y `captureServerEvent`.

2. **Boton de Google** (`components/google-sign-in-button.tsx`, nuevo). Dispara
   `signInWithOAuth({ provider: "google" })` con `redirectTo` a `/auth/callback`
   (conserva `?next=` cuando existe). Logo oficial en SVG inline (sin dependencia
   nueva). Muestra el aviso legal de terminos junto al boton, porque los usuarios
   de Google no ven el checkbox del registro. Se monta en login y registro.

3. **`login-form.tsx`**: `user_signed_in` ahora lleva `method: "password"`; se
   agrego el boton de Google con separador "o continua con".

4. **`sign-up-form.tsx`**: `user_signed_up` ahora lleva `method: "password"`.
   Sin confirmacion, `signUp()` ya devuelve sesion, asi que tras el registro se
   graba la aceptacion de terminos de inmediato (best-effort via
   `POST /api/terms/accept`, que ya emite `terms_accepted`) y se redirige a
   `/home` con `window.location.replace` (antes iba a `/auth/sign-up-success`).
   Se agrego el boton de Google y se quito el `useRouter` que quedo sin uso.

5. **Pantalla intermedia eliminada**: se borro `app/auth/sign-up-success/` y se
   quito `/auth/sign-up-success` de `guestOnlyPaths` en `lib/supabase/proxy.ts`.
   `app/auth/confirm/route.ts` se conserva: sigue sirviendo la recuperacion de
   contrasena (`type=recovery`).

### Notas de analitica (PostHog)

- Nuevo atributo `method` en `user_signed_in`/`user_signed_up`; el historico sin
  el es implicitamente `password`.
- `terms_accepted` sube de volumen (ahora sale del registro y del callback, no
  del popup ocasional). El funnel signup->producto mejora su conversion. Habra
  una discontinuidad respecto al historico: conviene poner una annotation en
  PostHog el dia del deploy.
- Los eventos de OAuth no se pueden validar en localhost: `instrumentation-client.ts`
  hace opt-out en `localhost`. Verificar en un deploy de preview.
- La identidad de los usuarios de Google la cubre `posthog-auth-identifier.tsx`
  (identify por email al restaurarse la sesion); no se toco.

Documentacion: se actualizo `README.md` (seccion de Autenticacion, tabla de
rutas y checklist de Supabase Auth) y `posthog-setup-report.md` (atributo
`method` y punto de captura del callback). `pnpm lint` y `pnpm build` pasan
limpios. [Listo omar]

## Sesion: Seccion FAQ en la landing (2 jul 2026)

Se agrego una seccion de preguntas frecuentes a la landing (`app/page.tsx`),
ubicada dentro de `<main>` justo antes del footer. Siguiendo la convencion de las
demas secciones, el contenido vive en datos (`lib/landing/faq-data.ts`, con la
interfaz `FaqItem` y el array `FAQS` de 4 pares pregunta/respuesta) y la
presentacion en el componente `components/landing/faq-section.tsx`. Reutiliza los
mismos tokens de estilo que el resto de la pagina (eyebrow `text-brand-text-muted`,
titulo `text-[26px]/[32px]` extrabold, filas separadas con `border-brand-border` al
estilo de `how-it-works-section`, y `bg-brand-surface` para alternar con la seccion
blanca previa). No se inventaron preguntas: solo las 4 provistas. `pnpm lint` y
`pnpm build` pasan limpios. [Listo omar]

## Sesion: Verificacion de integracion de PostHog (30 jun 2026)

Origen: ejecutar la seccion "Verify before merging" de `posthog-setup-report.md`
y aplicar sus recomendaciones. NO se hizo merge.

### Lo que se hizo

0. **Fix critico: PostHog bloqueado en paginas publicas.** El matcher del
   middleware de Supabase (`proxy.ts`) interceptaba tambien `/ingest/*` (el
   proxy de PostHog). En paginas sin sesion (landing, login, registro) el
   middleware redirigia esas peticiones a `/auth/login`, asi que PostHog recibia
   HTML en vez de JSON (`Unexpected token '<'`, "Failed to fetch remote config")
   y los eventos de auth (`user_signed_in`, `user_signed_up`) nunca llegaban ->
   funnel vacio. Solo se capturaban pageviews de `/home` (donde si hay sesion).
   Fix: se agrego `ingest` a la exclusion del matcher para que la ingesta de
   analytics no pase por auth. (Detectado al probar en localhost.)

1. **Fix del build (bloqueante).** `pnpm build` fallaba antes de compilar por un
   valor placeholder sin reemplazar en `pnpm-workspace.yaml`:
   `core-js: set this to true or false`. pnpm esperaba un booleano y eso rompia
   el chequeo de dependencias previo a `next build`. Se cambio a `core-js: false`
   (su postinstall solo imprime un banner; no necesita build). Tras el fix,
   `pnpm build` pasa limpio (TypeScript OK, 14 rutas generadas) y `pnpm lint`
   pasa sin warnings.

2. **`.env.example` creado.** No existia. Se agrego con placeholders (sin
   secretos reales) para las variables de Supabase y PostHog
   (`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`) para que
   colaboradores sepan que configurar.

3. **Identify de visitantes recurrentes.** Recomendacion del reporte: un usuario
   con sesion ya persistida en cookie quedaba con distinct ID anonimo porque
   `posthog.identify` solo se llamaba en login/registro. Se agrego
   `components/posthog-auth-identifier.tsx`, montado en `app/layout.tsx`, que
   escucha `onAuthStateChange` de Supabase e identifica al usuario por email
   (consistente con login-form y sign-up-form) al restaurarse la sesion, y hace
   `posthog.reset()` en `SIGNED_OUT`.

4. **Flush de eventos en servidor (serverless).** Las rutas API hacian
   `getPostHogClient().capture(...)` sin esperar el envio, asi que en Vercel los
   eventos podian perderse al congelarse la funcion tras responder. Se agrego el
   helper `captureServerEvent` en `lib/posthog-server.ts`, que captura y programa
   el envio con `after()` de `next/server` (mantiene viva la invocacion hasta que
   el HTTP request sale). Usa `flush()` (no `shutdown()`) para no cerrar el
   cliente singleton reutilizado. `getPostHogClient` quedo privado: ahora el
   unico punto de captura en servidor es `captureServerEvent`, asi ningun call
   site puede olvidar el flush. Migradas las 4 capturas de
   `app/api/products/route.ts`, `app/api/products/[id]/route.ts` y
   `app/api/terms/accept/route.ts`.

5. **Fix critico: distinctId inconsistente entre cliente y servidor.** Los
   eventos del cliente (login, signup) usaban `email` como distinctId, pero los
   eventos del servidor (product_created, product_updated, product_deleted,
   terms_accepted) usaban `user.id` (UUID de Supabase). PostHog los trataba como
   dos personas distintas, rompiendo funnels y cualquier analisis por usuario.
   Fix: las 4 capturas en servidor ahora usan `user.email` como distinctId,
   consistente con el cliente. El guard cambio de `if (user)` a `if (user?.email)`
   para reflejar la dependencia real. (Detectado al observar Activity en PostHog
   con dos identidades para el mismo usuario.)

### Verificado (sin cambios necesarios)

- Inicializacion cliente (`instrumentation-client.ts`) y singleton servidor
  (`lib/posthog-server.ts`): correctos y tipados.
- Captures en rutas API (`products`, `products/[id]`, `terms/accept`): usan
  `distinctId = user.id` y solo capturan con usuario autenticado. Tipan bien.
- Eventos de UI/auth (login, signup, logout, forgot/update password, busqueda y
  apertura de modal de inventario): presentes y compilando.

### Pendientes / recomendaciones (no aplicadas, requieren decision)

- **Suite de tests:** el proyecto no tiene tests configurados, asi que el punto
  "Run the test suite" del reporte no aplica por ahora.
- **Source maps en CI:** no hay pipeline de CI (`.github/` no existe); el deploy
  es Vercel. Para de-minificar stack traces en PostHog Error Tracking habria que
  agregar el upload de source maps (`posthog-cli sourcemap`) al build de Vercel.

[Listo omar]
