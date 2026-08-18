import { Resend } from "resend";

const FROM = process.env.RESEND_MAIL_FROM ?? "iadcapital.app@gmail.com";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY is not set — skipping email send:", opts.subject);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) console.error("Failed to send email:", error);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

export function getAppUrl(): string {
  const configured = process.env.RESEND_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
