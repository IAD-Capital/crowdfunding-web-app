import db from "@/lib/db";
import GalleryView, { type GalleryDevelopment } from "@/components/admin/GalleryView";

export default async function AdminGalleryPage({ params }: { params: { lang: string } }) {
  const lang = params.lang;

  const mediaRows = await db<{
    id: number;
    url: string;
    alt_text: string | null;
    credit: string | null;
    uploaded_at: string;
    development_id: number;
    development_name: string;
  }[]>`
    SELECT m.id, m.url, m.alt_text, m.credit, m.uploaded_at,
           d.id AS development_id, d.name AS development_name
    FROM media m
    JOIN developments d ON d.id = m.development_id
    ORDER BY d.name ASC, m.uploaded_at DESC
  `;

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
