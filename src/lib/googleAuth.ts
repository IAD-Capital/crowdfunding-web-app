import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export type GoogleProfile = {
  googleId: string;
  email: string;
  fullName: string;
  avatar: string | null;
};

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile | null> {
  if (!GOOGLE_CLIENT_ID) return null;

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) return null;

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      fullName: payload.name ?? payload.email,
      avatar: payload.picture ?? null,
    };
  } catch {
    return null;
  }
}
