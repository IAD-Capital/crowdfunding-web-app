import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

// Accepts either a CSV or a JSON file.
//
// CSV columns (header row required):
// question  answer  is_active  available_in_chatbot  section
//
// JSON: an array of objects with the same fields, e.g.
// [{ "question": "...", "answer": "...", "is_active": true, "available_in_chatbot": false, "section": "..." }]
//
// Required: question, answer
// is_active: true/false (default: true) — available_in_chatbot: true/false (default: false)
// section: optional section name — matched case-insensitively to an existing faq_sections row,
// or created if no match exists. Left blank/omitted, the FAQ is left unsectioned.

type Row = Record<string, unknown>;

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

function bool(v: unknown, def: boolean): boolean {
  if (v === undefined || v === null || v === "") return def;
  if (typeof v === "boolean") return v;
  return ["true", "1", "si", "sí", "yes"].includes(String(v).trim().toLowerCase());
}

function parseJSONRows(text: string): Row[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("El archivo JSON no es válido.");
  }
  if (!Array.isArray(data)) {
    throw new Error("El JSON debe ser un array de preguntas.");
  }
  return data as Row[];
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
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
  const isJSON =
    (file as File).name.toLowerCase().endsWith(".json") ||
    (file as File).type === "application/json" ||
    text.trim().startsWith("[");

  let rows: Row[];
  try {
    rows = isJSON ? parseJSONRows(text) : parseCSV(text);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al parsear el archivo." }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({
      error: isJSON ? "El archivo JSON no tiene elementos." : "El archivo CSV está vacío o no tiene filas de datos.",
    }, { status: 400 });
  }

  const firstRow = rows[0];
  const missing = ["question", "answer"].filter((c) => !(c in firstRow));
  if (missing.length > 0) {
    return NextResponse.json({
      error: `Faltan columnas obligatorias: ${missing.join(", ")}.`,
    }, { status: 400 });
  }

  type InsertRow = {
    question: string;
    answer: string;
    is_active: boolean;
    available_in_chatbot: boolean;
    section_name: string | null;
  };

  const inserts: InsertRow[] = [];
  const rowErrors: string[] = [];

  rows.forEach((r, i) => {
    const label = isJSON ? `Elemento ${i + 1}` : `Fila ${i + 2}`;
    const question = str(r.question);
    const answer = str(r.answer);
    if (!question) { rowErrors.push(`${label}: question vacío`); return; }
    if (!answer) { rowErrors.push(`${label}: answer vacío`); return; }

    inserts.push({
      question,
      answer,
      is_active: bool(r.is_active, true),
      available_in_chatbot: bool(r.available_in_chatbot, false),
      section_name: str(r.section) || null,
    });
  });

  if (rowErrors.length > 0) {
    return NextResponse.json({
      error: isJSON ? "Errores en elementos del JSON:" : "Errores en filas del CSV:",
      details: rowErrors,
    }, { status: 422 });
  }

  const sectionIdByName = new Map<string, number>();
  const existingSections = await db`SELECT id, name FROM faq_sections`;
  for (const s of existingSections) sectionIdByName.set(String(s.name).trim().toLowerCase(), s.id);

  const uniqueNewSectionNames = Array.from(
    new Set(
      inserts
        .map((r) => r.section_name)
        .filter((name): name is string => !!name && !sectionIdByName.has(name.toLowerCase()))
    )
  );

  if (uniqueNewSectionNames.length > 0) {
    const [{ next_section_sort_order }] = await db`
      SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_section_sort_order FROM faq_sections
    `;
    const newSectionRows = uniqueNewSectionNames.map((name, i) => ({
      name,
      sort_order: Number(next_section_sort_order) + i,
    }));
    const createdSections = await db`
      INSERT INTO faq_sections ${db(newSectionRows, ["name", "sort_order"])}
      RETURNING id, name
    `;
    for (const s of createdSections) sectionIdByName.set(String(s.name).trim().toLowerCase(), s.id);
  }

  const [{ next_sort_order }] = await db`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order FROM faqs
  `;

  const insertsWithOrder = inserts.map((r, i) => ({
    question: r.question,
    answer: r.answer,
    is_active: r.is_active,
    available_in_chatbot: r.available_in_chatbot,
    section_id: r.section_name ? sectionIdByName.get(r.section_name.toLowerCase()) ?? null : null,
    sort_order: Number(next_sort_order) + i,
  }));

  const inserted = await db`
    INSERT INTO faqs ${db(insertsWithOrder, ["question", "answer", "is_active", "available_in_chatbot", "section_id", "sort_order"])}
    RETURNING id, question
  `;

  return NextResponse.json({ imported: inserted.length, faqs: inserted }, { status: 201 });
}
