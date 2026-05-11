import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export function GET() {
  const accounts = db
    .prepare("SELECT id, email, name, created_at FROM accounts ORDER BY created_at ASC")
    .all();
  return NextResponse.json(accounts);
}

export function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
