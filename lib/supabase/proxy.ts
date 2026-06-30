import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

const publicPathPrefixes = ["/auth"];
const publicPaths = ["/login", "/", "/terms.html", "/privacy.html"];
const guestOnlyPaths = [
  "/auth/forgot-password",
  "/auth/login",
  "/auth/sign-up",
  "/auth/sign-up-success",
  "/login",
  "/",
];

function isPublicPath(pathname: string) {
  return (
    publicPaths.includes(pathname) ||
    publicPathPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

function isGuestOnlyPath(pathname: string) {
  return guestOnlyPaths.includes(pathname);
}

export function getSafeRedirectPath(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/home";
  }

  let url: URL;

  try {
    url = new URL(path, "http://localhost");
  } catch {
    return "/";
  }

  if (isGuestOnlyPath(url.pathname)) {
    return "/";
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });

  return to;
}

function unauthenticatedResponse(
  request: NextRequest,
  supabaseResponse: NextResponse,
) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return copyResponseCookies(
      supabaseResponse,
      NextResponse.json(
        { error: "Debes iniciar sesión para continuar" },
        { status: 401 },
      ),
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  url.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return copyResponseCookies(supabaseResponse, NextResponse.redirect(url));
}

function authenticatedResponse(
  request: NextRequest,
  supabaseResponse: NextResponse,
) {
  const nextPath = getSafeRedirectPath(
    request.nextUrl.searchParams.get("next"),
  );
  const url = new URL(nextPath, request.url);

  return copyResponseCookies(supabaseResponse, NextResponse.redirect(url));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Sin variables de Supabase no es posible validar la sesion.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // El cliente debe crearse por solicitud para conservar cookies correctas.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims debe ejecutarse inmediatamente despues de crear el cliente.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (
    !user &&
    !isPublicPath(request.nextUrl.pathname)
  ) {
    return unauthenticatedResponse(request, supabaseResponse);
  }

  if (user && isGuestOnlyPath(request.nextUrl.pathname)) {
    return authenticatedResponse(request, supabaseResponse);
  }

  // Esta respuesta contiene las cookies actualizadas de la sesion.
  return supabaseResponse;
}
