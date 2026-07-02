import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

// CSV columns (header row required):
// development_slug  unit_slug  covered_m2  outdoor_m2  semi_covered_m2
// total_homogeneous_m2  total_m2  price_m2  total_price  currency_price
// rooms  bedrooms  bathrooms  orientation  floor  status
//
// Required: development_slug, unit_slug, total_price

type Row = Record<string, string>;

function parseCSV(text: string): Row[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const values = splitCSVLine(line);
    const row: Row = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? "").trim(); });
    return row;
  });
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function num(v: string | undefined): number | null {
  if (!v?.trim()) return null;
  const n = Number(v.trim());
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }

  const text = await (file as File).text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "El archivo CSV está vacío o no tiene filas de datos." }, { status: 400 });
  }

  const firstRow = rows[0];
  const missing = ["development_slug", "unit_slug", "total_price"].filter((c) => !(c in firstRow));
  if (missing.length > 0) {
    return NextResponse.json({
      error: `Faltan columnas obligatorias: ${missing.join(", ")}.`,
    }, { status: 400 });
  }

  // Resolve slugs → development IDs in one query
  const slugs = Array.from(new Set(rows.map((r) => r.development_slug).filter(Boolean)));
  if (slugs.length === 0) {
    return NextResponse.json({ error: "Ninguna fila tiene development_slug." }, { status: 400 });
  }

  const devRows = await db<{ id: number; slug: string; name: string }[]>`
    SELECT id, slug, name FROM developments WHERE slug = ANY(${slugs})
  `;
  const devBySlug = new Map(devRows.map((d) => [d.slug, d]));

  const unknownSlugs = slugs.filter((s) => !devBySlug.has(s));
  if (unknownSlugs.length > 0) {
    return NextResponse.json({
      error: `Slug(s) de emprendimiento no encontrado(s): ${unknownSlugs.join(", ")}`,
    }, { status: 422 });
  }

  type InsertRow = {
    development_id: number;
    identifier: string;
    floor: number | null;
    total_m2: number | null;
    covered_m2: number | null;
    uncovered_m2: number | null;
    outdoor_m2: number | null;
    semi_covered_m2: number | null;
    total_homogeneous_m2: number | null;
    price_m2: number | null;
    rooms: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    orientation: string | null;
    price_usd: number;
    currency_price: string | null;
    status: string;
  };

  const inserts: InsertRow[] = [];
  const validStatuses = new Set(["available", "partial", "sold"]);
  const rowErrors: string[] = [];

  rows.forEach((r, i) => {
    const lineNum = i + 2;
    const dev = devBySlug.get(r.development_slug);
    if (!dev) { rowErrors.push(`Fila ${lineNum}: slug desconocido "${r.development_slug}"`); return; }
    if (!r.unit_slug?.trim()) { rowErrors.push(`Fila ${lineNum}: unit_slug vacío`); return; }
    const price = num(r.total_price);
    if (price == null || price <= 0) { rowErrors.push(`Fila ${lineNum}: total_price inválido "${r.total_price}"`); return; }
    const status = r.status?.trim() || "available";
    if (!validStatuses.has(status)) {
      rowErrors.push(`Fila ${lineNum}: status inválido "${status}" (debe ser available, partial o sold)`);
      return;
    }

    inserts.push({
      development_id: dev.id,
      identifier: r.unit_slug.trim(),
      floor: num(r.floor),
      total_m2: num(r.total_m2),
      covered_m2: num(r.covered_m2),
      uncovered_m2: num(r.outdoor_m2),       // keep uncovered_m2 mapped from outdoor_m2 for legacy
      outdoor_m2: num(r.outdoor_m2),
      semi_covered_m2: num(r.semi_covered_m2),
      total_homogeneous_m2: num(r.total_homogeneous_m2),
      price_m2: num(r.price_m2),
      rooms: num(r.rooms),
      bedrooms: num(r.bedrooms),
      bathrooms: num(r.bathrooms),
      orientation: r.orientation?.trim() || null,
      price_usd: price,
      currency_price: r.currency_price?.trim() || null,
      status,
    });
  });

  if (rowErrors.length > 0) {
    return NextResponse.json({ error: "Errores en filas del CSV:", details: rowErrors }, { status: 422 });
  }

  const inserted = await db`
    INSERT INTO units ${db(inserts, [
      "development_id", "identifier", "floor",
      "total_m2", "covered_m2", "uncovered_m2", "outdoor_m2", "semi_covered_m2", "total_homogeneous_m2",
      "price_m2", "rooms", "bedrooms", "bathrooms", "orientation",
      "price_usd", "currency_price", "status",
    ])}
    RETURNING id, identifier, development_id
  `;

  const affectedDevIds = Array.from(new Set(inserts.map((r) => r.development_id)));
  await db`UPDATE developments SET updated_at = NOW() WHERE id = ANY(${affectedDevIds})`;

  return NextResponse.json({ imported: inserted.length, units: inserted }, { status: 201 });
}
