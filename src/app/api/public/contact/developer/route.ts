import { NextRequest, NextResponse } from "next/server";
import { sendMail, renderEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

const NOTIFY_EMAIL = "iadcapital.app@gmail.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const photos = formData.getAll("photos").filter((p): p is File => p instanceof File && p.size > 0);

  if (!fullName || !company || !email || !phone || !address || !details) {
    return NextResponse.json({ error: "Completá todos los campos obligatorios." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "El email no es válido." }, { status: 400 });
  }
  if (photos.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `Máximo ${MAX_PHOTOS} fotos.` }, { status: 400 });
  }
  for (const photo of photos) {
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes." }, { status: 400 });
    }
    if (photo.size > MAX_PHOTO_SIZE) {
      return NextResponse.json({ error: "Cada foto debe pesar menos de 5 MB." }, { status: 400 });
    }
  }

  const attachments = await Promise.all(
    photos.map(async (photo) => ({
      filename: photo.name || "foto.jpg",
      content: Buffer.from(await photo.arrayBuffer()),
      contentType: photo.type,
    }))
  );

  const result = await sendMail({
    to: NOTIFY_EMAIL,
    replyTo: email,
    subject: `Nueva propuesta de desarrolladora: ${company}`,
    html: renderEmail(`
      <p>Una desarrolladora quiere publicar una unidad en IAD Capital.</p>
      <p><strong>Contacto:</strong> ${fullName} (${email}${phone ? `, ${phone}` : ""})</p>
      <p><strong>Desarrolladora:</strong> ${company}</p>
      <p><strong>Dirección de la unidad:</strong> ${address}</p>
      <p><strong>Detalles de la unidad:</strong></p>
      <p style="white-space: pre-wrap;">${details}</p>
      ${attachments.length > 0 ? `<p>Se adjuntan ${attachments.length} foto(s).</p>` : ""}
    `),
    attachments,
  });

  if (!result.sent) {
    return NextResponse.json({ error: result.error ?? "No se pudo enviar el mensaje." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
