import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

interface Template {
  id: number;
  name: string;
  prompt: string;
  created_at: number;
  updated_at: number;
}

export function GET() {
  const templates = db
    .prepare("SELECT * FROM templates ORDER BY name ASC")
    .all() as Template[];
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const { name, prompt } = await req.json();
  if (!name?.trim() || !prompt?.trim()) {
    return NextResponse.json({ error: "name and prompt are required" }, { status: 400 });
  }

  const now = Date.now();
  const result = db
    .prepare(
      "INSERT INTO templates (name, prompt, created_at, updated_at) VALUES (?, ?, ?, ?)"
    )
    .run(name.trim(), prompt.trim(), now, now);

  const created = db
    .prepare("SELECT * FROM templates WHERE id = ?")
    .get(result.lastInsertRowid) as Template;

  return NextResponse.json(created, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, name, prompt } = await req.json();
  if (!id || !name?.trim() || !prompt?.trim()) {
    return NextResponse.json({ error: "id, name and prompt are required" }, { status: 400 });
  }

  const now = Date.now();
  const result = db
    .prepare("UPDATE templates SET name = ?, prompt = ?, updated_at = ? WHERE id = ?")
    .run(name.trim(), prompt.trim(), now, id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const updated = db
    .prepare("SELECT * FROM templates WHERE id = ?")
    .get(id) as Template;

  return NextResponse.json(updated);
}

export function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const result = db.prepare("DELETE FROM templates WHERE id = ?").run(id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
