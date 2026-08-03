import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { getSession } from "@/lib/auth";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
  ["image/svg+xml", ".svg"],
]);

/**
 * Stores product images under /public/uploads. Fine for a single-server
 * deployment; move to object storage (S3/Cloudinary) if this ever runs on
 * multiple instances or a read-only filesystem like Vercel's.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files received" }, { status: 400 });
  }
  if (files.length > 6) {
    return NextResponse.json({ error: "Up to 6 images at a time" }, { status: 400 });
  }

  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];

  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: `${file.name}: only JPG, PNG, WebP, AVIF or SVG are allowed` },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `${file.name} is larger than 5 MB` },
        { status: 400 },
      );
    }

    // Never trust the client filename — generate our own and force the
    // extension to match the validated MIME type.
    const ext = ALLOWED.get(file.type) ?? extname(file.name).toLowerCase();
    const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, name), bytes);
    urls.push(`/uploads/${name}`);
  }

  return NextResponse.json({ urls });
}
