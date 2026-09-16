import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { requireAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "uploads";
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 75;

async function processImage(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const output = await sharp(buffer)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  return { buffer: output, contentType: "image/webp", ext: "webp" };
}

async function uploadToSupabase(buffer: Buffer, contentType: string, filename: string, supabaseUrl: string, serviceRoleKey: string) {
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${filename}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": contentType,
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Error al subir imagen: ${detail}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${filename}`;
}

async function uploadToLocalDisk(buffer: Buffer, filename: string) {
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten imágenes." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo excede el máximo de 5 MB." }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const { buffer, contentType, ext } = await processImage(file);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const path = supabaseUrl && serviceRoleKey
      ? await uploadToSupabase(buffer, contentType, filename, supabaseUrl, serviceRoleKey)
      : await uploadToLocalDisk(buffer, filename);

    return NextResponse.json({ path });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al subir imagen." }, { status: 500 });
  }
}
