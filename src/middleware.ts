import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { LOCALES, DEFAULT_LOCALE } from "@/i18n";

function getLocaleFromPath(pathname: string) {
  const segment = pathname.split("/")[1];
  return LOCALES.includes(segment as (typeof LOCALES)[number]) ? segment : null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const locale = getLocaleFromPath(pathname);
  if (!locale) {
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }

  const plainPath = pathname.slice(locale.length + 1) || "/";

  const isAdmin  = plainPath.startsWith("/admin");
  const isWallet = plainPath.startsWith("/wallet");

  if (!isAdmin && !isWallet) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  const loginUrl = (next: string) => {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  };

  // /admin → superadmin only
  if (isAdmin) {
    if (session?.role === "superadmin") return NextResponse.next();
    // investor trying to reach admin → send to wallet
    if (session?.role === "investor") {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/wallet`;
      return NextResponse.redirect(url);
    }
    return loginUrl(pathname);
  }

  // /wallet → any authenticated user
  if (isWallet) {
    if (session) return NextResponse.next();
    return loginUrl(pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
