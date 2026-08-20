import nodemailer from "nodemailer";

const FROM = process.env.MAIL_USER ?? "iadcapital.app@gmail.com";

// Requires MAIL_USER (the sending Gmail/Workspace address) and
// MAIL_PASSWORD (a 16-character App Password, not the account password —
// generate one at https://myaccount.google.com/apppasswords, requires 2FA enabled).
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASSWORD;
  if (!user || !pass) return null;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string }) {
  const t = getTransporter();
  if (!t) {
    console.warn("MAIL_USER/MAIL_PASSWORD is not set — skipping email send:", opts.subject);
    return;
  }

  try {
    await t.sendMail({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

export function getAppUrl(): string {
  const configured = process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
