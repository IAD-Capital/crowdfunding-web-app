import db from "@/lib/db";

export type AuthBackgroundImage = { url: string; alt: string };

export async function getAuthBackgroundImages(limit = 4): Promise<AuthBackgroundImage[]> {
  const rows = await db<{ images: string[]; development_name: string }[]>`
    SELECT u.images, d.name AS development_name
    FROM units u
    JOIN developments d ON d.id = u.development_id
    WHERE u.featured = true AND d.status = 'active' AND d.visible = true
      AND u.status != 'sold' AND array_length(u.images, 1) > 0
    ORDER BY u.featured_order
    LIMIT ${limit}
  `;

  return rows
    .filter((r) => r.images?.length > 0)
    .map((r) => ({ url: r.images[0], alt: r.development_name }));
}
