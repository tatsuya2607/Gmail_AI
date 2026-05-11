import { NextRequest, NextResponse } from "next/server";
import { listMessages } from "@/lib/google";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }

  try {
    const messages = await listMessages(accountId);
    return NextResponse.json(messages);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch messages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
