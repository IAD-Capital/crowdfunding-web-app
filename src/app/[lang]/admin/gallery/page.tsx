import db from "@/lib/db";
import GalleryView, { type GalleryDevelopment } from "@/components/admin/GalleryView";

export default async function AdminGalleryPage({ params }: { params: { lang: string } }) {
  const lang = params.lang;

  const developments = await db<{ id: number; name: string; images: string[] }[]>`
    SELECT id, name, images FROM developments ORDER BY updated_at DESC
  `;

  const unitRows = await db<{ development_id: number; images: string[] }[]>`
    SELECT development_id, images FROM units
  `;

  const unitImagesByDev = new Map<number, string[]>();
  for (const u of unitRows) {
    const list = unitImagesByDev.get(u.development_id) ?? [];
    unitImagesByDev.set(u.development_id, [...list, ...(u.images ?? [])]);
  }

  const galleryDevelopments: GalleryDevelopment[] = developments.map((d) => ({
    id: d.id,
    name: d.name,
    images: Array.from(new Set([...(d.images ?? []), ...(unitImagesByDev.get(d.id) ?? [])])),
  }));

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Galería de fotos</h1>
      <GalleryView developments={galleryDevelopments} lang={lang} />
    </div>
  );
}
