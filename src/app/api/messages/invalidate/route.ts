import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }
  db.prepare("DELETE FROM message_list_cache WHERE account_id = ?").run(accountId);
  return NextResponse.json({ ok: true });
}
