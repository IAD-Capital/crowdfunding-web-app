import { cache } from "react";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken, type SessionPayload } from "./auth";
import db from "./db";

// verifyToken() alone is stateless (used by the edge middleware, which can't
// reach Postgres), so a reset password / revoked session still passes a
// signature check. getSession() is what server components and API routes use
// to actually read the session, so it additionally confirms the token's
// tokenVersion still matches the user's current one in the DB.
//
// Wrapped in React's cache() so the several Server Components that each call
// getSession() independently on a page (layout, Header, page body...) share
// one DB lookup per request instead of one each.
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifyToken(token);
  if (!session) return null;

  const [user] = await db`SELECT token_version FROM users WHERE id = ${session.sub}`;
  if (!user || user.token_version !== session.tokenVersion) return null;

  return session;
});
