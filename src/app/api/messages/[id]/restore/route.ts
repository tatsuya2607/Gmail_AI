import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuthenticatedClient } from "@/lib/google";
import db from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { accountId } = body;

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  db.prepare("DELETE FROM local_trash WHERE message_id = ? AND account_id = ?").run(id, accountId);

  getAuthenticatedClient(accountId)
    .then((auth) => {
      const gmail = google.gmail({ version: "v1", auth });
      return gmail.users.messages.untrash({ userId: "me", id });
    })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
