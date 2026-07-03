# Branch changes

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
