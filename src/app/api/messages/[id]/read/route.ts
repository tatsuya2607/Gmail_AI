import { NextRequest, NextResponse } from "next/server";
import { markAsRead } from "@/lib/google";
import db from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { accountId } = body;

  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  // Always record locally so the UI reflects read status immediately
  db.prepare(
    "INSERT OR REPLACE INTO read_messages (message_id, account_id, marked_at) VALUES (?, ?, ?)"
  ).run(id, accountId, Date.now());

  // Also try to mark as read in Gmail (requires gmail.modify scope; silent fail if not available)
  markAsRead(accountId, id).catch(() => {});

  return NextResponse.json({ ok: true });
}
