import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { LOCALES, DEFAULT_LOCALE } from "@/i18n";

const PROTECTED_SEGMENTS = ["/dashboard", "/admin", "/account", "/wallet"];

function getLocaleFromPath(pathname: string) {
  const segment = pathname.split("/")[1];
  return LOCALES.includes(segment as (typeof LOCALES)[number]) ? segment : null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next.js internals and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // If path has no valid locale prefix, redirect to the default locale
  const locale = getLocaleFromPath(pathname);
  if (!locale) {
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Strip the locale to get the plain path (e.g. /es/dashboard → /dashboard)
  const plainPath = pathname.slice(locale.length + 1) || "/";
  const isProtected = PROTECTED_SEGMENTS.some((p) => plainPath.startsWith(p));

  if (isProtected) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifyToken(token) : null;

    const isAdmin = plainPath.startsWith("/admin");
    const isWallet = plainPath.startsWith("/wallet");
    if (!session || (isAdmin && session.role !== "superadmin") || (isWallet && session.role !== "investor" && session.role !== "superadmin")) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
