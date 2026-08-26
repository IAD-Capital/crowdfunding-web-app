import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

// CSV columns (header row required):
// question  answer  is_active  available_in_chatbot
//
// Required: question, answer
// is_active: true/false (default: true) — available_in_chatbot: true/false (default: false)

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

function bool(v: string | undefined, def: boolean): boolean {
  if (!v?.trim()) return def;
  return ["true", "1", "si", "sí", "yes"].includes(v.trim().toLowerCase());
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
  };

  const inserts: InsertRow[] = [];
  const rowErrors: string[] = [];

  rows.forEach((r, i) => {
    const lineNum = i + 2;
    if (!r.question?.trim()) { rowErrors.push(`Fila ${lineNum}: question vacío`); return; }
    if (!r.answer?.trim()) { rowErrors.push(`Fila ${lineNum}: answer vacío`); return; }

    inserts.push({
      question: r.question.trim(),
      answer: r.answer.trim(),
      is_active: bool(r.is_active, true),
      available_in_chatbot: bool(r.available_in_chatbot, false),
    });
  });

  if (rowErrors.length > 0) {
    return NextResponse.json({ error: "Errores en filas del CSV:", details: rowErrors }, { status: 422 });
  }

  const [{ next_sort_order }] = await db`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order FROM faqs
  `;

  const insertsWithOrder = inserts.map((r, i) => ({ ...r, sort_order: Number(next_sort_order) + i }));

  const inserted = await db`
    INSERT INTO faqs ${db(insertsWithOrder, ["question", "answer", "is_active", "available_in_chatbot", "sort_order"])}
    RETURNING id, question
  `;

  return NextResponse.json({ imported: inserted.length, faqs: inserted }, { status: 201 });
}
