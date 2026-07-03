# Branch changes

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
