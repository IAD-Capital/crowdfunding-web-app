import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

// CSV columns (header row required):
// name  website
//
// Required: name
// No logo is imported through this endpoint — add it later editing the developer.

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

export async function POST(req: NextRequest) {
  const { error } = await requireSuperAdmin();
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
  if (!("name" in firstRow)) {
    return NextResponse.json({ error: "Falta la columna obligatoria: name." }, { status: 400 });
  }

  type InsertRow = { name: string; website: string | null };

  const inserts: InsertRow[] = [];
  const rowErrors: string[] = [];

  rows.forEach((r, i) => {
    const lineNum = i + 2;
    if (!r.name?.trim()) { rowErrors.push(`Fila ${lineNum}: name vacío`); return; }

    inserts.push({
      name: r.name.trim(),
      website: r.website?.trim() || null,
    });
  });

  if (rowErrors.length > 0) {
    return NextResponse.json({ error: "Errores en filas del CSV:", details: rowErrors }, { status: 422 });
  }

  const inserted = await db`
    INSERT INTO developers ${db(inserts, ["name", "website"])}
    RETURNING id, name
  `;

  return NextResponse.json({ imported: inserted.length, developers: inserted }, { status: 201 });
}
