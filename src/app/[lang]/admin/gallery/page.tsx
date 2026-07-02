import db from "@/lib/db";
import GalleryView, { type GalleryDevelopment } from "@/components/admin/GalleryView";

export default async function AdminGalleryPage({ params }: { params: { lang: string } }) {
  const lang = params.lang;

  type MediaRow = {
    id: number; url: string; alt_text: string | null;
    credit: string | null; uploaded_at: string;
    development_id: number; development_name: string;
  };

  let mediaRows: MediaRow[] = [];
  let migrationNeeded = false;
  try {
    mediaRows = await db<MediaRow[]>`
      SELECT m.id, m.url, m.alt_text, m.credit, m.uploaded_at,
             d.id AS development_id, d.name AS development_name
      FROM media m
      JOIN developments d ON d.id = m.development_id
      ORDER BY d.name ASC, m.uploaded_at DESC
    `;
  } catch (e: unknown) {
    if (String(e).includes("media") && String(e).includes("does not exist")) {
      migrationNeeded = true;
    } else {
      throw e;
    }
  }

  if (migrationNeeded) {
    return (
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Galería de fotos</h1>
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "1.25rem", maxWidth: 600 }}>
          <p style={{ fontWeight: 700, margin: "0 0 0.5rem", color: "#92400e" }}>Migración pendiente</p>
          <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "#78350f" }}>
            La tabla de medios no existe aún en producción. Ejecutá la migración para continuar.
          </p>
          <p style={{ fontFamily: "monospace", fontSize: "0.8rem", background: "#fef3c7", padding: "0.5rem 0.75rem", borderRadius: 6, margin: 0, color: "#451a03" }}>
            POST /api/admin/migrate?secret=MIGRATE_SECRET
          </p>
        </div>
      </div>
    );
  }

  // Group by development
  const devMap = new Map<number, GalleryDevelopment>();
  for (const r of mediaRows) {
    if (!devMap.has(r.development_id)) {
      devMap.set(r.development_id, { id: r.development_id, name: r.development_name, images: [] });
    }
    devMap.get(r.development_id)!.images.push({
      id: r.id,
      url: r.url,
      alt_text: r.alt_text,
      credit: r.credit,
      uploaded_at: r.uploaded_at,
    });
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Galería de fotos</h1>
      <GalleryView developments={Array.from(devMap.values())} lang={lang} />
    </div>
  );
}
