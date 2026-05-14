import { NextRequest, NextResponse } from "next/server";
import { trashMessage } from "@/lib/google";
import db from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  db.prepare("DELETE FROM local_trash WHERE message_id = ? AND account_id = ?").run(id, accountId);
  return NextResponse.json({ ok: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { accountId, messageSnapshot } = body;

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  if (messageSnapshot) {
    db.prepare(
      "INSERT OR REPLACE INTO local_trash (message_id, account_id, message_json, trashed_at) VALUES (?, ?, ?, ?)"
    ).run(id, accountId, JSON.stringify(messageSnapshot), Date.now());
  }

  trashMessage(accountId, id).catch(() => {});
  return NextResponse.json({ ok: true });
}
