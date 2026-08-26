import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

// CSV columns (header row required):
// name  slug  address  neighborhood  city  country  description  completion_date  status
// developer_name  amenities  projected_value_usd  projected_gain_pct  zone_price_per_m2
// featured  visible
//
// Required: name, address
// amenities: semicolon-separated list, e.g. "Piscina;Gimnasio;SUM"
// completion_date: AAAA-MM-DD, AAAA-MM, or M/AAAA — MM/AAAA (e.g. "7/2027", "06/2028")
//   is stored as day 1 of that month
// status: active / completed / cancelled (default: active)
// featured: true/false (default: false) — visible: true/false (default: true)
// No images or units are imported through this endpoint.

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

function bool(v: string | undefined, def: boolean): boolean {
  if (!v?.trim()) return def;
  return ["true", "1", "si", "sí", "yes"].includes(v.trim().toLowerCase());
}

// Accepts:
//   - "M/AAAA" or "MM/AAAA"  (e.g. "7/2027", "06/2028") → stored as day 1 of that month
//   - "AAAA-MM"              (e.g. "2027-07")            → stored as day 1 of that month
//   - "AAAA-MM-DD"           (e.g. "2028-03-15")         → stored as-is
// Anything else (including unparseable/ambiguous strings previously accepted by
// Date.parse, which is locale/engine-dependent) is rejected explicitly.
function parseCompletionDate(raw: string | undefined): { value: string | null; error: boolean } {
  const v = raw?.trim();
  if (!v) return { value: null, error: false };

  // M/YYYY or MM/YYYY
  let m = v.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) {
    const month = Number(m[1]);
    const year = Number(m[2]);
    if (month < 1 || month > 12) return { value: null, error: true };
    return { value: `${year}-${String(month).padStart(2, "0")}-01`, error: false };
  }

  // YYYY-M or YYYY-MM
  m = v.match(/^(\d{4})-(\d{1,2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    if (month < 1 || month > 12) return { value: null, error: true };
    return { value: `${year}-${String(month).padStart(2, "0")}-01`, error: false };
  }

  // YYYY-MM-DD — validated against real calendar rollover (e.g. rejects 2027-02-30)
  m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const d = new Date(Date.UTC(year, month - 1, day));
    const valid = d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
    return valid ? { value: v, error: false } : { value: null, error: true };
  }

  return { value: null, error: true };
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
  const missing = ["name", "address"].filter((c) => !(c in firstRow));
  if (missing.length > 0) {
    return NextResponse.json({
      error: `Faltan columnas obligatorias: ${missing.join(", ")}.`,
    }, { status: 400 });
  }

  // Resolve developer names → ids in one query
  const developerNames = Array.from(
    new Set(rows.map((r) => r.developer_name?.trim()).filter((v): v is string => !!v))
  );
  const devRows = developerNames.length > 0
    ? await db<{ id: number; name: string }[]>`
        SELECT id, name FROM developers WHERE LOWER(name) = ANY(${developerNames.map((n) => n.toLowerCase())})
      `
    : [];
  const devIdByLowerName = new Map(devRows.map((d) => [d.name.toLowerCase(), d.id]));

  // Pre-check slug collisions against existing developments
  const slugs = Array.from(new Set(rows.map((r) => r.slug?.trim()).filter((v): v is string => !!v)));
  const existingSlugRows = slugs.length > 0
    ? await db<{ slug: string }[]>`SELECT slug FROM developments WHERE slug = ANY(${slugs})`
    : [];
  const existingSlugs = new Set(existingSlugRows.map((r) => r.slug));

  type InsertRow = {
    name: string;
    slug: string | null;
    address: string;
    neighborhood: string | null;
    city: string | null;
    country: string | null;
    description: string | null;
    completion_date: string | null;
    status: string;
    developer_id: number | null;
    amenities: string[];
    projected_value_usd: number | null;
    projected_gain_pct: number | null;
    zone_price_per_m2: number | null;
    featured: boolean;
    visible: boolean;
  };

  const inserts: InsertRow[] = [];
  const rowErrors: string[] = [];
  const validStatuses = new Set(["active", "completed", "cancelled"]);
  const seenSlugs = new Set<string>();

  rows.forEach((r, i) => {
    const lineNum = i + 2;
    if (!r.name?.trim()) { rowErrors.push(`Fila ${lineNum}: name vacío`); return; }
    if (!r.address?.trim()) { rowErrors.push(`Fila ${lineNum}: address vacío`); return; }

    const status = r.status?.trim().toLowerCase() || "active";
    if (!validStatuses.has(status)) {
      rowErrors.push(`Fila ${lineNum}: status inválido "${r.status}" (debe ser active, completed o cancelled)`);
      return;
    }

    let developer_id: number | null = null;
    const devName = r.developer_name?.trim();
    if (devName) {
      const id = devIdByLowerName.get(devName.toLowerCase());
      if (!id) { rowErrors.push(`Fila ${lineNum}: desarrolladora desconocida "${devName}"`); return; }
      developer_id = id;
    }

    const slug = r.slug?.trim() || null;
    if (slug) {
      if (existingSlugs.has(slug)) { rowErrors.push(`Fila ${lineNum}: slug "${slug}" ya existe`); return; }
      if (seenSlugs.has(slug)) { rowErrors.push(`Fila ${lineNum}: slug "${slug}" duplicado en el archivo`); return; }
      seenSlugs.add(slug);
    }

    const { value: completion_date, error: completionDateError } = parseCompletionDate(r.completion_date);
    if (completionDateError) {
      rowErrors.push(
        `Fila ${lineNum}: completion_date inválida "${r.completion_date}" (usar AAAA-MM-DD o MM/AAAA, ej: 07/2027)`
      );
      return;
    }

    const amenities = (r.amenities ?? "").split(";").map((a) => a.trim()).filter(Boolean);

    inserts.push({
      name: r.name.trim(),
      slug,
      address: r.address.trim(),
      neighborhood: r.neighborhood?.trim() || null,
      city: r.city?.trim() || null,
      country: r.country?.trim() || null,
      description: r.description?.trim() || null,
      completion_date,
      status,
      developer_id,
      amenities,
      projected_value_usd: num(r.projected_value_usd),
      projected_gain_pct: num(r.projected_gain_pct),
      zone_price_per_m2: num(r.zone_price_per_m2),
      featured: bool(r.featured, false),
      visible: bool(r.visible, true),
    });
  });

  if (rowErrors.length > 0) {
    return NextResponse.json({ error: "Errores en filas del CSV:", details: rowErrors }, { status: 422 });
  }

  const inserted = await db`
    INSERT INTO developments ${db(inserts, [
      "name", "slug", "address", "neighborhood", "city", "country", "description", "completion_date",
      "status", "developer_id", "amenities", "projected_value_usd", "projected_gain_pct",
      "zone_price_per_m2", "featured", "visible",
    ])}
    RETURNING id, name, slug
  `;

  return NextResponse.json({ imported: inserted.length, developments: inserted }, { status: 201 });
}
