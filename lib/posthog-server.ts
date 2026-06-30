import { after } from "next/server";
import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

function getPostHogClient(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

/**
 * Captura un evento del lado servidor y programa su envio para despues de que
 * la respuesta se haya mandado.
 *
 * En serverless (Vercel) la funcion puede congelarse o terminar en cuanto
 * responde, asi que un `capture()` "fire and forget" se perderia antes de que
 * salga el HTTP request. `after()` mantiene viva la invocacion hasta que el
 * envio termina. Se usa `flush()` (no `shutdown()`) para vaciar la cola sin
 * cerrar el cliente singleton, que se reutiliza entre invocaciones calientes.
 *
 * Es el unico punto de captura en servidor: asi ningun call site puede olvidar
 * el flush.
 */
export function captureServerEvent(
  event: Parameters<PostHog["capture"]>[0],
): void {
  const client = getPostHogClient();
  client.capture(event);
  after(async () => {
    await client.flush();
  });
}
