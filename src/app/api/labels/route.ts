import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }
  const labels = db
    .prepare("SELECT * FROM labels WHERE account_id = ? ORDER BY created_at ASC")
    .all(accountId);
  return NextResponse.json({ labels });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { accountId, name, color } = body;
  if (!accountId || !name) {
    return NextResponse.json({ error: "accountId and name required" }, { status: 400 });
  }
  const result = db
    .prepare("INSERT INTO labels (account_id, name, color, created_at) VALUES (?, ?, ?, ?)")
    .run(accountId, name.trim(), color ?? "#3b82f6", Date.now());
  return NextResponse.json({ id: result.lastInsertRowid });
}
