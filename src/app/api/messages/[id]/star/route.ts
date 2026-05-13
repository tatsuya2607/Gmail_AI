import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import db from "@/lib/db";
import { getAuthenticatedClient } from "@/lib/google";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { accountId, starred } = body;

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  db.prepare(
    "INSERT OR REPLACE INTO starred_messages (message_id, account_id, is_starred, updated_at) VALUES (?, ?, ?, ?)"
  ).run(id, accountId, starred ? 1 : 0, Date.now());

  getAuthenticatedClient(accountId)
    .then((auth) => {
      const gmail = google.gmail({ version: "v1", auth });
      return gmail.users.messages.modify({
        userId: "me",
        id,
        requestBody: starred
          ? { addLabelIds: ["STARRED"] }
          : { removeLabelIds: ["STARRED"] },
      });
    })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
