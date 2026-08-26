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

export async function sendMail(
  opts: { to: string; subject: string; html: string }
): Promise<{ sent: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) {
    console.warn("MAIL_USER/MAIL_PASSWORD is not set — skipping email send:", opts.subject);
    return { sent: false, error: "MAIL_USER/MAIL_PASSWORD no están configurados." };
  }

  try {
    await t.sendMail({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return { sent: true };
  } catch (err) {
    console.error("Failed to send email:", err);
    return { sent: false, error: err instanceof Error ? err.message : "Error desconocido." };
  }
}

export function getAppUrl(): string {
  const configured = process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// Shared header/footer used by every outgoing email so they carry consistent branding.
export function renderEmail(bodyHtml: string): string {
  const logoUrl = `${getAppUrl()}/iad-capital-logo-email.png`;
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <div style="background-color: #f2f3f5; padding: 32px 24px; text-align: center;">
        <img src="${logoUrl}" alt="IAD Capital" width="140" style="display: inline-block; height: auto;" />
      </div>
      <div style="padding: 32px 24px; font-size: 15px; line-height: 1.6;">
        ${bodyHtml}
      </div>
      <div style="padding: 16px 24px; text-align: center; font-size: 12px; color: #888;">
        IAD Capital
      </div>
    </div>
  `;
}
