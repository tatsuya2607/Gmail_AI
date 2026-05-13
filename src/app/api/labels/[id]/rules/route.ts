import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { pattern } = body;
  if (!pattern) {
    return NextResponse.json({ error: "pattern required" }, { status: 400 });
  }
  const result = db
    .prepare("INSERT INTO label_rules (label_id, pattern, created_at) VALUES (?, ?, ?)")
    .run(parseInt(id), pattern.trim().toLowerCase(), Date.now());
  return NextResponse.json({ id: result.lastInsertRowid });
}
