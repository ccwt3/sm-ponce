# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Motorefacciones, a Next.js 15 App Router inventory management application for motorcycle parts.

**New files created:**
- `instrumentation-client.ts` — client-side PostHog initialization using the recommended Next.js 15.3+ pattern. Enables autocapture, session replay, and exception tracking automatically.
- `lib/posthog-server.ts` — singleton server-side PostHog client (posthog-node) for capturing events from API routes.

**Files modified:**
- `next.config.ts` — added reverse proxy rewrites routing `/ingest/*` to PostHog, plus `skipTrailingSlashRedirect: true`.
- `components/login-form.tsx` — identifies users on successful login; captures `user_signed_in`; captures exceptions on auth errors.
- `components/sign-up-form.tsx` — identifies users on successful sign-up; captures `user_signed_up`; captures exceptions on sign-up errors.
- `hooks/useLogout.ts` — captures `user_signed_out` and calls `posthog.reset()` before redirecting.
- `components/forgot-password-form.tsx` — captures `password_reset_requested` on success; captures exceptions on errors.
- `components/update-password-form.tsx` — captures `password_updated` on success; captures exceptions on errors.
- `components/inventory/InventoryDashboardClient.tsx` — captures `inventory_searched` (debounced, 600ms) on search input; captures `product_create_modal_opened` when user clicks "Agregar".
- `app/api/products/route.ts` — server-side capture of `product_created` (POST) with product metadata.
- `app/api/products/[id]/route.ts` — server-side capture of `product_updated` (PUT) and `product_deleted` (DELETE) with the product ID and authenticated user ID.
- `app/api/terms/accept/route.ts` — server-side capture of `terms_accepted` with the authenticated user ID and email.

**Environment variables set in `.env.local`:**
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
- `NEXT_PUBLIC_POSTHOG_HOST`

---

## Events tracked

| Event name | Description | File |
|---|---|---|
| `user_signed_in` | User successfully authenticates with email and password. | `components/login-form.tsx` |
| `user_signed_up` | User completes the registration form and creates a new account. | `components/sign-up-form.tsx` |
| `user_signed_out` | User signs out of their session. | `hooks/useLogout.ts` |
| `password_reset_requested` | User requests a password reset email. | `components/forgot-password-form.tsx` |
| `password_updated` | User successfully updates their password via the reset flow. | `components/update-password-form.tsx` |
| `inventory_searched` | User submits a search query in the inventory dashboard. | `components/inventory/InventoryDashboardClient.tsx` |
| `product_create_modal_opened` | User opens the modal to add a new product to inventory. | `components/inventory/InventoryDashboardClient.tsx` |
| `product_created` | A new product is successfully created in the inventory via the API. | `app/api/products/route.ts` |
| `product_updated` | An existing product is successfully updated in the inventory via the API. | `app/api/products/[id]/route.ts` |
| `product_deleted` | A product is successfully removed from the inventory via the API. | `app/api/products/[id]/route.ts` |
| `terms_accepted` | User accepts the terms of service via the acceptance API endpoint. | `app/api/terms/accept/route.ts` |

---

## Actualización — Google OAuth y registro sin confirmación (2 jul 2026)

- Se agregó login con Google. Como el flujo OAuth es un redirect completo, el
  código de captura de los formularios no corre para esos usuarios; el evento
  `user_signed_in` (y `terms_accepted` en el primer ingreso) ahora también se
  capturan server-side en `app/auth/callback/route.ts` vía `captureServerEvent`.
- `user_signed_in` y `user_signed_up` ahora incluyen la propiedad
  `method: "password" | "google"` para segmentar por método de autenticación.
  Los eventos históricos sin esta propiedad son implícitamente `password`.
- Se desactivó la confirmación por email: el registro con contraseña entra
  directo a `/home` y graba la aceptación de términos de inmediato vía
  `POST /api/terms/accept` (antes se grababa en `/auth/confirm`, que ya no corre
  para el registro). Esto **aumenta** el volumen de `terms_accepted` y mejora la
  conversión del funnel signup→producto: esperar una discontinuidad respecto al
  histórico y anotarla en PostHog.
- La identidad de los usuarios de Google la resuelve
  `components/posthog-auth-identifier.tsx` (identify por email al restaurarse la
  sesión), sin cambios.

---

## Next steps

We've built some insights and a dashboard to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard:** [Analytics basics (wizard)](https://us.posthog.com/project/492375/dashboard/1780811)
- **Insight:** [User sign-ins and sign-ups](https://us.posthog.com/project/492375/insights/1Tu8X1yy)
- **Insight:** [Product inventory activity](https://us.posthog.com/project/492375/insights/GnB4i2lt)
- **Insight:** [Sign-up to first product funnel](https://us.posthog.com/project/492375/insights/wqowlUCy)
- **Insight:** [Inventory search volume](https://us.posthog.com/project/492375/insights/NkRW79HY)
- **Insight:** [Active users (WAU / DAU)](https://us.posthog.com/project/492375/insights/4t5kjMGF)

---

## Verify before merging

- [ ] Run a full production build (`pnpm build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any onboarding/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify in PostHog Error Tracking.
- [ ] Confirm the returning-visitor path also calls `identify` — currently `posthog.identify()` is only called on fresh login/signup. Returning users who are already logged in (session persisted via Supabase cookie) will be on anonymous distinct IDs until they log in again. Consider calling `identify` after the Supabase session is restored on the client.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
